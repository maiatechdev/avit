import { ensureParticipationsTable, PATHS, savePath } from "../../lib/dashboard/summary";
import { resolveParticipant } from "../../lib/participants/participants";
import { participantCookieName, readCookie } from "../../lib/auth/cookies";
import { errorResponse, json } from "../../lib/http/response";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return errorResponse("method_not_allowed", 405);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorResponse("invalid_json", 400);
  }

  const { sessionId, path } = body;
  const valid =
    typeof sessionId === "string" && sessionId.length > 0 && sessionId.length <= 64 &&
    typeof path === "string" && (PATHS as readonly string[]).includes(path);
  if (!valid) return errorResponse("invalid_participation", 400);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return errorResponse("database_not_configured", 503);

  try {
    const token = readCookie(request, participantCookieName(sessionId as string));
    const participantId = token ? await resolveParticipant(databaseUrl, sessionId as string, token) : null;
    if (!participantId) return errorResponse("invalid_participant", 401, "Entre de novo na sessão.");

    await ensureParticipationsTable(databaseUrl);
    await savePath(databaseUrl, sessionId as string, participantId, path as string);
    return json({ ok: true }, 201);
  } catch {
    return errorResponse("internal_error", 500);
  }
}
