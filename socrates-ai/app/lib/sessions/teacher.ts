import { neon } from "@neondatabase/serverless";
import { hashToken } from "../auth/tokens";

// Sessões criadas antes da Story 3.5 não têm hash de professor, então ninguém passa nessa checagem.
export async function isTeacherOf(databaseUrl: string, sessionId: string, token: string): Promise<boolean> {
  const sql = neon(databaseUrl);
  const rows = await sql`SELECT teacher_token_hash FROM sessions WHERE id = ${sessionId}`;
  const row = rows[0] as { teacher_token_hash: string | null } | undefined;
  if (!row?.teacher_token_hash) return false;
  return row.teacher_token_hash === (await hashToken(token));
}
