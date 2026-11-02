import { neon } from "@neondatabase/serverless";

// Limite por janela fixa. O contador fica no banco, porque cada instância da função edge tem memória própria.

export type Limit = { hits: number; windowSeconds: number };

// Na entrada, só contam os códigos errados: a turma inteira sai pelo mesmo IP da escola,
// e entradas certas não podem bloquear quem ainda vai entrar.
export const JOIN_LIMIT: Limit = { hits: 30, windowSeconds: 600 };
// Criação de sessão por IP: vários professores da mesma escola cabem com folga.
export const SESSION_CREATE_LIMIT: Limit = { hits: 10, windowSeconds: 3600 };
// Turnos do tutor por aluno (uma mensagem a cada 20 segundos, em média) e por sessão.
export const TUTOR_PARTICIPANT_LIMIT: Limit = { hits: 30, windowSeconds: 600 };
export const TUTOR_SESSION_LIMIT: Limit = { hits: 600, windowSeconds: 600 };

// Linhas mais antigas que isto já não contam para nenhum limite e são apagadas.
const RETENTION_SECONDS = 3600;

export function isWithinLimit(hits: number, limit: number): boolean {
  return hits <= limit;
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim();
  return ip && ip.length <= 64 ? ip : "desconhecido";
}

export async function ensureRateLimitTable(databaseUrl: string): Promise<void> {
  const sql = neon(databaseUrl);
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key           TEXT        PRIMARY KEY,
      hits          INTEGER     NOT NULL,
      window_start  TIMESTAMPTZ NOT NULL
    )`;
}

// Conta uma tentativa e devolve se ela ainda está dentro do limite da janela atual.
export async function registerAttempt(databaseUrl: string, key: string, limit: Limit): Promise<boolean> {
  await ensureRateLimitTable(databaseUrl);
  const sql = neon(databaseUrl);
  const rows = await sql`
    INSERT INTO rate_limits (key, hits, window_start) VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      hits = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${limit.windowSeconds})
                  THEN 1 ELSE rate_limits.hits + 1 END,
      window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${limit.windowSeconds})
                          THEN now() ELSE rate_limits.window_start END
    RETURNING hits`;
  // Os contadores guardam IPs: os vencidos saem logo, em vez de ficar no banco para sempre.
  await sql`DELETE FROM rate_limits WHERE window_start < now() - make_interval(secs => ${RETENTION_SECONDS})`;
  const row = rows[0] as { hits: number };
  return isWithinLimit(row.hits, limit.hits);
}

// Lê o contador sem somar uma tentativa. Serve para recusar antes de procurar o código,
// sem que as entradas certas contem.
export async function isBlocked(databaseUrl: string, key: string, limit: Limit): Promise<boolean> {
  await ensureRateLimitTable(databaseUrl);
  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT hits FROM rate_limits
    WHERE key = ${key} AND window_start >= now() - make_interval(secs => ${limit.windowSeconds})`;
  const row = rows[0] as { hits: number } | undefined;
  // Já chegou ao limite: a próxima tentativa passaria dele.
  return row ? row.hits >= limit.hits : false;
}
