import { describe, expect, it } from "vitest";
import { isLegacyCredentialKey } from "./client";

describe("isLegacyCredentialKey", () => {
  it("reconhece as chaves de token da versão anterior", () => {
    expect(isLegacyCredentialKey("socrates-teacher:SOC-1234")).toBe(true);
    expect(isLegacyCredentialKey("socrates-participant:SOC-1234")).toBe(true);
  });

  it("não remove o estado de navegação atual nem chaves alheias", () => {
    expect(isLegacyCredentialKey("socrates-state")).toBe(false);
    expect(isLegacyCredentialKey("outra-coisa")).toBe(false);
  });
});
