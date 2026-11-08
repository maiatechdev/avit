import { EXERCISES, findExercise, leaksAnswer, nextAction, nextExercise, type Exercise, type TutorAction } from "./escada";
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

// Próximo exercício, na ordem da lista, que o aluno ainda não resolveu nem recebeu explicado.
// Um exercício explicado pelo tutor não volta: o aluno já viu a resposta.
async function nextPending(input: TurnInput, store: AttemptsStore): Promise<Exercise | undefined> {
  const start = EXERCISES.findIndex((exercise) => exercise.id === input.exerciseId);
  for (let step = 1; step < EXERCISES.length; step++) {
    const candidate = EXERCISES[(start + step) % EXERCISES.length];
    const state = await store.get(input.sessionId, input.participantId, candidate.id);
    if (!state.solved && !state.revealed) return candidate;
  }
  return undefined;
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
    const next = await nextPending(input, deps.store);
    return {
      action: "solved",
      resultado: "correta",
      resposta_ao_aluno: next
        ? `Valeu por explicar! Agora tenta este: ${next.statement}`
        : "Valeu por explicar! Você passou por todos os exercícios de hoje. Quando quiser, toque em \"Concluí o desafio!\".",
      wrongCount: 0,
      exerciseId: next ? next.id : input.exerciseId,
    };
  }

  const resultado = await withTimeout(deps.provider.judge(input.message, exercise), timeoutMs);
  const isCorrect = resultado === "correta";
  const decision = nextAction(state.wrongCount, isCorrect);
  // Na explicação, o tutor propõe o próximo exercício pendente; nos outros casos, o seguinte da lista basta.
  const next =
    decision.action === "explain"
      ? ((await nextPending(input, deps.store)) ?? nextExercise(input.exerciseId))
      : nextExercise(input.exerciseId);

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
    revealed: state.revealed || decision.action === "explain",
  });

  return {
    action: decision.action,
    resultado,
    resposta_ao_aluno: reply,
    wrongCount: decision.wrongCount,
    exerciseId: exerciseForNextTurn,
  };
}
