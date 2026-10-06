import { createNeonCheckinStore, missionFor, validateCheckin } from "../../lib/checkins/checkin";
import { resolveParticipant } from "../../lib/participants/participants";
import { participantCookieName, readCookie } from "../../lib/auth/cookies";
import { errorResponse, json } from "../../lib/http/response";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return errorResponse("method_not_allowed", 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_json", 400);
  }

  const input = validateCheckin(body);
  if (!input) return errorResponse("invalid_checkin", 400);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return errorResponse("database_not_configured", 503);

  try {
    const token = readCookie(request, participantCookieName(input.sessionId));
    const participantId = token ? await resolveParticipant(databaseUrl, input.sessionId, token) : null;
    if (!participantId) return errorResponse("invalid_participant", 401, "Entre de novo na sessão.");

    await createNeonCheckinStore(databaseUrl).save({ ...input, participantId });
    return json({ mission: missionFor(input) }, 201);
  } catch {
    return errorResponse("internal_error", 500);
  }
}
