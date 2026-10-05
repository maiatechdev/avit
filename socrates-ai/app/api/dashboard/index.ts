import { readDashboard, summarize } from "../../lib/dashboard/summary";
import { bearerToken } from "../../lib/auth/tokens";
import { isTeacherOf } from "../../lib/sessions/teacher";

export const config = { runtime: "edge" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId || sessionId.length > 64) return json({ error: "invalid_session" }, 400);

  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return json({ error: "unauthorized" }, 401);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return json({ error: "database_not_configured" }, 503);

  try {
    if (!(await isTeacherOf(databaseUrl, sessionId, token))) return json({ error: "unauthorized" }, 401);
    const raw = await readDashboard(databaseUrl, sessionId);
    if (!raw) return json({ error: "session_not_found" }, 404);
    return json(summarize(raw));
  } catch {
    return json({ error: "internal_error" }, 500);
  }
}
