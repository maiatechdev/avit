import { createNeonAttemptsStore } from "../../lib/tutor/attempts";
import { StubProvider } from "../../lib/tutor/provider";
import { GeminiProvider } from "../../lib/tutor/gemini";
import { runTurn, TutorUnavailableError, UnknownExerciseError } from "../../lib/tutor/turn";
import { resolveParticipant } from "../../lib/participants/participants";

export const config = { runtime: "edge" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

function isNonEmptyString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function chooseProvider() {
  const key = process.env.GEMINI_API_KEY;
  return key ? new GeminiProvider(key, process.env.GEMINI_MODEL) : new StubProvider();
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const { sessionId, participantToken, exerciseId, message } = (body ?? {}) as Record<string, unknown>;
  if (
    !isNonEmptyString(sessionId, 64) ||
    !isNonEmptyString(participantToken, 128) ||
    !isNonEmptyString(exerciseId, 64) ||
    !isNonEmptyString(message, 1000)
  ) {
    return json({ error: "invalid_input" }, 400);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return json({ error: "database_not_configured" }, 503);

  try {
    const participantId = await resolveParticipant(databaseUrl, sessionId, participantToken);
    if (!participantId) return json({ error: "invalid_participant" }, 401);

    const result = await runTurn(
      { sessionId, participantId, exerciseId, message },
      { store: createNeonAttemptsStore(databaseUrl), provider: chooseProvider() },
    );
    return json(result);
  } catch (error) {
    if (error instanceof UnknownExerciseError) return json({ error: "unknown_exercise" }, 404);
    if (error instanceof TutorUnavailableError) {
      return json({ error: "tutor_unavailable", message: "O tutor está indisponível. Tente de novo." }, 503);
    }
    return json({ error: "internal_error" }, 500);
  }
}
