import { createNeonSessionsStore } from "../../../lib/sessions/store";
import { joinSession, SessionNotFoundError } from "../../../lib/sessions/service";
import { ensureParticipantsTable, joinAsParticipant } from "../../../lib/participants/participants";
import { clientKey, isBlocked, JOIN_LIMIT, registerAttempt } from "../../../lib/http/rateLimit";
import { errorResponse, json } from "../../../lib/http/response";
import { credentialCookie, participantCookieName, readCookie } from "../../../lib/auth/cookies";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return errorResponse("method_not_allowed", 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_json", 400);
  }

  const { code } = (body ?? {}) as { code?: unknown };
  if (typeof code !== "string" || code.trim().length === 0 || code.length > 20) {
    return errorResponse("invalid_code", 400, "Informe o código da sessão, no formato SOC-1234.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return errorResponse("database_not_configured", 503);

  const limitKey = `join:${await clientKey(request)}`;
  try {
    // Só os códigos errados contam: a turma inteira entra pelo mesmo IP da escola.
    if (await isBlocked(databaseUrl, limitKey, JOIN_LIMIT)) {
      return errorResponse("too_many_attempts", 429, "Muitas tentativas. Espere alguns minutos e tente de novo.", {
        "retry-after": String(JOIN_LIMIT.windowSeconds),
      });
    }

    let session: Awaited<ReturnType<typeof joinSession>>;
    try {
      session = await joinSession(code, createNeonSessionsStore(databaseUrl));
    } catch (error) {
      if (error instanceof SessionNotFoundError) await registerAttempt(databaseUrl, limitKey, JOIN_LIMIT);
      throw error;
    }
    await ensureParticipantsTable(databaseUrl);
    // Quem entra de novo no mesmo aparelho mantém o token, e com ele o histórico.
    const previousToken = readCookie(request, participantCookieName(session.id)) ?? undefined;
    const token = await joinAsParticipant(databaseUrl, session.id, previousToken);

    return json(
      { id: session.id, objective: session.objective },
      200,
      { "set-cookie": credentialCookie(participantCookieName(session.id), token) },
    );
  } catch (error) {
    if (error instanceof SessionNotFoundError) return errorResponse("session_not_found", 404);
    return errorResponse("internal_error", 500);
  }
}
