import { isTeacherOf } from "../../../lib/sessions/teacher";
import { bearerToken } from "../../../lib/auth/tokens";
import { eraseSession, parseSessionId } from "../../../lib/privacy/retention";
import { json } from "../../../lib/http/response";

export const config = { runtime: "edge" };

// Exclusão pelo professor: só quem tem o token da sessão apaga a turma.
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const sessionId = parseSessionId(body);
  if (!sessionId) return json({ error: "invalid_session" }, 400);

  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return json({ error: "unauthorized" }, 401);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return json({ error: "database_not_configured" }, 503);

  try {
    if (!(await isTeacherOf(databaseUrl, sessionId, token))) return json({ error: "unauthorized" }, 401);
    await eraseSession(databaseUrl, sessionId);
    return json({ ok: true });
  } catch {
    return json({ error: "internal_error" }, 500);
  }
}
