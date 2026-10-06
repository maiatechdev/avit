import { describe, expect, it } from "vitest";
import { hashToken, newToken } from "./tokens";
import { credentialCookie, clearedCookie, participantCookieName, readCookie, teacherCookieName } from "./cookies";

describe("newToken", () => {
  it("gera valores longos, sem caracteres problemáticos e diferentes entre si", () => {
    const a = newToken();
    const b = newToken();
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a).not.toBe(b);
  });
});

describe("hashToken", () => {
  it("usa SHA-256 em hexadecimal, com vetor conhecido", async () => {
    expect(await hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("é determinístico e não devolve o token original", async () => {
    const token = newToken();
    expect(await hashToken(token)).toBe(await hashToken(token));
    expect(await hashToken(token)).not.toContain(token);
  });
});

describe("cookies de credencial", () => {
  it("lê o valor do cookie pelo nome, sem confundir sessões diferentes", () => {
    const req = new Request("https://x.test", {
      headers: { cookie: "outro=1; sct_abc=token-do-professor; sp_abc=token-do-aluno" },
    });
    expect(readCookie(req, teacherCookieName("abc"))).toBe("token-do-professor");
    expect(readCookie(req, participantCookieName("abc"))).toBe("token-do-aluno");
    expect(readCookie(req, teacherCookieName("zzz"))).toBeNull();
  });

  it("ignora cookie ausente, vazio ou longo demais", () => {
    expect(readCookie(new Request("https://x.test"), "sct_abc")).toBeNull();
    expect(readCookie(new Request("https://x.test", { headers: { cookie: "sct_abc=" } }), "sct_abc")).toBeNull();
    const longo = "x".repeat(129);
    expect(readCookie(new Request("https://x.test", { headers: { cookie: `sct_abc=${longo}` } }), "sct_abc")).toBeNull();
  });

  it("grava com HttpOnly, Secure e SameSite=Strict", () => {
    const cookie = credentialCookie("sct_abc", "valor");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
    expect(clearedCookie("sct_abc")).toContain("Max-Age=0");
  });
});
