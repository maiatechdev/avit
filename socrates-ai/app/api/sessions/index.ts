import { createNeonSessionsStore } from "../../lib/sessions/store";
import { createSession, SessionCodeCollisionError, validateObjective } from "../../lib/sessions/service";
import { purgeExpired } from "../../lib/privacy/retention";
import { errorResponse, json } from "../../lib/http/response";
import { credentialCookie, teacherCookieName } from "../../lib/auth/cookies";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return errorResponse("method_not_allowed", 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_json", 400);
  }

  const objective = validateObjective((body as { objective?: unknown } | null)?.objective);
  if (!objective) return errorResponse("invalid_objective", 400, "O objetivo precisa ter entre 3 e 140 caracteres.");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return errorResponse("database_not_configured", 503);

  try {
    const { teacherToken, ...session } = await createSession(objective, createNeonSessionsStore(databaseUrl));
    // Limpeza do prazo de retenção a cada criação de sessão. Se falhar, a sessão nova ainda é criada.
    await purgeExpired(databaseUrl).catch(() => undefined);
    // O token do professor vai só no cookie HttpOnly: a página não consegue lê-lo.
    return json(session, 201, { "set-cookie": credentialCookie(teacherCookieName(session.id), teacherToken) });
  } catch (error) {
    if (error instanceof SessionCodeCollisionError) return errorResponse("code_unavailable", 503);
    return errorResponse("internal_error", 500);
  }
}
