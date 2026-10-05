import { neon } from "@neondatabase/serverless";

export const PATHS = ["investigar", "criar", "resolver", "colaborar"] as const;
export type PathId = (typeof PATHS)[number];

export type DashboardRaw = {
  students: number;
  chosen: number;
  paths: Partial<Record<PathId, number>>;
  stuck: number;
  solvedExercises: number;
};

export type Dashboard = {
  students: number;
  engagement: number;
  autonomy: number;
  competence: number;
  bond: number;
  pathCounts: Record<PathId, number>;
  stuckShare: number;
  suggestion: string;
};

const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

export function suggestionFor(stuckShare: number, engagement: number): string {
  if (stuckShare >= 40) return "Retome o conceito de função antes de avançar com exercícios.";
  if (engagement < 60) return "Confira se todos conseguiram entrar e escolher uma trilha.";
  return "A turma avançou bem. Proponha um desafio com a trilha Criar.";
}

export function summarize(raw: DashboardRaw): Dashboard {
  const pathCounts = Object.fromEntries(PATHS.map((p) => [p, raw.paths[p] ?? 0])) as Record<PathId, number>;
  const distinctPaths = PATHS.filter((p) => pathCounts[p] > 0).length;
  const engagement = pct(raw.chosen, raw.students);
  const stuckShare = pct(raw.stuck, raw.students);
  return {
    students: raw.students,
    engagement,
    autonomy: pct(distinctPaths, PATHS.length),
    competence: Math.min(100, pct(raw.solvedExercises, raw.students)),
    bond: pct(pathCounts.colaborar, raw.students),
    pathCounts,
    stuckShare,
    suggestion: suggestionFor(stuckShare, engagement),
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

  const [students] = await sql`
    SELECT COUNT(*)::int AS n, COUNT(*) FILTER (WHERE difficulty = 'nao_entendi')::int AS stuck
    FROM checkins WHERE session_id = ${sessionId}`;
  const [chosen] = await sql`
    SELECT COUNT(*)::int AS n FROM participations WHERE session_id = ${sessionId}`;
  const pathRows = await sql`
    SELECT path, COUNT(*)::int AS n FROM participations WHERE session_id = ${sessionId} GROUP BY path`;
  const [solved] = await sql`
    SELECT COUNT(*) FILTER (WHERE solved)::int AS n FROM attempts WHERE session_id = ${sessionId}`;

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
    solvedExercises: (solved as { n: number }).n,
  };
}
