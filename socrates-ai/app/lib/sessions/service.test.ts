import { describe, expect, it } from "vitest";
import { createMemorySessionsStore } from "./memory";
import { createSession, generateCode, joinSession, normalizeCode, SessionNotFoundError, validateObjective } from "./service";

describe("generateCode", () => {
  it("gera SOC- seguido de quatro dígitos", () => {
    expect(generateCode(() => 0.0042)).toBe("SOC-0042");
    expect(generateCode(() => 0.9999)).toBe("SOC-9999");
  });
});

describe("normalizeCode", () => {
  it("ignora caixa e espaços", () => {
    expect(normalizeCode("  soc - 4782 ")).toBe("SOC-4782");
  });
});

describe("validateObjective", () => {
  it("aceita textos entre 3 e 140 caracteres", () => {
    expect(validateObjective("  Funções  ")).toBe("Funções");
    expect(validateObjective("ab")).toBeNull();
    expect(validateObjective("x".repeat(141))).toBeNull();
    expect(validateObjective(42)).toBeNull();
  });
});

describe("createSession e joinSession", () => {
  it("cria uma sessão e permite entrar com o código", async () => {
    const store = createMemorySessionsStore();
    const created = await createSession("Funções do 1º grau", store, () => 0.1234);
    expect(created.code).toBe("SOC-1234");
    const joined = await joinSession("soc-1234", store);
    expect(joined.objective).toBe("Funções do 1º grau");
    expect(joined.id).toBe(created.id);
  });

  it("falha com código inexistente", async () => {
    await expect(joinSession("SOC-0000", createMemorySessionsStore())).rejects.toBeInstanceOf(SessionNotFoundError);
  });

  it("evita colisão de código tentando outro", async () => {
    const store = createMemorySessionsStore();
    await createSession("Primeira", store, () => 0.5);
    const values = [0.5, 0.7];
    const second = await createSession("Segunda", store, () => values.shift() ?? 0.9);
    expect(second.code).toBe("SOC-7000");
  });
});
