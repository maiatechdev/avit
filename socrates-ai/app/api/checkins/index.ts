import { createNeonCheckinStore, missionFor, validateCheckin } from "../../lib/checkins/checkin";
import { resolveParticipant } from "../../lib/participants/participants";
import { json } from "../../lib/http/response";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const input = validateCheckin(body);
  if (!input) return json({ error: "invalid_checkin" }, 400);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return json({ error: "database_not_configured" }, 503);

  try {
    const participantId = await resolveParticipant(databaseUrl, input.sessionId, input.participantToken);
    if (!participantId) return json({ error: "invalid_participant" }, 401);

    const checkin = { sessionId: input.sessionId, difficulty: input.difficulty, time: input.time, feeling: input.feeling };
    await createNeonCheckinStore(databaseUrl).save({ ...checkin, participantId });
    return json({ mission: missionFor(checkin) }, 201);
  } catch {
    return json({ error: "internal_error" }, 500);
  }
}
