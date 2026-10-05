import { neon } from "@neondatabase/serverless";
import { ensureAttemptsTable } from "../tutor/attempts";

export const PATHS = ["investigar", "criar", "resolver", "colaborar"] as const;
export type PathId = (typeof PATHS)[number];

// Abaixo deste número de alunos, percentuais falam de uma ou duas pessoas e não representam a turma.
export const MIN_RESPONSES = 5;

export type DashboardRaw = {
  students: number;
  chosen: number;
  paths: Partial<Record<PathId, number>>;
  stuck: number;
  solvers: number;
};

export type Dashboard = {
  students: number;
  enough: boolean;
  required: number;
  engagement: number;
  autonomy: number;
  competence: number;
  bond: number;
  pathCounts: Record<PathId, number>;
  stuckShare: number;
  suggestion: string;
};

const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.min(100, Math.round((part / whole) * 100)));

export function suggestionFor(stuckShare: number, engagement: number): string {
  if (stuckShare >= 40) return "Retome o conceito de função antes de avançar com exercícios.";
  if (engagement < 60) return "Confira se todos conseguiram entrar e escolher uma trilha.";
  return "A turma avançou bem. Proponha um desafio com a trilha Criar.";
}

export function summarize(raw: DashboardRaw): Dashboard {
  const pathCounts = Object.fromEntries(PATHS.map((p) => [p, raw.paths[p] ?? 0])) as Record<PathId, number>;
  const distinctPaths = PATHS.filter((p) => pathCounts[p] > 0).length;
  const enough = raw.students >= MIN_RESPONSES;
  const engagement = pct(raw.chosen, raw.students);
  const stuckShare = pct(raw.stuck, raw.students);
  return {
    students: raw.students,
    enough,
    required: MIN_RESPONSES,
    engagement,
    autonomy: pct(distinctPaths, PATHS.length),
    competence: pct(raw.solvers, raw.students),
    bond: pct(pathCounts.colaborar, raw.students),
    pathCounts,
    stuckShare,
    suggestion: enough ? suggestionFor(stuckShare, engagement) : "Aguarde mais respostas para receber uma sugestão.",
  };
}

export async function ensureParticipationsTable(databaseUrl: string): Promise<void> {
  const sql = neon(databaseUrl);
  await sql`
    CREATE TABLE IF NOT EXISTS participations (
      session_id      TEXT        NOT NULL,
      participant_id  TEXT        NOT NULL,
      path            TEXT        NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (session_id, participant_id)
    )`;
}

export async function savePath(databaseUrl: string, sessionId: string, participantId: string, path: string): Promise<void> {
  const sql = neon(databaseUrl);
  await sql`
    INSERT INTO participations (session_id, participant_id, path)
    VALUES (${sessionId}, ${participantId}, ${path})
    ON CONFLICT (session_id, participant_id) DO UPDATE SET path = EXCLUDED.path, created_at = now()`;
}

export async function readDashboard(databaseUrl: string, sessionId: string): Promise<DashboardRaw | null> {
  const sql = neon(databaseUrl);
  const exists = await sql`SELECT 1 FROM sessions WHERE id = ${sessionId}`;
  if (exists.length === 0) return null;

  await ensureParticipationsTable(databaseUrl);
  await ensureAttemptsTable(databaseUrl);

  // Só conta quem fez check-in: escolhas e soluções de quem não entrou pelo check-in não entram nos percentuais.
  const [students] = await sql`
    SELECT COUNT(*)::int AS n, COUNT(*) FILTER (WHERE difficulty = 'nao_entendi')::int AS stuck
    FROM checkins WHERE session_id = ${sessionId}`;
  const [chosen] = await sql`
    SELECT COUNT(*)::int AS n FROM participations p
    WHERE p.session_id = ${sessionId}
      AND EXISTS (SELECT 1 FROM checkins c WHERE c.session_id = p.session_id AND c.participant_id = p.participant_id)`;
  const pathRows = await sql`
    SELECT p.path, COUNT(*)::int AS n FROM participations p
    WHERE p.session_id = ${sessionId}
      AND EXISTS (SELECT 1 FROM checkins c WHERE c.session_id = p.session_id AND c.participant_id = p.participant_id)
    GROUP BY p.path`;
  const [solvers] = await sql`
    SELECT COUNT(DISTINCT a.participant_id)::int AS n FROM participant_attempts a
    WHERE a.session_id = ${sessionId} AND a.solved
      AND EXISTS (SELECT 1 FROM checkins c WHERE c.session_id = a.session_id AND c.participant_id = a.participant_id)`;

  const paths: Partial<Record<PathId, number>> = {};
  for (const row of pathRows as { path: string; n: number }[]) {
    if ((PATHS as readonly string[]).includes(row.path)) paths[row.path as PathId] = row.n;
  }

  const s = students as { n: number; stuck: number };
  return {
    students: s.n,
    chosen: (chosen as { n: number }).n,
    paths,
    stuck: s.stuck,
    solvers: (solvers as { n: number }).n,
  };
}
