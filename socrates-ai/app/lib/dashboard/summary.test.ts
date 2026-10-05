import { describe, expect, it } from "vitest";
import { summarize, suggestionFor } from "./summary";

const base = { students: 10, chosen: 8, paths: { investigar: 4, criar: 2, colaborar: 2 }, stuck: 1, solvedExercises: 6 };

describe("summarize", () => {
  it("calcula engajamento, autonomia, competência e vínculo", () => {
    const d = summarize(base);
    expect(d.engagement).toBe(80);
    expect(d.autonomy).toBe(75);
    expect(d.competence).toBe(60);
    expect(d.bond).toBe(20);
    expect(d.pathCounts).toEqual({ investigar: 4, criar: 2, resolver: 0, colaborar: 2 });
  });

  it("não divide por zero sem alunos", () => {
    const d = summarize({ students: 0, chosen: 0, paths: {}, stuck: 0, solvedExercises: 0 });
    expect(d.engagement).toBe(0);
    expect(d.competence).toBe(0);
  });

  it("limita competência a 100%", () => {
    expect(summarize({ ...base, solvedExercises: 50 }).competence).toBe(100);
  });
});

describe("suggestionFor", () => {
  it("pede revisão quando muitos alunos não entenderam", () => {
    expect(suggestionFor(40, 90)).toContain("Retome");
  });

  it("pede para confirmar a entrada quando o engajamento é baixo", () => {
    expect(suggestionFor(10, 50)).toContain("Confira");
  });

  it("sugere desafio quando a turma está bem", () => {
    expect(suggestionFor(10, 90)).toContain("desafio");
  });
});
