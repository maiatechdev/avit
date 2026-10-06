import { neon } from "@neondatabase/serverless";

// Limite por janela fixa. O contador fica no banco, porque cada instância da função edge tem memória própria.

export const JOIN_LIMIT = { hits: 20, windowSeconds: 600 };

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
export async function registerAttempt(
  databaseUrl: string,
  key: string,
  limit: { hits: number; windowSeconds: number },
): Promise<boolean> {
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
  const row = rows[0] as { hits: number };
  return isWithinLimit(row.hits, limit.hits);
}
