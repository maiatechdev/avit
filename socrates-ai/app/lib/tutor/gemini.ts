import type { Exercise, TutorAction } from "./escada";
import { isCorrectAnswer, type TutorProvider } from "./provider";
import { TutorUnavailableError } from "./turn";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
export const GEMINI_TIMEOUT_MS = 20_000;

const SYSTEM_PROMPT = [
  "Você é um tutor socrático de matemática para estudantes do ensino médio brasileiro.",
  "Nunca escreva a resposta final do exercício, nem o número que o resolve, antes da etapa de explicação.",
  "Faça perguntas curtas, dê pistas e peça que o aluno explique o raciocínio.",
  "Use português do Brasil, linguagem acolhedora e curiosa, com frases curtas.",
  "Responda somente com o JSON pedido.",
].join(" ");

type ReplyArgs = {
  action: TutorAction;
  exercise: Exercise;
  next: Exercise;
  studentAnswer: string;
  wrongCount: number;
};

function instructionFor(args: ReplyArgs): string {
  if (args.action === "solved") {
    return "O aluno acertou. Parabenize em uma frase e peça que explique com as próprias palavras como chegou ao resultado.";
  }
  if (args.action === "explain") {
    return [
      "O aluno errou três vezes. Explique o exercício passo a passo, sem ser condescendente, usando estas etapas:",
      ...args.exercise.steps.map((s, i) => `${i + 1}. ${s}`),
      `Depois, proponha o exercício parecido: "${args.next.statement}". Não resolva esse exercício.`,
    ].join("\n");
  }
  return [
    `O aluno errou ${args.wrongCount} vez(es). Dê uma dica em forma de pergunta.`,
    "Não revele a resposta final nem o número que resolve o exercício.",
  ].join("\n");
}

export function buildRequestBody(args: ReplyArgs) {
  const userText = [
    `Exercício: ${args.exercise.statement}`,
    `Resposta do aluno: ${args.studentAnswer}`,
    `Instrução: ${instructionFor(args)}`,
  ].join("\n");

  return {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: { resposta_ao_aluno: { type: "STRING" } },
        required: ["resposta_ao_aluno"],
      },
      temperature: 0.6,
      maxOutputTokens: 400,
    },
  };
}

export function parseReply(raw: unknown): string {
  const candidates = (raw as { candidates?: { content?: { parts?: { text?: string }[] } }[] })?.candidates;
  const text = candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") throw new TutorUnavailableError("empty_reply");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new TutorUnavailableError("invalid_json");
  }
  const reply = (parsed as { resposta_ao_aluno?: unknown })?.resposta_ao_aluno;
  if (typeof reply !== "string" || reply.trim().length === 0 || reply.length > 1500) {
    throw new TutorUnavailableError("invalid_shape");
  }
  return reply.trim();
}

export class GeminiProvider implements TutorProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_GEMINI_MODEL,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async judge(studentAnswer: string, exercise: Exercise) {
    return isCorrectAnswer(studentAnswer, exercise.answer) ? "correta" : "incorreta";
  }

  async reply(args: ReplyArgs): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify(buildRequestBody(args)),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    });
    if (!res.ok) throw new TutorUnavailableError(`gemini_${res.status}`);
    return parseReply(await res.json());
  }
}
