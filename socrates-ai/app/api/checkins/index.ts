import { createNeonCheckinStore, missionFor, validateCheckin } from "../../lib/checkins/checkin";

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

  const checkin = validateCheckin(body);
  if (!checkin) return json({ error: "invalid_checkin" }, 400);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return json({ error: "database_not_configured" }, 503);

  try {
    await createNeonCheckinStore(databaseUrl).save(checkin);
    return json({ mission: missionFor(checkin) }, 201);
  } catch {
    return json({ error: "internal_error" }, 500);
  }
}
