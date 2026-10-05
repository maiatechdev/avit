import { describe, expect, it } from "vitest";
import { leaksAnswer, nextAction } from "./escada";
import { createMemoryAttemptsStore } from "./attempts";
import { StubProvider, type TutorProvider } from "./provider";
import { runTurn, TutorUnavailableError } from "./turn";

const SESSION = "sessao-teste";
const EXERCISE = "f1-avaliacao-1";
const WRONG = "eu acho que é 10";
const RIGHT = "11";

describe("nextAction", () => {
  it("dá dicas nas três primeiras respostas erradas", () => {
    expect(nextAction(0, false)).toEqual({ action: "hint", wrongCount: 1 });
    expect(nextAction(1, false)).toEqual({ action: "hint", wrongCount: 2 });
    expect(nextAction(2, false)).toEqual({ action: "hint", wrongCount: 3 });
  });

  it("explica após três dicas sem sucesso e reinicia o contador", () => {
    expect(nextAction(3, false)).toEqual({ action: "explain", wrongCount: 0 });
  });

  it("marca como resolvido quando a resposta está correta", () => {
    expect(nextAction(1, true)).toEqual({ action: "solved", wrongCount: 1 });
  });
});

describe("leaksAnswer", () => {
  it("detecta a resposta final como número isolado", () => {
    expect(leaksAnswer("A resposta é 11.", "11")).toBe(true);
    expect(leaksAnswer("Qual é o resultado de 2 · 4 + 3?", "11")).toBe(false);
  });
});

describe("runTurn com a escada de dicas", () => {
  it("não revela a resposta nas três primeiras tentativas erradas", async () => {
    const store = createMemoryAttemptsStore();
    const provider = new StubProvider();
    for (let i = 0; i < 3; i++) {
      const result = await runTurn(
        { sessionId: SESSION, exerciseId: EXERCISE, message: WRONG },
        { store, provider },
      );
      expect(result.action).toBe("hint");
      expect(leaksAnswer(result.resposta_ao_aluno, RIGHT)).toBe(false);
    }
  });

  it("explica passo a passo na quarta tentativa errada", async () => {
    const store = createMemoryAttemptsStore();
    const provider = new StubProvider();
    for (let i = 0; i < 3; i++) {
      await runTurn({ sessionId: SESSION, exerciseId: EXERCISE, message: WRONG }, { store, provider });
    }
    const result = await runTurn(
      { sessionId: SESSION, exerciseId: EXERCISE, message: WRONG },
      { store, provider },
    );
    expect(result.action).toBe("explain");
    expect(result.resposta_ao_aluno).toContain("passo a passo");
    expect(result.resposta_ao_aluno).toContain("11");
  });

  it("marca como resolvido quando o aluno acerta", async () => {
    const store = createMemoryAttemptsStore();
    const provider = new StubProvider();
    const result = await runTurn(
      { sessionId: SESSION, exerciseId: EXERCISE, message: RIGHT },
      { store, provider },
    );
    expect(result.action).toBe("solved");
    expect(result.resultado).toBe("correta");
  });

  it("troca por dica segura se o provedor vazar a resposta", async () => {
    const leaky: TutorProvider = {
      judge: async () => "incorreta",
      reply: async () => "Quase! A resposta certa é 11.",
    };
    const result = await runTurn(
      { sessionId: SESSION, exerciseId: EXERCISE, message: WRONG },
      { store: createMemoryAttemptsStore(), provider: leaky },
    );
    expect(result.action).toBe("hint");
    expect(leaksAnswer(result.resposta_ao_aluno, RIGHT)).toBe(false);
  });

  it("falha de forma controlada quando o provedor demora demais", async () => {
    const slow: TutorProvider = {
      judge: () => new Promise((resolve) => setTimeout(() => resolve("incorreta"), 200)),
      reply: async () => "dica",
    };
    await expect(
      runTurn(
        { sessionId: SESSION, exerciseId: EXERCISE, message: WRONG },
        { store: createMemoryAttemptsStore(), provider: slow, timeoutMs: 20 },
      ),
    ).rejects.toBeInstanceOf(TutorUnavailableError);
  });
});
