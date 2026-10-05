import type { Session } from "../shared/contracts";

export async function apiCreateSession(objective: string): Promise<Session> {
  const res = await fetch("/api/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ objective }) });
  if (!res.ok) throw new Error(`sessions ${res.status}`);
  return (await res.json()) as Session;
}

export async function apiJoinSession(code: string): Promise<{ id: string; objective: string }> {
  const res = await fetch("/api/sessions/join", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
  if (res.status === 404) throw new Error("not_found");
  if (!res.ok) throw new Error(`join ${res.status}`);
  return (await res.json()) as { id: string; objective: string };
}

export function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

export function getRequest(path: string): Promise<Response> {
  return fetch(path);
}
