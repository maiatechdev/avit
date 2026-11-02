import { beforeEach, describe, expect, it, vi } from "vitest";

// Os endpoints são testados sem banco: os módulos que falam com o Neon são substituídos,
// e as funções puras (validação, cookies, resumo do painel) continuam as reais.

vi.mock("../lib/participants/participants", () => ({
  ensureParticipantsTable: vi.fn(async () => undefined),
  joinAsParticipant: vi.fn(async () => "token-aluno"),
  resolveParticipant: vi.fn(async () => null),
}));
vi.mock("../lib/sessions/teacher", () => ({ isTeacherOf: vi.fn(async () => false) }));
vi.mock("../lib/sessions/store", () => ({ createNeonSessionsStore: vi.fn(() => ({})) }));
vi.mock("../lib/sessions/service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/sessions/service")>()),
  joinSession: vi.fn(),
  createSession: vi.fn(),
}));
vi.mock("../lib/http/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/http/rateLimit")>()),
  registerAttempt: vi.fn(async () => true),
  isBlocked: vi.fn(async () => false),
  purgeRateLimits: vi.fn(async () => undefined),
}));
vi.mock("../lib/privacy/retention", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/privacy/retention")>()),
  eraseSession: vi.fn(async () => undefined),
  purgeExpired: vi.fn(async () => undefined),
}));
vi.mock("../lib/dashboard/summary", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/dashboard/summary")>()),
  ensureParticipationsTable: vi.fn(async () => undefined),
  savePath: vi.fn(async () => undefined),
  readDashboard: vi.fn(async () => null),
}));
vi.mock("../lib/checkins/checkin", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/checkins/checkin")>()),
  createNeonCheckinStore: vi.fn(() => ({ save: vi.fn(async () => undefined) })),
}));
vi.mock("../lib/tutor/attempts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/tutor/attempts")>();
  const store = actual.createMemoryAttemptsStore();
  return { ...actual, createNeonAttemptsStore: vi.fn(() => store) };
});

import { joinAsParticipant, resolveParticipant } from "../lib/participants/participants";
import { isTeacherOf } from "../lib/sessions/teacher";
import { createSession, joinSession, SessionNotFoundError } from "../lib/sessions/service";
import { isBlocked, registerAttempt } from "../lib/http/rateLimit";
import { eraseSession, purgeExpired } from "../lib/privacy/retention";
import { readDashboard, savePath } from "../lib/dashboard/summary";
import sessionsHandler from "../api/sessions/index";
import joinHandler from "../api/sessions/join/index";
import eraseHandler from "../api/sessions/erase/index";
import checkinsHandler from "../api/checkins/index";
import participationsHandler from "../api/participations/index";
import tutorHandler from "../api/tutor/turn";
import dashboardHandler from "../api/dashboard/index";
import cronHandler from "../api/cron/retention";

const SESSION = "sessao-1";

function post(body: unknown, cookie?: string): Request {
  return new Request("https://app.test/api", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7", ...(cookie ? { cookie } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function get(url: string, headers: Record<string, string> = {}): Request {
  return new Request(`https://app.test${url}`, { headers });
}

const errorOf = async (res: Response) => ((await res.json()) as { error: string }).error;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = "postgres://teste";
  delete process.env.GEMINI_API_KEY;
  delete process.env.CRON_SECRET;
  vi.mocked(resolveParticipant).mockResolvedValue(null);
  vi.mocked(isTeacherOf).mockResolvedValue(false);
  vi.mocked(registerAttempt).mockResolvedValue(true);
  vi.mocked(isBlocked).mockResolvedValue(false);
});

describe("todas as rotas", () => {
  it("recusam método errado e JSON inválido", async () => {
    for (const handler of [sessionsHandler, joinHandler, eraseHandler, checkinsHandler, participationsHandler, tutorHandler]) {
      expect((await handler(get("/api"))).status).toBe(405);
      expect((await handler(post("{nao é json"))).status).toBe(400);
    }
    expect((await dashboardHandler(post({}))).status).toBe(405);
  });

  it("respondem 503 sem banco configurado", async () => {
    delete process.env.DATABASE_URL;
    const res = await sessionsHandler(post({ objective: "Calcular função afim" }));
    expect(res.status).toBe(503);
    expect(await errorOf(res)).toBe("database_not_configured");
  });
});

describe("POST /api/sessions", () => {
  it("cria a sessão e entrega o token do professor só no cookie HttpOnly", async () => {
    vi.mocked(createSession).mockResolvedValue({ id: SESSION, code: "SOC-1234", objective: "Função afim", teacherToken: "segredo" });
    const res = await sessionsHandler(post({ objective: "Função afim" }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: SESSION, code: "SOC-1234", objective: "Função afim" });
    expect(res.headers.get("set-cookie")).toMatch(/^sct_sessao-1=segredo; .*HttpOnly/);
  });

  it("recusa objetivo curto demais", async () => {
    expect(await errorOf(await sessionsHandler(post({ objective: "ab" })))).toBe("invalid_objective");
  });

  it("limita a criação de sessões por IP, com o IP em hash", async () => {
    vi.mocked(registerAttempt).mockResolvedValue(false);
    const res = await sessionsHandler(post({ objective: "Função afim" }));
    expect(res.status).toBe(429);
    expect(createSession).not.toHaveBeenCalled();
    const key = vi.mocked(registerAttempt).mock.calls[0][1];
    expect(key).toMatch(/^create:[0-9a-f]{64}$/);
    expect(key).not.toContain("203.0.113.7");
  });
});

describe("POST /api/sessions/join", () => {
  it("entra com código certo sem contar a tentativa", async () => {
    vi.mocked(joinSession).mockResolvedValue({ id: SESSION, code: "SOC-1234", objective: "Função afim" });
    const res = await joinHandler(post({ code: "SOC-1234" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/^sp_sessao-1=token-aluno; .*HttpOnly/);
    expect(registerAttempt).not.toHaveBeenCalled();
  });

  it("a turma inteira entra pelo mesmo IP: 40 entradas certas seguidas passam", async () => {
    vi.mocked(joinSession).mockResolvedValue({ id: SESSION, code: "SOC-1234", objective: "Função afim" });
    for (let i = 0; i < 40; i++) expect((await joinHandler(post({ code: "SOC-1234" }))).status).toBe(200);
    expect(registerAttempt).not.toHaveBeenCalled();
  });

  it("conta o código errado e responde 404", async () => {
    vi.mocked(joinSession).mockRejectedValue(new SessionNotFoundError("SOC-0000"));
    const res = await joinHandler(post({ code: "SOC-0000" }));
    expect(res.status).toBe(404);
    expect(registerAttempt).toHaveBeenCalledTimes(1);
  });

  it("bloqueia o IP que já errou demais, antes de procurar o código", async () => {
    vi.mocked(isBlocked).mockResolvedValue(true);
    const res = await joinHandler(post({ code: "SOC-1234" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("600");
    expect(joinSession).not.toHaveBeenCalled();
  });

  it("reaproveita o token do aluno que entra de novo no mesmo aparelho", async () => {
    vi.mocked(joinSession).mockResolvedValue({ id: SESSION, code: "SOC-1234", objective: "Função afim" });
    await joinHandler(post({ code: "SOC-1234" }, "sp_sessao-1=token-antigo"));
    expect(joinAsParticipant).toHaveBeenCalledWith("postgres://teste", SESSION, "token-antigo");
  });
});

describe("POST /api/checkins e /api/participations", () => {
  const checkin = { sessionId: SESSION, difficulty: "duvidas", time: "medio", feeling: "ok" };

  it("exigem o cookie de aluno da própria sessão", async () => {
    expect((await checkinsHandler(post(checkin))).status).toBe(401);
    expect((await participationsHandler(post({ sessionId: SESSION, path: "criar" }, "sp_sessao-1=x"))).status).toBe(401);
    expect(resolveParticipant).toHaveBeenCalledWith("postgres://teste", SESSION, "x");
  });

  it("gravam com o participante resolvido pelo cookie, não pelo corpo", async () => {
    vi.mocked(resolveParticipant).mockResolvedValue("aluno-a");
    const res = await checkinsHandler(post({ ...checkin, participantId: "outro" }, "sp_sessao-1=t"));
    expect(res.status).toBe(201);
    expect(typeof ((await res.json()) as { mission: string }).mission).toBe("string");

    expect((await participationsHandler(post({ sessionId: SESSION, path: "criar" }, "sp_sessao-1=t"))).status).toBe(201);
    expect(savePath).toHaveBeenCalledWith("postgres://teste", SESSION, "aluno-a", "criar");
  });

  it("recusam valores fora da lista", async () => {
    expect((await checkinsHandler(post({ ...checkin, feeling: "feliz" }))).status).toBe(400);
    expect((await participationsHandler(post({ sessionId: SESSION, path: "voar" }))).status).toBe(400);
  });
});

describe("POST /api/tutor/turn", () => {
  const turn = { sessionId: SESSION, exerciseId: "f1-avaliacao-1", message: "8 + 3 = 11" };

  it("exige o cookie de aluno", async () => {
    expect((await tutorHandler(post(turn))).status).toBe(401);
  });

  it("responde com o stub quando não há chave do Gemini", async () => {
    vi.mocked(resolveParticipant).mockResolvedValue("aluno-tutor");
    const res = await tutorHandler(post(turn, "sp_sessao-1=t"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ action: "solved", resultado: "correta" });
  });

  it("limita os turnos por aluno e por sessão", async () => {
    vi.mocked(resolveParticipant).mockResolvedValue("aluno-a");
    vi.mocked(registerAttempt).mockResolvedValueOnce(false);
    const res = await tutorHandler(post(turn, "sp_sessao-1=t"));
    expect(res.status).toBe(429);
    expect(await errorOf(res)).toBe("too_many_turns");
  });

  it("recusa exercício desconhecido e mensagem longa demais", async () => {
    vi.mocked(resolveParticipant).mockResolvedValue("aluno-a");
    expect((await tutorHandler(post({ ...turn, exerciseId: "nao-existe" }, "sp_sessao-1=t"))).status).toBe(404);
    expect((await tutorHandler(post({ ...turn, message: "x".repeat(1001) }, "sp_sessao-1=t"))).status).toBe(400);
  });
});

describe("GET /api/dashboard e POST /api/sessions/erase", () => {
  it("só o professor da sessão lê o painel", async () => {
    expect((await dashboardHandler(get(`/api/dashboard?sessionId=${SESSION}`))).status).toBe(401);
    // Cookie de aluno não abre o painel.
    expect((await dashboardHandler(get(`/api/dashboard?sessionId=${SESSION}`, { cookie: "sp_sessao-1=t" }))).status).toBe(401);
    expect((await dashboardHandler(get(`/api/dashboard?sessionId=${SESSION}`, { cookie: "sct_sessao-1=errado" }))).status).toBe(401);
    expect(readDashboard).not.toHaveBeenCalled();
  });

  it("devolve o resumo ao professor", async () => {
    vi.mocked(isTeacherOf).mockResolvedValue(true);
    vi.mocked(readDashboard).mockResolvedValue({ students: 6, chosen: 6, paths: { criar: 6 }, stuck: 0, solvers: 3 });
    const res = await dashboardHandler(get(`/api/dashboard?sessionId=${SESSION}`, { cookie: "sct_sessao-1=certo" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ students: 6, enough: true, competence: 50 });
  });

  it("só o professor apaga a turma, e o cookie dele sai junto", async () => {
    expect((await eraseHandler(post({ sessionId: SESSION }, "sct_sessao-1=errado"))).status).toBe(401);
    expect(eraseSession).not.toHaveBeenCalled();

    vi.mocked(isTeacherOf).mockResolvedValue(true);
    const res = await eraseHandler(post({ sessionId: SESSION }, "sct_sessao-1=certo"));
    expect(res.status).toBe(200);
    expect(eraseSession).toHaveBeenCalledWith("postgres://teste", SESSION);
    expect(res.headers.get("set-cookie")).toMatch(/^sct_sessao-1=; .*Max-Age=0/);
  });
});

describe("GET /api/cron/retention", () => {
  it("fica fechada sem CRON_SECRET e com segredo errado", async () => {
    expect((await cronHandler(get("/api/cron/retention", { authorization: "Bearer qualquer" }))).status).toBe(401);
    process.env.CRON_SECRET = "segredo-cron";
    expect((await cronHandler(get("/api/cron/retention", { authorization: "Bearer outro" }))).status).toBe(401);
    expect(purgeExpired).not.toHaveBeenCalled();
  });

  it("apaga as sessões vencidas e os contadores quando chamada pela Vercel", async () => {
    process.env.CRON_SECRET = "segredo-cron";
    const res = await cronHandler(get("/api/cron/retention", { authorization: "Bearer segredo-cron" }));
    expect(res.status).toBe(200);
    expect(purgeExpired).toHaveBeenCalledTimes(1);
  });
});
