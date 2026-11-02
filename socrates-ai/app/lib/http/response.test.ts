import { describe, expect, it } from "vitest";
import { errorResponse, json } from "./response";
import { clientIp, clientKey, isWithinLimit, JOIN_LIMIT, SESSION_CREATE_LIMIT, TUTOR_PARTICIPANT_LIMIT } from "./rateLimit";

describe("errorResponse", () => {
  it("devolve o código estável em error e a mensagem opcional", async () => {
    const res = errorResponse("invalid_code", 400, "Código inválido.");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_code", message: "Código inválido." });
  });

  it("omite message quando não há texto", async () => {
    expect(await errorResponse("unauthorized", 401).json()).toEqual({ error: "unauthorized" });
  });
});

describe("json", () => {
  it("define o tipo de conteúdo JSON com charset", () => {
    expect(json({ ok: true }).headers.get("content-type")).toBe("application/json; charset=utf-8");
  });
});

describe("limite de tentativas", () => {
  it("permite até o limite e bloqueia depois", () => {
    expect(isWithinLimit(JOIN_LIMIT.hits, JOIN_LIMIT.hits)).toBe(true);
    expect(isWithinLimit(JOIN_LIMIT.hits + 1, JOIN_LIMIT.hits)).toBe(false);
  });

  it("comporta uma turma grande atrás do mesmo IP sem liberar varredura de códigos", () => {
    // Só os códigos errados contam: 30 erros em 10 minutos cobrem os enganos de uma turma inteira.
    expect(JOIN_LIMIT.hits).toBeGreaterThanOrEqual(30);
    expect(JOIN_LIMIT.windowSeconds).toBe(600);
    expect(TUTOR_PARTICIPANT_LIMIT.hits).toBeGreaterThan(0);
    expect(SESSION_CREATE_LIMIT.hits).toBeGreaterThan(0);
  });

  it("usa o primeiro IP do cabeçalho x-forwarded-for", () => {
    const req = new Request("https://x.test", { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } });
    expect(clientIp(req)).toBe("203.0.113.7");
    expect(clientIp(new Request("https://x.test"))).toBe("desconhecido");
  });

  it("guarda só o hash do IP, que muda com o segredo", async () => {
    const req = new Request("https://x.test", { headers: { "x-forwarded-for": "203.0.113.7" } });
    const key = await clientKey(req, "a");
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain("203.0.113.7");
    expect(await clientKey(req, "a")).toBe(key);
    expect(await clientKey(req, "b")).not.toBe(key);
  });
});
