import { describe, expect, it } from "vitest";
import { errorResponse, json } from "./response";
import { clientKey, isWithinLimit, JOIN_LIMIT } from "./rateLimit";

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

  it("usa o primeiro IP do cabeçalho x-forwarded-for", () => {
    const req = new Request("https://x.test", { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } });
    expect(clientKey(req)).toBe("203.0.113.7");
    expect(clientKey(new Request("https://x.test"))).toBe("desconhecido");
  });
});
