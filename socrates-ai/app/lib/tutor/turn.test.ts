import { describe, expect, it } from "vitest";
import { leaksAnswer, nextAction } from "./escada";
import { createMemoryAttemptsStore } from "./attempts";
import { isCorrectAnswer, StubProvider, type TutorProvider } from "./provider";
import { runTurn, TutorUnavailableError } from "./turn";

const SESSION = "sessao-teste";
const EXERCISE = "f1-avaliacao-1";
const WRONG = "eu acho que é 10";
const RIGHT = "11";

const turn = (store: ReturnType<typeof createMemoryAttemptsStore>, participantId: string, message: string, exerciseId = EXERCISE, provider: TutorProvider = new StubProvider()) =>
  runTurn({ sessionId: SESSION, participantId, exerciseId, message }, { store, provider });

describe("nextAction", () => {
  it("dá dicas nas três primeiras respostas erradas", () => {
    expect(nextAction(0, false)).toEqual({ action: "hint", wrongCount: 1 });
    expect(nextAction(2, false)).toEqual({ action: "hint", wrongCount: 3 });
  });

  it("explica depois de três dicas sem sucesso", () => {
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

describe("isCorrectAnswer (juiz)", () => {
  it("aceita a resposta direta e a equação que termina no resultado", () => {
    expect(isCorrectAnswer("11", "11")).toBe(true);
    expect(isCorrectAnswer("f(4) = 11", "11")).toBe(true);
    expect(isCorrectAnswer("A resposta é 11", "11")).toBe(true);
  });

  it("recusa negação, alternativas, pergunta e outro número", () => {
    expect(isCorrectAnswer("não é 11", "11")).toBe(false);
    expect(isCorrectAnswer("11 ou 10", "11")).toBe(false);
    expect(isCorrectAnswer("10 ou 11", "11")).toBe(false);
    expect(isCorrectAnswer("é 11?", "11")).toBe(false);
    expect(isCorrectAnswer("eu acho que é 10", "11")).toBe(false);
    expect(isCorrectAnswer("2 · 4 + 3 = 11 mas não sei", "11")).toBe(false);
    expect(isCorrectAnswer("-11", "11")).toBe(false);
    expect(isCorrectAnswer("111", "11")).toBe(false);
  });

  it("aceita a resposta certa quando o aluno mostra a conta", () => {
    expect(isCorrectAnswer("8 + 3 = 11", "11")).toBe(true);
    expect(isCorrectAnswer("2*4+3 = 11", "11")).toBe(true);
    expect(isCorrectAnswer("troquei x por 4 e deu 11", "11")).toBe(true);
    expect(isCorrectAnswer("2x = 8, 8 + 3 = 11", "11")).toBe(true);
    expect(isCorrectAnswer("11,0", "11")).toBe(true);
    expect(isCorrectAnswer("é 11 sim, não tenho dúvida", "11")).toBe(true);
    expect(isCorrectAnswer("11 é o resultado de f(4)", "11")).toBe(true);
  });
});

describe("runTurn: escada de dicas por aluno", () => {
  it("não revela a resposta nas três primeiras tentativas erradas", async () => {
    const store = createMemoryAttemptsStore();
    for (let i = 0; i < 3; i++) {
      const result = await turn(store, "aluno-a", WRONG);
      expect(result.action).toBe("hint");
      expect(leaksAnswer(result.resposta_ao_aluno, RIGHT)).toBe(false);
    }
  });

  it("explica na quarta tentativa errada e passa para o exercício parecido", async () => {
    const store = createMemoryAttemptsStore();
    for (let i = 0; i < 3; i++) await turn(store, "aluno-a", WRONG);
    const result = await turn(store, "aluno-a", WRONG);
    expect(result.action).toBe("explain");
    expect(result.resposta_ao_aluno).toContain("passo a passo");
    expect(result.exerciseId).toBe("f1-avaliacao-2");
  });

  it("avalia o exercício novo depois da explicação", async () => {
    const store = createMemoryAttemptsStore();
    for (let i = 0; i < 4; i++) await turn(store, "aluno-a", WRONG);
    const result = await turn(store, "aluno-a", "7", "f1-avaliacao-2");
    expect(result.action).toBe("solved");
  });

  it("depois do acerto, recebe a explicação do aluno e mostra o próximo exercício no chat", async () => {
    const store = createMemoryAttemptsStore();
    await turn(store, "aluno-a", RIGHT);
    const result = await turn(store, "aluno-a", "multipliquei 2 por 4 e somei 3");
    expect(result.resposta_ao_aluno).toContain("Valeu por explicar");
    expect(result.resposta_ao_aluno).toContain("f(2)");
    expect(result.exerciseId).toBe("f1-avaliacao-2");
  });

  it("avisa quando todos os exercícios estão resolvidos, sem voltar ao primeiro", async () => {
    const store = createMemoryAttemptsStore();
    await turn(store, "aluno-a", RIGHT);
    await turn(store, "aluno-a", "7", "f1-avaliacao-2");
    const result = await turn(store, "aluno-a", "fiz 3 vezes 2 mais 1", "f1-avaliacao-2");
    expect(result.resposta_ao_aluno).toContain("todos os exercícios");
    expect(result.exerciseId).toBe("f1-avaliacao-2");
  });

  it("marca o exercício como revelado na explicação, e um acerto depois disso continua marcado", async () => {
    const store = createMemoryAttemptsStore();
    for (let i = 0; i < 4; i++) await turn(store, "aluno-a", WRONG);
    expect(await store.get(SESSION, "aluno-a", EXERCISE)).toMatchObject({ revealed: true, solved: false });
    // Ao recarregar, o chat volta ao exercício 1 e o aluno digita a resposta que acabou de ver.
    await turn(store, "aluno-a", RIGHT);
    expect(await store.get(SESSION, "aluno-a", EXERCISE)).toMatchObject({ revealed: true, solved: true });
  });

  it("um acerto sem explicação não fica marcado como revelado", async () => {
    const store = createMemoryAttemptsStore();
    await turn(store, "aluno-a", WRONG);
    await turn(store, "aluno-a", RIGHT);
    expect(await store.get(SESSION, "aluno-a", EXERCISE)).toMatchObject({ revealed: false, solved: true });
  });

  it("os erros de um aluno não afetam o contador de outro", async () => {
    const store = createMemoryAttemptsStore();
    for (let i = 0; i < 3; i++) await turn(store, "aluno-a", WRONG);
    const other = await turn(store, "aluno-b", WRONG);
    expect(other.action).toBe("hint");
    expect(other.wrongCount).toBe(1);
  });

  it("um acerto não marca o exercício como resolvido para a turma inteira", async () => {
    const store = createMemoryAttemptsStore();
    await turn(store, "aluno-a", RIGHT);
    const other = await turn(store, "aluno-b", WRONG);
    expect(other.action).toBe("hint");
  });

  it("a resposta errada não vira correta com negação", async () => {
    const store = createMemoryAttemptsStore();
    const result = await turn(store, "aluno-a", "não é 11");
    expect(result.resultado).toBe("incorreta");
    expect(result.action).toBe("hint");
  });

  it("troca por dica segura se o provedor vazar a resposta", async () => {
    const leaky: TutorProvider = {
      judge: async () => "incorreta",
      reply: async () => "Quase! A resposta certa é 11.",
    };
    const result = await turn(createMemoryAttemptsStore(), "aluno-a", WRONG, EXERCISE, leaky);
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
        { sessionId: SESSION, participantId: "aluno-a", exerciseId: EXERCISE, message: WRONG },
        { store: createMemoryAttemptsStore(), provider: slow, timeoutMs: 20 },
      ),
    ).rejects.toBeInstanceOf(TutorUnavailableError);
  });
});
