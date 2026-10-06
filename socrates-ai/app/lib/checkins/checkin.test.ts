import { describe, expect, it } from "vitest";
import { missionFor, validateCheckin } from "./checkin";

const valid = { sessionId: "s1", difficulty: "duvidas", time: "medio", feeling: "ok" };

describe("validateCheckin", () => {
  it("aceita respostas válidas, sem participante no corpo", () => {
    expect(validateCheckin(valid)).toEqual(valid);
  });

  it("ignora participantId ou token enviados pelo cliente", () => {
    const out = validateCheckin({ ...valid, participantId: "p1", participantToken: "t1" });
    expect(out).toEqual(valid);
    expect(out).not.toHaveProperty("participantId");
    expect(out).not.toHaveProperty("participantToken");
  });

  it("rejeita valores fora das opções e campos ausentes", () => {
    expect(validateCheckin({ ...valid, difficulty: "facil" })).toBeNull();
    expect(validateCheckin({ ...valid, time: "1h" })).toBeNull();
    expect(validateCheckin({ ...valid, feeling: "😄" })).toBeNull();
    expect(validateCheckin({ ...valid, sessionId: "" })).toBeNull();
    expect(validateCheckin(null)).toBeNull();
  });
});

describe("missionFor", () => {
  it("começa do básico quando o aluno não entendeu", () => {
    expect(missionFor({ difficulty: "nao_entendi", time: "medio" })).toContain("do zero");
  });

  it("propõe resolver junto quando tem dúvidas", () => {
    expect(missionFor({ difficulty: "duvidas", time: "medio" })).toContain("juntos");
  });

  it("propõe desafio direto quando entende bem", () => {
    expect(missionFor({ difficulty: "entendo", time: "bastante" })).toContain("Desafio direto");
  });

  it("marca a missão como curta quando o tempo é pouco", () => {
    expect(missionFor({ difficulty: "entendo", time: "pouco" })).toContain("missão curta");
  });
});
