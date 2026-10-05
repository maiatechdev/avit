import { neon } from "@neondatabase/serverless";

export type Session = { id: string; code: string; objective: string };

export interface SessionsStore {
  create(objective: string, code: string, teacherTokenHash: string): Promise<Session>;
  findByCode(code: string): Promise<Session | null>;
}

export function createNeonSessionsStore(databaseUrl: string): SessionsStore {
  const sql = neon(databaseUrl);
  let schemaReady: Promise<unknown> | undefined;
  const ensureSchema = () => {
    schemaReady ??= sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id          TEXT        PRIMARY KEY,
        code        TEXT        UNIQUE NOT NULL,
        objective   TEXT        NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`.then(
      () => sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS teacher_token_hash TEXT`,
    );
    return schemaReady;
  };

  return {
    async create(objective, code, teacherTokenHash) {
      await ensureSchema();
      const id = crypto.randomUUID();
      await sql`
        INSERT INTO sessions (id, code, objective, teacher_token_hash)
        VALUES (${id}, ${code}, ${objective}, ${teacherTokenHash})`;
      return { id, code, objective };
    },

    async findByCode(code) {
      await ensureSchema();
      const rows = await sql`
        SELECT id, code, objective FROM sessions WHERE code = ${code}`;
      const row = rows[0] as { id: string; code: string; objective: string } | undefined;
      return row ? { id: row.id, code: row.code, objective: row.objective } : null;
    },
  };
}
