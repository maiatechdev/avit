import { neon } from "@neondatabase/serverless";

export type AttemptState = { wrongCount: number; solved: boolean };

export interface AttemptsStore {
  get(sessionId: string, exerciseId: string): Promise<AttemptState>;
  save(sessionId: string, exerciseId: string, state: AttemptState): Promise<void>;
}

export function createNeonAttemptsStore(databaseUrl: string): AttemptsStore {
  const sql = neon(databaseUrl);

  return {
    async get(sessionId, exerciseId) {
      await sql`
        INSERT INTO attempts (session_id, exercise_id)
        VALUES (${sessionId}, ${exerciseId})
        ON CONFLICT (session_id, exercise_id) DO NOTHING`;
      const rows = await sql`
        SELECT wrong_count, solved FROM attempts
        WHERE session_id = ${sessionId} AND exercise_id = ${exerciseId}`;
      const row = rows[0] as { wrong_count: number; solved: boolean };
      return { wrongCount: row.wrong_count, solved: row.solved };
    },

    async save(sessionId, exerciseId, state) {
      await sql`
        UPDATE attempts
        SET wrong_count = ${state.wrongCount}, solved = ${state.solved}, updated_at = now()
        WHERE session_id = ${sessionId} AND exercise_id = ${exerciseId}`;
    },
  };
}

export function createMemoryAttemptsStore(): AttemptsStore {
  const data = new Map<string, AttemptState>();
  const key = (s: string, e: string) => `${s}::${e}`;
  return {
    async get(sessionId, exerciseId) {
      return data.get(key(sessionId, exerciseId)) ?? { wrongCount: 0, solved: false };
    },
    async save(sessionId, exerciseId, state) {
      data.set(key(sessionId, exerciseId), state);
    },
  };
}
