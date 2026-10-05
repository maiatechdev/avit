import { ensureParticipationsTable, PATHS, savePath } from "../../lib/dashboard/summary";

export const config = { runtime: "edge" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const { sessionId, participantId, path } = body;
  const valid =
    typeof sessionId === "string" && sessionId.length > 0 && sessionId.length <= 64 &&
    typeof participantId === "string" && participantId.length > 0 && participantId.length <= 64 &&
    typeof path === "string" && (PATHS as readonly string[]).includes(path);
  if (!valid) return json({ error: "invalid_participation" }, 400);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return json({ error: "database_not_configured" }, 503);

  try {
    await ensureParticipationsTable(databaseUrl);
    await savePath(databaseUrl, sessionId as string, participantId as string, path as string);
    return json({ ok: true }, 201);
  } catch {
    return json({ error: "internal_error" }, 500);
  }
}
