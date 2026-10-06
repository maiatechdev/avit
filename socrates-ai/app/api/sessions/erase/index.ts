import { isTeacherOf } from "../../../lib/sessions/teacher";
import { eraseSession, parseSessionId } from "../../../lib/privacy/retention";
import { errorResponse, json } from "../../../lib/http/response";
import { clearedCookie, readCookie, teacherCookieName } from "../../../lib/auth/cookies";

export const config = { runtime: "edge" };

// Exclusão pelo professor: só o navegador com o cookie do professor apaga a turma.
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return errorResponse("method_not_allowed", 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_json", 400);
  }

  const sessionId = parseSessionId(body);
  if (!sessionId) return errorResponse("invalid_session", 400);

  const token = readCookie(request, teacherCookieName(sessionId));
  if (!token) return errorResponse("unauthorized", 401);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return errorResponse("database_not_configured", 503);

  try {
    if (!(await isTeacherOf(databaseUrl, sessionId, token))) return errorResponse("unauthorized", 401);
    await eraseSession(databaseUrl, sessionId);
    // Remove as credenciais deste navegador para essa sessão.
    return json({ ok: true }, 200, {
      "set-cookie": clearedCookie(teacherCookieName(sessionId)),
    });
  } catch {
    return errorResponse("internal_error", 500);
  }
}
