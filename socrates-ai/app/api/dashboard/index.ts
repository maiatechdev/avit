import { readDashboard, summarize } from "../../lib/dashboard/summary";
import { isTeacherOf } from "../../lib/sessions/teacher";
import { errorResponse, json } from "../../lib/http/response";
import { readCookie, teacherCookieName } from "../../lib/auth/cookies";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return errorResponse("method_not_allowed", 405);

  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId || sessionId.length > 64) return errorResponse("invalid_session", 400);

  // Só o navegador que criou a sessão tem o cookie do professor.
  const token = readCookie(request, teacherCookieName(sessionId));
  if (!token) return errorResponse("unauthorized", 401, "Este painel só abre no navegador em que a sessão foi criada.");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return errorResponse("database_not_configured", 503);

  try {
    if (!(await isTeacherOf(databaseUrl, sessionId, token))) {
      return errorResponse("unauthorized", 401, "Este painel só abre no navegador em que a sessão foi criada.");
    }
    const raw = await readDashboard(databaseUrl, sessionId);
    if (!raw) return errorResponse("session_not_found", 404);
    return json(summarize(raw));
  } catch {
    return errorResponse("internal_error", 500);
  }
}
