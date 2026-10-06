import { createNeonSessionsStore } from "../../../lib/sessions/store";
import { joinSession, SessionNotFoundError } from "../../../lib/sessions/service";
import { ensureParticipantsTable, joinAsParticipant } from "../../../lib/participants/participants";
import { clientKey, JOIN_LIMIT, registerAttempt } from "../../../lib/http/rateLimit";
import { errorResponse, json } from "../../../lib/http/response";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return errorResponse("method_not_allowed", 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_json", 400);
  }

  const { code, participantToken } = (body ?? {}) as { code?: unknown; participantToken?: unknown };
  if (typeof code !== "string" || code.trim().length === 0 || code.length > 20) {
    return errorResponse("invalid_code", 400, "Informe o código da sessão, no formato SOC-1234.");
  }
  const previousToken =
    typeof participantToken === "string" && participantToken.length > 0 && participantToken.length <= 128
      ? participantToken
      : undefined;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return errorResponse("database_not_configured", 503);

  try {
    // Conta a tentativa antes de procurar o código: quem testa códigos ao acaso também conta.
    const allowed = await registerAttempt(databaseUrl, `join:${clientKey(request)}`, JOIN_LIMIT);
    if (!allowed) {
      return errorResponse("too_many_attempts", 429, "Muitas tentativas. Espere alguns minutos e tente de novo.", {
        "retry-after": String(JOIN_LIMIT.windowSeconds),
      });
    }

    const session = await joinSession(code, createNeonSessionsStore(databaseUrl));
    await ensureParticipantsTable(databaseUrl);
    const token = await joinAsParticipant(databaseUrl, session.id, previousToken);
    return json({ id: session.id, objective: session.objective, participantToken: token });
  } catch (error) {
    if (error instanceof SessionNotFoundError) return errorResponse("session_not_found", 404);
    return errorResponse("internal_error", 500);
  }
}
