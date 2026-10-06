// Cookies de credencial: HttpOnly, para o JavaScript da página não conseguir ler o token.
// SameSite=Strict impede que outros sites façam requisições com o cookie (proteção contra CSRF).
// Um cookie por sessão, para que um mesmo navegador guarde várias sessões sem uma apagar a outra.

export const teacherCookieName = (sessionId: string) => `sct_${sessionId}`;
export const participantCookieName = (sessionId: string) => `sp_${sessionId}`;

export const CREDENTIAL_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      const value = part.slice(index + 1).trim();
      return value.length > 0 && value.length <= 128 ? value : null;
    }
  }
  return null;
}

export function credentialCookie(name: string, value: string, maxAgeSeconds = CREDENTIAL_MAX_AGE_SECONDS): string {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}

export function clearedCookie(name: string): string {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
