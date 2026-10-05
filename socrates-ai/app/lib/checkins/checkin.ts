import { neon } from "@neondatabase/serverless";

export const DIFFICULTIES = ["entendo", "duvidas", "nao_entendi"] as const;
export const TIMES = ["pouco", "medio", "bastante"] as const;
export const FEELINGS = ["animado", "ok", "cansado", "desmotivado"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];
export type TimeAvailable = (typeof TIMES)[number];
export type Feeling = (typeof FEELINGS)[number];

export type Checkin = {
  sessionId: string;
  participantId: string;
  difficulty: Difficulty;
  time: TimeAvailable;
  feeling: Feeling;
};

const isOneOf = <T extends string>(options: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (options as readonly string[]).includes(value);

export function validateCheckin(raw: unknown): Checkin | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const { sessionId, participantId, difficulty, time, feeling } = body;
  if (typeof sessionId !== "string" || sessionId.length === 0 || sessionId.length > 64) return null;
  if (typeof participantId !== "string" || participantId.length === 0 || participantId.length > 64) return null;
  if (!isOneOf(DIFFICULTIES, difficulty) || !isOneOf(TIMES, time) || !isOneOf(FEELINGS, feeling)) return null;
  return { sessionId, participantId, difficulty, time, feeling };
}

export function missionFor(checkin: Pick<Checkin, "difficulty" | "time">): string {
  const base =
    checkin.difficulty === "nao_entendi"
      ? "Vamos começar do zero: o que significa trocar x por um número numa função?"
      : checkin.difficulty === "duvidas"
        ? "Vamos resolver juntos, com dicas aos poucos."
        : "Desafio direto: você consegue resolver sozinho?";
  return checkin.time === "pouco" ? `${base} (missão curta)` : base;
}

export interface CheckinStore {
  save(checkin: Checkin): Promise<void>;
}

export function createNeonCheckinStore(databaseUrl: string): CheckinStore {
  const sql = neon(databaseUrl);
  let schemaReady: Promise<unknown> | undefined;
  const ensureSchema = () => {
    schemaReady ??= sql`
      CREATE TABLE IF NOT EXISTS checkins (
        session_id      TEXT        NOT NULL,
        participant_id  TEXT        NOT NULL,
        difficulty      TEXT        NOT NULL,
        time_available  TEXT        NOT NULL,
        feeling         TEXT        NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (session_id, participant_id)
      )`;
    return schemaReady;
  };

  return {
    async save(checkin) {
      await ensureSchema();
      await sql`
        INSERT INTO checkins (session_id, participant_id, difficulty, time_available, feeling)
        VALUES (${checkin.sessionId}, ${checkin.participantId}, ${checkin.difficulty}, ${checkin.time}, ${checkin.feeling})
        ON CONFLICT (session_id, participant_id)
        DO UPDATE SET difficulty = EXCLUDED.difficulty, time_available = EXCLUDED.time_available,
                      feeling = EXCLUDED.feeling, created_at = now()`;
    },
  };
}
