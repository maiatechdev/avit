import { describe, expect, it } from "vitest";
import { parseSessionId, RETENTION_DAYS } from "./retention";

describe("RETENTION_DAYS", () => {
  it("define um prazo de 90 dias, igual ao texto da política", () => {
    expect(RETENTION_DAYS).toBe(90);
  });
});

describe("parseSessionId", () => {
  it("aceita um identificador de sessão curto", () => {
    expect(parseSessionId({ sessionId: "abc-123" })).toBe("abc-123");
  });

  it("rejeita corpo vazio, tipo errado e texto longo demais", () => {
    expect(parseSessionId(null)).toBeNull();
    expect(parseSessionId({})).toBeNull();
    expect(parseSessionId({ sessionId: 42 })).toBeNull();
    expect(parseSessionId({ sessionId: "" })).toBeNull();
    expect(parseSessionId({ sessionId: "x".repeat(65) })).toBeNull();
  });
});
