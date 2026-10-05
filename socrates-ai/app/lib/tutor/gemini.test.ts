import { describe, expect, it } from "vitest";
import { EXERCISES } from "./escada";
import { buildRequestBody, GeminiProvider, parseReply } from "./gemini";
import { TutorUnavailableError } from "./turn";

const ex = EXERCISES[0];
const next = EXERCISES[1];
const base = { exercise: ex, next, studentAnswer: "eu acho que é 10", wrongCount: 1 };

const okResponse = (text: string) => ({
  candidates: [{ content: { parts: [{ text }] } }],
});

describe("buildRequestBody", () => {
  it("não inclui a resposta final numa dica", () => {
    const body = JSON.stringify(buildRequestBody({ ...base, action: "hint" }));
    expect(body).toContain("Não revele");
    expect(body).not.toContain("= 11");
  });

  it("explica passo a passo e propõe o exercício novo na explicação", () => {
    const body = JSON.stringify(buildRequestBody({ ...base, action: "explain" }));
    expect(body).toContain("passo a passo");
    expect(body).toContain(next.statement);
  });

  it("pede saída JSON com o campo resposta_ao_aluno", () => {
    const body = buildRequestBody({ ...base, action: "hint" });
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema.required).toEqual(["resposta_ao_aluno"]);
  });
});

describe("parseReply", () => {
  it("lê a resposta do tutor", () => {
    expect(parseReply(okResponse(JSON.stringify({ resposta_ao_aluno: "Qual valor você colocaria?" })))).toBe("Qual valor você colocaria?");
  });

  it("rejeita resposta vazia, JSON inválido e formato errado", () => {
    expect(() => parseReply({})).toThrow(TutorUnavailableError);
    expect(() => parseReply(okResponse("não é json"))).toThrow(TutorUnavailableError);
    expect(() => parseReply(okResponse(JSON.stringify({ outro: "x" })))).toThrow(TutorUnavailableError);
    expect(() => parseReply(okResponse(JSON.stringify({ resposta_ao_aluno: "   " })))).toThrow(TutorUnavailableError);
  });
});

describe("GeminiProvider", () => {
  it("faz uma chamada por turno com a chave no cabeçalho", async () => {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const fakeFetch = (async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), headers: init.headers as Record<string, string> });
      return new Response(JSON.stringify(okResponse(JSON.stringify({ resposta_ao_aluno: "Pensa nisso." }))), { status: 200 });
    }) as typeof fetch;

    const provider = new GeminiProvider("chave-teste", "modelo-teste", fakeFetch);
    const reply = await provider.reply({ ...base, action: "hint" });

    expect(reply).toBe("Pensa nisso.");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/models/modelo-teste:generateContent");
    expect(calls[0].headers["x-goog-api-key"]).toBe("chave-teste");
  });

  it("converte erro HTTP em erro controlado", async () => {
    const fakeFetch = (async () => new Response("erro", { status: 429 })) as typeof fetch;
    const provider = new GeminiProvider("k", "m", fakeFetch);
    await expect(provider.reply({ ...base, action: "hint" })).rejects.toBeInstanceOf(TutorUnavailableError);
  });

  it("o juiz continua local, sem chamada ao modelo", async () => {
    let called = false;
    const fakeFetch = (async () => {
      called = true;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    const provider = new GeminiProvider("k", "m", fakeFetch);
    expect(await provider.judge("11", ex)).toBe("correta");
    expect(await provider.judge("não é 11", ex)).toBe("incorreta");
    expect(called).toBe(false);
  });
});
