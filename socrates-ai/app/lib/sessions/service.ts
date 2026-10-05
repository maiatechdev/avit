import type { Session, SessionsStore } from "./store";

export class SessionNotFoundError extends Error {}
export class SessionCodeCollisionError extends Error {}

export function generateCode(random: () => number = Math.random): string {
  const digits = Math.floor(random() * 10000).toString().padStart(4, "0");
  return `SOC-${digits}`;
}

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function validateObjective(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  return text.length >= 3 && text.length <= 140 ? text : null;
}

export async function createSession(
  objective: string,
  store: SessionsStore,
  random: () => number = Math.random,
): Promise<Session> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode(random);
    if (await store.findByCode(code)) continue;
    try {
      return await store.create(objective, code);
    } catch {
      continue;
    }
  }
  throw new SessionCodeCollisionError("code");
}

export async function joinSession(rawCode: string, store: SessionsStore): Promise<Session> {
  const session = await store.findByCode(normalizeCode(rawCode));
  if (!session) throw new SessionNotFoundError("session");
  return session;
}
