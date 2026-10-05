export const MAX_HINTS = 3;

export type Exercise = {
  id: string;
  statement: string;
  answer: string;
  steps: string[];
};

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
