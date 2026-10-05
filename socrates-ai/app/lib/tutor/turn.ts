import { findExercise, leaksAnswer, nextAction, type Exercise, type TutorAction } from "./escada";
import type { AttemptsStore } from "./attempts";
import type { TutorProvider } from "./provider";

export const PROVIDER_TIMEOUT_MS = 10_000;

export class TutorUnavailableError extends Error {}
export class UnknownExerciseError extends Error {}

export type TurnInput = { sessionId: string; exerciseId: string; message: string };

export type TurnResult = {
  action: TutorAction;
  resultado: "correta" | "incorreta";
  resposta_ao_aluno: string;
  wrongCount: number;
};

const SAFE_FALLBACK_HINT =
  "Pensa de novo no que o exercício pede. Qual é o primeiro passo que você faria?";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TutorUnavailableError("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(new TutorUnavailableError(String(error)));
      },
    );
  });
}

export async function runTurn(
  input: TurnInput,
  deps: { store: AttemptsStore; provider: TutorProvider; timeoutMs?: number },
): Promise<TurnResult> {
  const exercise: Exercise | undefined = findExercise(input.exerciseId);
  if (!exercise) throw new UnknownExerciseError(input.exerciseId);

  const timeoutMs = deps.timeoutMs ?? PROVIDER_TIMEOUT_MS;
  const state = await deps.store.get(input.sessionId, input.exerciseId);

  if (state.solved) {
    return {
      action: "solved",
      resultado: "correta",
      resposta_ao_aluno: "Esse exercício já está resolvido. Quer tentar um parecido?",
      wrongCount: 0,
    };
  }

  const resultado = await withTimeout(
    deps.provider.judge(input.message, exercise),
    timeoutMs,
  );
  const isCorrect = resultado === "correta";
  const decision = nextAction(state.wrongCount, isCorrect);

  let reply = await withTimeout(
    deps.provider.reply({
      action: decision.action,
      exercise,
      studentAnswer: input.message,
      wrongCount: state.wrongCount,
    }),
    timeoutMs,
  );

  if (decision.action === "hint" && leaksAnswer(reply, exercise.answer)) {
    reply = SAFE_FALLBACK_HINT;
  }

  await deps.store.save(input.sessionId, input.exerciseId, {
    wrongCount: decision.wrongCount,
    solved: decision.action === "solved",
  });

  return {
    action: decision.action,
    resultado,
    resposta_ao_aluno: reply,
    wrongCount: decision.wrongCount,
  };
}
