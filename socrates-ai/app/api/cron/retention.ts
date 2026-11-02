import { purgeExpired } from "../../lib/privacy/retention";
import { purgeRateLimits } from "../../lib/http/rateLimit";
import { isAuthorizedCron } from "../../lib/http/cron";
import { errorResponse, json } from "../../lib/http/response";

export const config = { runtime: "edge" };

// Rotina diária (vercel.json → crons): apaga as sessões vencidas e os contadores de tentativas,
// mesmo em dias sem nenhuma sessão nova. A Vercel envia CRON_SECRET no cabeçalho Authorization.
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return errorResponse("method_not_allowed", 405);
  if (!isAuthorizedCron(request, process.env.CRON_SECRET)) return errorResponse("unauthorized", 401);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return errorResponse("database_not_configured", 503);

  try {
    await purgeExpired(databaseUrl);
    await purgeRateLimits(databaseUrl);
    return json({ ok: true });
  } catch {
    return errorResponse("internal_error", 500);
  }
}
