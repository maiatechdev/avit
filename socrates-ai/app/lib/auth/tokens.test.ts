import { describe, expect, it } from "vitest";
import { bearerToken, hashToken, newToken } from "./tokens";

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

describe("bearerToken", () => {
  it("lê o token do cabeçalho Authorization", () => {
    expect(bearerToken("Bearer abc123")).toBe("abc123");
  });

  it("rejeita cabeçalho ausente, de outro esquema ou vazio", () => {
    expect(bearerToken(null)).toBeNull();
    expect(bearerToken("Basic abc123")).toBeNull();
    expect(bearerToken("Bearer ")).toBeNull();
    expect(bearerToken("Bearer " + "x".repeat(129))).toBeNull();
  });
});
