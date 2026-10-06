import { createNeonAttemptsStore } from "../../lib/tutor/attempts";
import { StubProvider } from "../../lib/tutor/provider";
import { GeminiProvider } from "../../lib/tutor/gemini";
import { runTurn, TutorUnavailableError, UnknownExerciseError } from "../../lib/tutor/turn";
import { resolveParticipant } from "../../lib/participants/participants";
import { participantCookieName, readCookie } from "../../lib/auth/cookies";
import { errorResponse, json } from "../../lib/http/response";

export const config = { runtime: "edge" };

function isNonEmptyString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function chooseProvider() {
  const key = process.env.GEMINI_API_KEY;
  return key ? new GeminiProvider(key, process.env.GEMINI_MODEL) : new StubProvider();
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return errorResponse("method_not_allowed", 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_json", 400);
  }

  const { sessionId, exerciseId, message } = (body ?? {}) as Record<string, unknown>;
  if (
    !isNonEmptyString(sessionId, 64) ||
    !isNonEmptyString(exerciseId, 64) ||
    !isNonEmptyString(message, 1000)
  ) {
    return errorResponse("invalid_input", 400);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return errorResponse("database_not_configured", 503);

  try {
    const token = readCookie(request, participantCookieName(sessionId));
    const participantId = token ? await resolveParticipant(databaseUrl, sessionId, token) : null;
    if (!participantId) return errorResponse("invalid_participant", 401, "Entre de novo na sessão.");

    const result = await runTurn(
      { sessionId, participantId, exerciseId, message },
      { store: createNeonAttemptsStore(databaseUrl), provider: chooseProvider() },
    );
    return json(result);
  } catch (error) {
    if (error instanceof UnknownExerciseError) return errorResponse("unknown_exercise", 404);
    if (error instanceof TutorUnavailableError) {
      return errorResponse("tutor_unavailable", 503, "O tutor está indisponível. Tente de novo.");
    }
    return errorResponse("internal_error", 500);
  }
}
