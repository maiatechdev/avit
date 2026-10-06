import type { Session } from "../shared/contracts";

// Os tokens ficam por código de sessão. Se o armazenamento do navegador falhar, a tela segue sem a credencial.
const teacherKey = (code: string) => `socrates-teacher:${code}`;
const participantKey = (code: string) => `socrates-participant:${code}`;

function readToken(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeToken(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sem armazenamento, o aluno precisa entrar de novo na sessão ao recarregar a página.
  }
}

function removeToken(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nada a remover se o armazenamento não está disponível.
  }
}

export const teacherTokenFor = (code: string) => readToken(teacherKey(code));
export const participantTokenFor = (code: string) => readToken(participantKey(code));

export async function apiCreateSession(objective: string): Promise<Session> {
  const res = await fetch("/api/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ objective }) });
  if (!res.ok) throw new Error(`sessions ${res.status}`);
  const body = (await res.json()) as Session & { teacherToken: string };
  writeToken(teacherKey(body.code), body.teacherToken);
  return { id: body.id, code: body.code, objective: body.objective };
}

export async function apiJoinSession(code: string): Promise<{ id: string; objective: string }> {
  const previous = participantTokenFor(code);
  const res = await fetch("/api/sessions/join", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, participantToken: previous ?? undefined }),
  });
  if (res.status === 404) throw new Error("not_found");
  if (!res.ok) throw new Error(`join ${res.status}`);
  const body = (await res.json()) as { id: string; objective: string; participantToken: string };
  writeToken(participantKey(code), body.participantToken);
  return { id: body.id, objective: body.objective };
}

// Exclusão pelo professor: apaga a sessão e os dados da turma, e limpa as credenciais deste aparelho.
export async function apiEraseSession(code: string, sessionId: string): Promise<void> {
  const res = await fetch("/api/sessions/erase", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${teacherTokenFor(code) ?? ""}` },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error(`erase ${res.status}`);
  removeToken(teacherKey(code));
  removeToken(participantKey(code));
}

export function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

export function getRequest(path: string, headers?: Record<string, string>): Promise<Response> {
  return fetch(path, { headers });
}
