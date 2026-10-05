import { neon } from "@neondatabase/serverless";
import { hashToken, newToken } from "../auth/tokens";

export async function ensureParticipantsTable(databaseUrl: string): Promise<void> {
  const sql = neon(databaseUrl);
  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      token_hash      TEXT        PRIMARY KEY,
      session_id      TEXT        NOT NULL,
      participant_id  TEXT        NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
}

// Cria um participante novo, ou reaproveita o token se ele ainda for válido nessa sessão.
// Assim, quem entra de novo no mesmo aparelho mantém o histórico (check-in, trilha e chat).
export async function joinAsParticipant(
  databaseUrl: string,
  sessionId: string,
  previousToken?: string,
): Promise<string> {
  if (previousToken && (await resolveParticipant(databaseUrl, sessionId, previousToken))) return previousToken;

  const sql = neon(databaseUrl);
  const token = newToken();
  await sql`
    INSERT INTO participants (token_hash, session_id, participant_id)
    VALUES (${await hashToken(token)}, ${sessionId}, ${crypto.randomUUID()})`;
  return token;
}

// Devolve o id interno do participante, ou null se o token não pertence a essa sessão.
// Não cria tabelas: join já garante a existência, e o tutor chama esta função a cada turno.
export async function resolveParticipant(databaseUrl: string, sessionId: string, token: string): Promise<string | null> {
  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT participant_id FROM participants
    WHERE token_hash = ${await hashToken(token)} AND session_id = ${sessionId}`;
  const row = rows[0] as { participant_id: string } | undefined;
  return row ? row.participant_id : null;
}
