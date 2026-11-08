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

// O juiz olha o resultado que o aluno declarou por último, não a conta que ele mostrou para chegar lá.
// "8 + 3 = 11" e "troquei x por 4 e deu 11" valem; "não é 11", "10 ou 11" e "11, mas não sei" não valem.
// Fronteira de palavra feita à mão: \b não reconhece letra acentuada, como o "o" de "não".
const WORD = (words: string) => new RegExp(`(?:^|[^\\p{L}])(?:${words})(?![\\p{L}])`, "iu");
const NEGATION_BEFORE = WORD("não|nao|nunca|errado|talvez|ou");
const DOUBT_AFTER = WORD("não sei|nao sei|talvez|não tenho certeza|nao tenho certeza|sem certeza|ou");
const CLAUSE_BREAK = /[;!\n]|[.,](?!\d)|(?:^|[^\p{L}])(?:mas|porém|porem)(?![\p{L}])/iu;
// Números dentro de f(4) são o dado do exercício, não a resposta.
const FUNCTION_ARGUMENT = /\p{L}\(\s*-?\d+(?:[.,]\d+)?\s*\)/gu;
const NUMBER = /-?\d+(?:[.,]\d+)?/g;

export function isCorrectAnswer(studentAnswer: string, answer: string): boolean {
  if (studentAnswer.includes("?")) return false;
  const text = studentAnswer.replace(FUNCTION_ARGUMENT, (match) => " ".repeat(match.length));
  const matches = [...text.matchAll(NUMBER)];
  const last = matches[matches.length - 1];
  if (!last || last.index === undefined) return false;
  if (Number(last[0].replace(",", ".")) !== Number(answer)) return false;

  const clause = text.slice(0, last.index).split(CLAUSE_BREAK).pop() ?? "";
  const after = text.slice(last.index + last[0].length);
  return !NEGATION_BEFORE.test(clause) && !DOUBT_AFTER.test(after);
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
    const hints = exercise.hints ?? [
      "O que a expressão pede: trocar x pelo valor dado. Qual valor você colocaria no lugar de x?",
      "Pensa na ordem das operações: o que você calcula primeiro, a multiplicação ou a soma?",
      "Tenta escrever a conta inteira no caderno, com cada passo separado. Onde ela muda de cara?",
    ];
    return hints[Math.min(wrongCount, hints.length - 1)];
  }
}
