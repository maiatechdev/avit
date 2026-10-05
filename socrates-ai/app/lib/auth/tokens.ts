// Tokens de acesso: o cliente guarda o valor bruto, o servidor guarda só o hash SHA-256.

export function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer (\S{1,128})$/.exec(header.trim());
  return match ? match[1] : null;
}
