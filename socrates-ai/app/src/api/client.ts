import type { Session } from "../shared/contracts";

// As credenciais de professor e de aluno chegam em cookies HttpOnly. O navegador as envia sozinho
// nas requisições da mesma origem, então o cliente não guarda nenhum token.

export async function apiCreateSession(objective: string): Promise<Session> {
  const res = await fetch("/api/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ objective }) });
  if (!res.ok) throw new Error(`sessions ${res.status}`);
  return (await res.json()) as Session;
}

export async function apiJoinSession(code: string): Promise<{ id: string; objective: string }> {
  const res = await fetch("/api/sessions/join", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
  if (res.status === 404) throw new Error("not_found");
  if (res.status === 429) throw new Error("too_many_attempts");
  if (!res.ok) throw new Error(`join ${res.status}`);
  return (await res.json()) as { id: string; objective: string };
}

// Exclusão pelo professor: apaga a sessão e os dados da turma. O cookie do professor é removido pelo servidor.
export async function apiEraseSession(sessionId: string): Promise<void> {
  const res = await fetch("/api/sessions/erase", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error(`erase ${res.status}`);
}

// Chaves da versão anterior, que guardavam os tokens no localStorage. Não são mais usadas.
export function isLegacyCredentialKey(key: string): boolean {
  return key.startsWith("socrates-teacher:") || key.startsWith("socrates-participant:");
}

// Remove as credenciais antigas deste navegador. Falhas de armazenamento são ignoradas.
export function clearLegacyCredentials(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isLegacyCredentialKey(key)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Sem armazenamento disponível, não há o que limpar.
  }
}

export function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

export function getRequest(path: string): Promise<Response> {
  return fetch(path);
}
