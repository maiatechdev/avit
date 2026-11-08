export const MAX_HINTS = 3;

export type Exercise = {
  id: string;
  statement: string;
  answer: string;
  steps: string[];
  // Dicas do stub, quando o exercício pede outro caminho (achar x a partir de f(x)).
  hints?: string[];
};

// Os exercícios vão do mais direto ao que pede o caminho inverso, na ordem em que o aluno os recebe.

export const EXERCISES: Exercise[] = [
  {
    id: "f1-avaliacao-1",
    statement: "Se f(x) = 2x + 3, quanto vale f(4)?",
    answer: "11",
    steps: [
      "Substitua x por 4 na expressão: f(4) = 2 · 4 + 3.",
      "Calcule a multiplicação primeiro: 2 · 4 = 8.",
      "Some 3 ao resultado: 8 + 3 = 11.",
    ],
  },
  {
    id: "f1-avaliacao-2",
    statement: "Se f(x) = 3x + 1, quanto vale f(2)?",
    answer: "7",
    steps: [
      "Substitua x por 2 na expressão: f(2) = 3 · 2 + 1.",
      "Calcule a multiplicação primeiro: 3 · 2 = 6.",
      "Some 1 ao resultado: 6 + 1 = 7.",
    ],
  },
  {
    id: "f1-avaliacao-3",
    statement: "Se f(x) = 4x − 5, quanto vale f(3)?",
    answer: "7",
    steps: [
      "Substitua x por 3 na expressão: f(3) = 4 · 3 − 5.",
      "Calcule a multiplicação primeiro: 4 · 3 = 12.",
      "Subtraia 5 do resultado: 12 − 5 = 7.",
    ],
  },
  {
    id: "f1-avaliacao-4",
    statement: "Se f(x) = −2x + 10, quanto vale f(3)?",
    answer: "4",
    steps: [
      "Substitua x por 3 na expressão: f(3) = −2 · 3 + 10.",
      "Calcule a multiplicação primeiro: −2 · 3 = −6.",
      "Some 10 ao resultado: −6 + 10 = 4.",
    ],
  },
  {
    id: "f1-avaliacao-5",
    statement: "Se f(x) = x/2 + 1, quanto vale f(6)?",
    answer: "4",
    steps: [
      "Substitua x por 6 na expressão: f(6) = 6/2 + 1.",
      "Calcule a divisão primeiro: 6/2 = 3.",
      "Some 1 ao resultado: 3 + 1 = 4.",
    ],
  },
  {
    id: "f1-avaliacao-6",
    statement: "Se f(x) = 5x − 8, quanto vale f(2)?",
    answer: "2",
    steps: [
      "Substitua x por 2 na expressão: f(2) = 5 · 2 − 8.",
      "Calcule a multiplicação primeiro: 5 · 2 = 10.",
      "Subtraia 8 do resultado: 10 − 8 = 2.",
    ],
  },
  {
    id: "f1-avaliacao-7",
    statement: "Se f(x) = 2x + 1 e f(x) = 9, quanto vale x?",
    answer: "4",
    steps: [
      "Iguale a expressão ao valor dado: 2x + 1 = 9.",
      "Tire 1 dos dois lados: 2x = 8.",
      "Divida os dois lados por 2: x = 8 / 2 = 4.",
    ],
    hints: [
      "Agora o caminho é o inverso: você já sabe quanto vale f(x). Que equação aparece quando você iguala 2x + 1 a 9?",
      "Para deixar o 2x sozinho, o que você faz com o + 1 dos dois lados da equação?",
      "Se 2x é igual a um número, que operação mostra quanto vale um x só?",
    ],
  },
  {
    id: "f1-avaliacao-8",
    statement: "Se f(x) = 3x − 2 e f(x) = 13, quanto vale x?",
    answer: "5",
    steps: [
      "Iguale a expressão ao valor dado: 3x − 2 = 13.",
      "Some 2 aos dois lados: 3x = 15.",
      "Divida os dois lados por 3: x = 15 / 3 = 5.",
    ],
    hints: [
      "Você já sabe quanto vale f(x). Que equação aparece quando você iguala 3x − 2 a 13?",
      "Para deixar o 3x sozinho, o que você faz com o − 2 dos dois lados?",
      "Se 3x é igual a um número, que operação mostra quanto vale um x só?",
    ],
  },
];

export function findExercise(id: string): Exercise | undefined {
  return EXERCISES.find((exercise) => exercise.id === id);
}

export function nextExercise(id: string): Exercise {
  const index = EXERCISES.findIndex((exercise) => exercise.id === id);
  return EXERCISES[(index + 1) % EXERCISES.length];
}

export type TutorAction = "hint" | "explain" | "solved";

export function nextAction(
  wrongCount: number,
  isCorrect: boolean,
): { action: TutorAction; wrongCount: number } {
  if (isCorrect) return { action: "solved", wrongCount };
  if (wrongCount >= MAX_HINTS) return { action: "explain", wrongCount: 0 };
  return { action: "hint", wrongCount: wrongCount + 1 };
}

export function leaksAnswer(text: string, answer: string): boolean {
  const pattern = new RegExp(`(^|[^0-9.,])${answer}(?![0-9]|[.,][0-9])`);
  return pattern.test(text);
}
