import { neon } from "@neondatabase/serverless";

export type AttemptState = { wrongCount: number; solved: boolean };

export interface AttemptsStore {
  get(sessionId: string, participantId: string, exerciseId: string): Promise<AttemptState>;
  save(sessionId: string, participantId: string, exerciseId: string, state: AttemptState): Promise<void>;
}

export function createNeonAttemptsStore(databaseUrl: string): AttemptsStore {
  const sql = neon(databaseUrl);
  let schemaReady: Promise<unknown> | undefined;
  const ensureSchema = () => {
    schemaReady ??= sql`
      CREATE TABLE IF NOT EXISTS participant_attempts (
        session_id      TEXT        NOT NULL,
        participant_id  TEXT        NOT NULL,
        exercise_id     TEXT        NOT NULL,
        wrong_count     INTEGER     NOT NULL DEFAULT 0,
        solved          BOOLEAN     NOT NULL DEFAULT FALSE,
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (session_id, participant_id, exercise_id)
      )`;
    return schemaReady;
  };

  return {
    async get(sessionId, participantId, exerciseId) {
      await ensureSchema();
      await sql`
        INSERT INTO participant_attempts (session_id, participant_id, exercise_id)
        VALUES (${sessionId}, ${participantId}, ${exerciseId})
        ON CONFLICT (session_id, participant_id, exercise_id) DO NOTHING`;
      const rows = await sql`
        SELECT wrong_count, solved FROM participant_attempts
        WHERE session_id = ${sessionId} AND participant_id = ${participantId} AND exercise_id = ${exerciseId}`;
      const row = rows[0] as { wrong_count: number; solved: boolean };
      return { wrongCount: row.wrong_count, solved: row.solved };
    },

    async save(sessionId, participantId, exerciseId, state) {
      await ensureSchema();
      await sql`
        UPDATE participant_attempts
        SET wrong_count = ${state.wrongCount}, solved = ${state.solved}, updated_at = now()
        WHERE session_id = ${sessionId} AND participant_id = ${participantId} AND exercise_id = ${exerciseId}`;
    },
  };
}

export function createMemoryAttemptsStore(): AttemptsStore {
  const data = new Map<string, AttemptState>();
  const key = (s: string, p: string, e: string) => `${s}::${p}::${e}`;
  return {
    async get(sessionId, participantId, exerciseId) {
      return data.get(key(sessionId, participantId, exerciseId)) ?? { wrongCount: 0, solved: false };
    },
    async save(sessionId, participantId, exerciseId, state) {
      data.set(key(sessionId, participantId, exerciseId), state);
    },
  };
}
