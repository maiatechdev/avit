import type { Session, SessionsStore } from "./store";

export function createMemorySessionsStore(): SessionsStore {
  const byCode = new Map<string, Session>();
  return {
    async create(objective, code) {
      const session = { id: crypto.randomUUID(), code, objective };
      byCode.set(code, session);
      return session;
    },
    async findByCode(code) {
      return byCode.get(code) ?? null;
    },
  };
}
