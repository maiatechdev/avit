import { createNeonSessionsStore } from "../../lib/sessions/store";
import { createSession, SessionCodeCollisionError, validateObjective } from "../../lib/sessions/service";

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

  const objective = validateObjective((body as { objective?: unknown } | null)?.objective);
  if (!objective) return json({ error: "invalid_objective" }, 400);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return json({ error: "database_not_configured" }, 503);

  try {
    const session = await createSession(objective, createNeonSessionsStore(databaseUrl));
    return json(session, 201);
  } catch (error) {
    if (error instanceof SessionCodeCollisionError) return json({ error: "code_unavailable" }, 503);
    return json({ error: "internal_error" }, 500);
  }
}
