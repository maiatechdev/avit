import { ensureParticipationsTable, PATHS, savePath } from "../../lib/dashboard/summary";
import { resolveParticipant } from "../../lib/participants/participants";
import { json } from "../../lib/http/response";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const { sessionId, participantToken, path } = body;
  const valid =
    typeof sessionId === "string" && sessionId.length > 0 && sessionId.length <= 64 &&
    typeof participantToken === "string" && participantToken.length > 0 && participantToken.length <= 128 &&
    typeof path === "string" && (PATHS as readonly string[]).includes(path);
  if (!valid) return json({ error: "invalid_participation" }, 400);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return json({ error: "database_not_configured" }, 503);

  try {
    const participantId = await resolveParticipant(databaseUrl, sessionId as string, participantToken as string);
    if (!participantId) return json({ error: "invalid_participant" }, 401);

    await ensureParticipationsTable(databaseUrl);
    await savePath(databaseUrl, sessionId as string, participantId, path as string);
    return json({ ok: true }, 201);
  } catch {
    return json({ error: "internal_error" }, 500);
  }
}
