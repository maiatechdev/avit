import { neon } from "@neondatabase/serverless";
import { ensureCheckinsTable } from "../checkins/checkin";
import { ensureParticipationsTable } from "../dashboard/summary";
import { ensureParticipantsTable } from "../participants/participants";
import { ensureAttemptsTable } from "../tutor/attempts";

// Prazo de retenção: sessões mais antigas que isso são apagadas com todos os dados dos alunos.
export const RETENTION_DAYS = 90;

async function ensureAllTables(databaseUrl: string): Promise<void> {
  await ensureCheckinsTable(databaseUrl);
  await ensureParticipationsTable(databaseUrl);
  await ensureAttemptsTable(databaseUrl);
  await ensureParticipantsTable(databaseUrl);
}

// Apaga a sessão e tudo o que foi gravado nela, numa única transação.
export async function eraseSession(databaseUrl: string, sessionId: string): Promise<void> {
  await ensureAllTables(databaseUrl);
  const sql = neon(databaseUrl);
  await sql.transaction([
    sql`DELETE FROM checkins WHERE session_id = ${sessionId}`,
    sql`DELETE FROM participations WHERE session_id = ${sessionId}`,
    sql`DELETE FROM participant_attempts WHERE session_id = ${sessionId}`,
    sql`DELETE FROM participants WHERE session_id = ${sessionId}`,
    sql`DELETE FROM sessions WHERE id = ${sessionId}`,
  ]);
}

// Apaga, numa transação, tudo o que passou do prazo de retenção.
export async function purgeExpired(databaseUrl: string, days: number = RETENTION_DAYS): Promise<void> {
  await ensureAllTables(databaseUrl);
  const sql = neon(databaseUrl);
  await sql.transaction([
    sql`DELETE FROM checkins WHERE session_id IN (SELECT id FROM sessions WHERE created_at < now() - make_interval(days => ${days}))`,
    sql`DELETE FROM participations WHERE session_id IN (SELECT id FROM sessions WHERE created_at < now() - make_interval(days => ${days}))`,
    sql`DELETE FROM participant_attempts WHERE session_id IN (SELECT id FROM sessions WHERE created_at < now() - make_interval(days => ${days}))`,
    sql`DELETE FROM participants WHERE session_id IN (SELECT id FROM sessions WHERE created_at < now() - make_interval(days => ${days}))`,
    sql`DELETE FROM sessions WHERE created_at < now() - make_interval(days => ${days})`,
  ]);
}

// Valida o corpo do pedido de exclusão. O identificador tem que ser um texto curto.
export function parseSessionId(body: unknown): string | null {
  const id = (body as { sessionId?: unknown } | null)?.sessionId;
  return typeof id === "string" && id.length > 0 && id.length <= 64 ? id : null;
}
