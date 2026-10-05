import type { Exercise, TutorAction } from "./escada";

export type ProviderReply = {
  resultado: "correta" | "incorreta";
  resposta_ao_aluno: string;
};

export interface TutorProvider {
  judge(studentAnswer: string, exercise: Exercise): Promise<"correta" | "incorreta">;
  reply(args: {
    action: TutorAction;
    exercise: Exercise;
    studentAnswer: string;
    wrongCount: number;
  }): Promise<string>;
}

export class StubProvider implements TutorProvider {
  async judge(studentAnswer: string, exercise: Exercise) {
    const numbers = studentAnswer.match(/-?\d+(?:[.,]\d+)?/g) ?? [];
    return numbers.some((n) => n.replace(",", ".") === exercise.answer) ? "correta" : "incorreta";
  }

  async reply({ action, exercise, wrongCount }: Parameters<TutorProvider["reply"]>[0]) {
    if (action === "solved") {
      return "Isso mesmo! Agora explica com suas palavras como você chegou nesse resultado.";
    }
    if (action === "explain") {
      return [
        "Vamos juntos, passo a passo:",
        ...exercise.steps.map((step, i) => `${i + 1}. ${step}`),
        "Agora tenta um exercício parecido: se f(x) = 3x + 1, quanto vale f(2)?",
      ].join("\n");
    }
    const hints = [
      "O que a expressão pede: trocar x pelo valor dado. Qual valor você colocaria no lugar de x?",
      "Pensa na ordem das operações: o que você calcula primeiro, a multiplicação ou a soma?",
      "Tenta escrever a conta inteira no caderno, com cada passo separado. Onde ela muda de cara?",
    ];
    return hints[Math.min(wrongCount, hints.length - 1)];
  }
}
