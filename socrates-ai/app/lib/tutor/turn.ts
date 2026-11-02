import { findExercise, leaksAnswer, nextAction, nextExercise, type Exercise, type TutorAction } from "./escada";
import type { AttemptsStore } from "./attempts";
import type { TutorProvider } from "./provider";

export const PROVIDER_TIMEOUT_MS = 22_000;

export class TutorUnavailableError extends Error {}
export class UnknownExerciseError extends Error {}

export type TurnInput = { sessionId: string; participantId: string; exerciseId: string; message: string };

export type TurnResult = {
  action: TutorAction;
  resultado: "correta" | "incorreta";
  resposta_ao_aluno: string;
  wrongCount: number;
  exerciseId: string;
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
  const state = await deps.store.get(input.sessionId, input.participantId, input.exerciseId);

  // Depois do acerto, o tutor pediu que o aluno explicasse o raciocínio. A mensagem seguinte é essa
  // explicação: o tutor agradece e mostra o próximo exercício no próprio chat, que no celular não tem a lateral.
  if (state.solved) {
    const next = nextExercise(input.exerciseId);
    const nextState = await deps.store.get(input.sessionId, input.participantId, next.id);
    return {
      action: "solved",
      resultado: "correta",
      resposta_ao_aluno: nextState.solved
        ? "Valeu por explicar! Você resolveu todos os exercícios de hoje. Quando quiser, toque em \"Concluí o desafio!\"."
        : `Valeu por explicar! Agora tenta um parecido: ${next.statement}`,
      wrongCount: 0,
      exerciseId: nextState.solved ? input.exerciseId : next.id,
    };
  }

  const resultado = await withTimeout(deps.provider.judge(input.message, exercise), timeoutMs);
  const isCorrect = resultado === "correta";
  const decision = nextAction(state.wrongCount, isCorrect);
  const next = nextExercise(input.exerciseId);

  let reply = await withTimeout(
    deps.provider.reply({
      action: decision.action,
      exercise,
      next,
      studentAnswer: input.message,
      wrongCount: state.wrongCount,
    }),
    timeoutMs,
  );

  if (decision.action === "hint" && leaksAnswer(reply, exercise.answer)) {
    reply = SAFE_FALLBACK_HINT;
  }

  const exerciseForNextTurn = decision.action === "explain" ? next.id : exercise.id;

  await deps.store.save(input.sessionId, input.participantId, input.exerciseId, {
    wrongCount: decision.wrongCount,
    solved: decision.action === "solved",
  });

  return {
    action: decision.action,
    resultado,
    resposta_ao_aluno: reply,
    wrongCount: decision.wrongCount,
    exerciseId: exerciseForNextTurn,
  };
}
