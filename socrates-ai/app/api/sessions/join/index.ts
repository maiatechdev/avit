import { createNeonSessionsStore } from "../../../lib/sessions/store";
import { joinSession, SessionNotFoundError } from "../../../lib/sessions/service";
import { ensureParticipantsTable, joinAsParticipant } from "../../../lib/participants/participants";

export const config = { runtime: "edge" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const { code, participantToken } = (body ?? {}) as { code?: unknown; participantToken?: unknown };
  if (typeof code !== "string" || code.trim().length === 0 || code.length > 20) {
    return json({ error: "invalid_code" }, 400);
  }
  const previousToken =
    typeof participantToken === "string" && participantToken.length > 0 && participantToken.length <= 128
      ? participantToken
      : undefined;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return json({ error: "database_not_configured" }, 503);

  try {
    const session = await joinSession(code, createNeonSessionsStore(databaseUrl));
    await ensureParticipantsTable(databaseUrl);
    const token = await joinAsParticipant(databaseUrl, session.id, previousToken);
    return json({ id: session.id, objective: session.objective, participantToken: token });
  } catch (error) {
    if (error instanceof SessionNotFoundError) return json({ error: "session_not_found" }, 404);
    return json({ error: "internal_error" }, 500);
  }
}
