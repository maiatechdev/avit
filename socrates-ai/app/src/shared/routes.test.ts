import { describe, expect, it } from "vitest";
import { codeFromSearch, entryFor, needsSession, ROUTES, screenFromPath, type Screen } from "./routes";

describe("screenFromPath", () => {
  it("lê cada rota de volta para a sua tela", () => {
    for (const screen of Object.keys(ROUTES) as Screen[]) {
      expect(screenFromPath(ROUTES[screen])).toBe(screen);
    }
  });

  it("ignora barra final e cai na entrada para caminhos desconhecidos", () => {
    expect(screenFromPath("/professor/painel/")).toBe("teacher-dashboard");
    expect(screenFromPath("/nao-existe")).toBe("intro");
    expect(screenFromPath("")).toBe("intro");
  });
});

describe("área e sessão", () => {
  it("telas de professor e de aluno voltam para a entrada da própria área", () => {
    expect(entryFor("teacher-dashboard")).toBe("teacher-activate");
    expect(entryFor("student-chat")).toBe("student-join");
    expect(entryFor("intro")).toBe("intro");
    expect(entryFor("privacy")).toBe("intro");
  });

  it("a política de privacidade é pública: não exige sessão", () => {
    expect(screenFromPath("/privacidade")).toBe("privacy");
    expect(needsSession("privacy")).toBe(false);
  });

  it("painel e fluxo do aluno exigem sessão; entrada e ativação não", () => {
    expect(needsSession("teacher-dashboard")).toBe(true);
    expect(needsSession("student-chat")).toBe(true);
    expect(needsSession("teacher-activate")).toBe(false);
    expect(needsSession("student-join")).toBe(false);
  });
});

describe("codeFromSearch", () => {
  it("lê o código do link do QR, sem caixa e sem espaços", () => {
    expect(codeFromSearch("?codigo=soc-1234")).toBe("SOC-1234");
    expect(codeFromSearch("?codigo=%20SOC-0042%20")).toBe("SOC-0042");
    expect(codeFromSearch("")).toBe("");
  });
});
