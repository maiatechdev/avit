-- Esquema mínimo do MVP. Rodar uma vez no SQL Editor do Neon (ou via Storage do Vercel).
-- Não guarda conversas: apenas contadores de tentativas por exercício.

CREATE TABLE IF NOT EXISTS attempts (
  session_id   TEXT        NOT NULL,
  exercise_id  TEXT        NOT NULL,
  wrong_count  INTEGER     NOT NULL DEFAULT 0,
  solved       BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, exercise_id)
);
