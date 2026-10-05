import type { Exercise, TutorAction } from "./escada";

export interface TutorProvider {
  judge(studentAnswer: string, exercise: Exercise): Promise<"correta" | "incorreta">;
  reply(args: {
    action: TutorAction;
    exercise: Exercise;
    next: Exercise;
    studentAnswer: string;
    wrongCount: number;
  }): Promise<string>;
}

const NEGATION = /\b(não|nao|nunca|errado|ou|talvez)\b|\?/i;

export function isCorrectAnswer(studentAnswer: string, answer: string): boolean {
  if (NEGATION.test(studentAnswer)) return false;
  const numbers = (studentAnswer.match(/-?\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."));
  if (numbers.length === 1) return numbers[0] === answer;
  if (numbers.length === 2) return numbers[1] === answer && studentAnswer.includes("=");
  return false;
}

export class StubProvider implements TutorProvider {
  async judge(studentAnswer: string, exercise: Exercise) {
    return isCorrectAnswer(studentAnswer, exercise.answer) ? "correta" : "incorreta";
  }

  async reply({ action, exercise, next, wrongCount }: Parameters<TutorProvider["reply"]>[0]) {
    if (action === "solved") {
      return "Isso mesmo! Agora explica com suas palavras como você chegou nesse resultado.";
    }
    if (action === "explain") {
      return [
        "Vamos juntos, passo a passo:",
        ...exercise.steps.map((step, i) => `${i + 1}. ${step}`),
        `Agora tenta um parecido: ${next.statement}`,
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
