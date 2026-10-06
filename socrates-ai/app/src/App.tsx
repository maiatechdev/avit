import { useState, useRef, useEffect, useCallback } from "react";
import { Shell } from "./components/Shell";
import { QuestionBubble, Toggle, Confetti } from "./components/primitives";
import { SceneInvestigar, SceneCriar, SceneResolver, SceneColaborar, SceneReflection } from "./components/scenes";
import type { Session, Path, Message, DashboardData } from "./shared/contracts";
import { apiCreateSession, apiEraseSession, apiJoinSession, postJson, getRequest } from "./api/client";
import { codeFromSearch, entryFor, needsSession, ROUTES, screenFromPath, type Screen } from "./shared/routes";
import QRCode from "qrcode";
import logoSocratesAi from "@/imports/logoSocratesAi.svg";

// Botão de voltar padrão de todas as telas: usa a rota anterior do app, não o histórico do aparelho.
function BackLink({ onClick, label = "← Voltar" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="self-start text-sm font-bold mb-6 py-1" style={{ color: "var(--muted-foreground)" }}>
      {label}
    </button>
  );
}

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ── Design primitives ─────────────────────────────────────────────────────────

// ── Screen 0: Intro / Splash ──────────────────────────────────────────────────

function Intro({ onEnter, onStudent, onPrivacy }: { onEnter: () => void; onStudent: () => void; onPrivacy: () => void }) {
  return (
    <div
      className="min-h-screen flex items-start justify-center"
      style={{ background: "var(--background)" }}
    >
      <div
        className="relative w-full mx-auto max-w-3xl flex flex-col min-h-[100svh] items-center"
      >
        {/* Logo centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
          <img
            src={logoSocratesAi}
            alt="Socrates AI"
            className="w-full object-contain"
            style={{ maxWidth: 300 }}
          />

          {/* Slogan */}
          <p
            className="text-center font-extrabold uppercase leading-snug"
            style={{
              color: "var(--foreground)",
              fontFamily: "Nunito, sans-serif",
              fontSize: "clamp(15px, 4.2vw, 18px)",
              letterSpacing: "0.04em",
              textShadow: "0 1px 4px rgba(0,0,0,0.12)",
            }}
          >
            Transformando o smartphone em uma ferramenta de aprendizagem.
          </p>
        </div>

        {/* CTA section */}
        <div className="w-full px-6 pb-12 pt-4 flex flex-col gap-4">
          <button
            onClick={onEnter}
            className="cartoon-btn w-full py-4 text-base font-extrabold"
            style={{
              background: "var(--primary)",
              color: "#FFFFFF",
              fontFamily: "Nunito, sans-serif",
              letterSpacing: "0.01em",
            }}
          >
            Entrar no app
          </button>
          <button
            onClick={onStudent}
            className="cartoon-btn w-full py-4 text-base font-extrabold"
            style={{ background: "var(--card)", color: "var(--foreground)", fontFamily: "Nunito, sans-serif" }}
          >
            Sou aluno: entrar com código
          </button>
          <p
            className="text-center text-xs"
            style={{ color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}
          >
            Uso pedagógico mediado — Lei 15.100/2025
          </p>
          <button onClick={onPrivacy} className="text-center text-xs font-bold underline" style={{ color: "var(--muted-foreground)" }}>
            Política de privacidade
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Screen 1: Teacher Activate ────────────────────────────────────────────────

function TeacherActivate({ onActivate, onBack }: { onActivate: (session: Session) => void; onBack: () => void }) {
  const [objective, setObjective] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const activate = async () => {
    setBusy(true);
    setError(false);
    try {
      onActivate(await apiCreateSession(objective.trim()));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell wide>
      <div className="screen-enter flex flex-col min-h-[100svh] px-6 pt-6 pb-8 lg:mx-auto lg:max-w-2xl lg:w-full lg:py-12">
        <BackLink onClick={onBack} />
        <div className="flex items-center gap-2 self-start mb-8">
          <span className="w-2 h-2 rounded-full block" style={{ background: "var(--ai)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--ai)" }}>
            Uso pedagógico ativo — Lei 15.100/2025
          </span>
        </div>

        <div className="mb-8">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--primary)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Painel do professor</p>
          <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
            O que a turma vai explorar hoje?
          </h1>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ex: Compreender mudanças climáticas"
              rows={4}
              className="w-full resize-none text-base leading-relaxed outline-none transition-all"
              style={{
                background: "var(--card)",
                border: `1.5px solid ${objective ? "var(--primary)" : "var(--border)"}`,
                borderRadius: "var(--radius)",
                padding: "16px 18px",
                color: "var(--foreground)",
                fontFamily: "Outfit, sans-serif",
                boxShadow: objective ? "0 0 0 3px rgba(47,107,232,0.15)" : "none",
              }}
            />
            <p className="text-xs mt-2 ml-1" style={{ color: "var(--muted-foreground)" }}>
              Quanto mais específico, mais a IA consegue guiar os alunos.
            </p>
          </div>

          <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "var(--muted)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>IDEIAS DE HOJE</p>
            {[
              "Compreender as causas da desigualdade no Brasil",
              "Analisar o impacto das redes sociais na saúde mental",
              "Explorar soluções sustentáveis para resíduos urbanos",
            ].map((t) => (
              <button key={t} onClick={() => setObjective(t)} className="tap-scale text-left text-sm py-1.5 px-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.65)", color: "var(--foreground)", fontFamily: "Outfit, sans-serif" }}>
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={activate}
            disabled={!objective.trim() || busy}
            className="btn-bounce w-full py-4 text-base font-bold rounded-2xl"
            style={{
              background: objective.trim() ? "var(--primary)" : "var(--muted)",
              color: objective.trim() ? "var(--primary-foreground)" : "var(--muted-foreground)",
              letterSpacing: "0.01em",
            }}
          >
            {busy ? "Criando sessão…" : "Ativar sessão pra turma"}
          </button>
          {error && (
            <p className="text-sm text-center" style={{ color: "#B42318" }}>Não consegui criar a sessão agora. Tente de novo.</p>
          )}
        </div>
      </div>
    </Shell>
  );
}

// ── Screen 2: Teacher Activated (QR) ─────────────────────────────────────────

// QR real: aponta para a entrada do aluno já com o código preenchido.
function SessionQr({ url }: { url: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { margin: 1, width: 192, color: { dark: "#142463", light: "#FFFFFF" } })
      .then((data) => { if (!cancelled) setSrc(data); })
      .catch(() => { if (!cancelled) setSrc(null); });
    return () => { cancelled = true; };
  }, [url]);
  return src ? (
    <img src={src} alt="QR code para entrar na sessão" width={192} height={192} className="rounded-2xl" />
  ) : (
    <div style={{ width: 192, height: 192 }} className="rounded-2xl" aria-hidden="true" />
  );
}

function TeacherActivated({ session, onBack, onViewDashboard }: { session: Session | null; onBack: () => void; onViewDashboard: () => void }) {
  const joinUrl = session ? `${window.location.origin}${ROUTES["student-join"]}?codigo=${encodeURIComponent(session.code)}` : "";
  return (
    <Shell wide>
      <div className="screen-enter flex flex-col min-h-[100svh] px-6 pt-6 pb-8 lg:mx-auto lg:max-w-lg lg:w-full lg:py-12">
        <BackLink onClick={onBack} />
        <div className="flex items-center gap-2 mb-8">
          <span className="w-2 h-2 rounded-full block" style={{ background: "#2FB67C" }} />
          <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Sessão ativa — Lei 15.100/2025</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: "#E9FAF2" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#1F8F5F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">Sessão ativada!</h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Peça para a turma escanear o QR ou usar o código abaixo.
            </p>
          </div>

          <div className="rounded-3xl p-5 flex flex-col items-center gap-4" style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}>
            {session && <SessionQr url={joinUrl} />}
            <div className="px-6 py-3 rounded-2xl text-center" style={{ background: "var(--muted)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Código da sessão</p>
              <p className="text-3xl font-bold tracking-[0.15em]" style={{ color: "var(--primary)" }}>{session?.code ?? "SOC-----"}</p>
            </div>
          </div>

          <div className="w-full rounded-2xl p-4 flex items-center gap-3" style={{ background: "var(--secondary)", border: "2px solid var(--border)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5" />
            </svg>
            <p className="text-sm" style={{ color: "var(--secondary-foreground)" }}>
              Objetivo: <strong>{session?.objective ?? "—"}</strong>
            </p>
          </div>
        </div>

        <button onClick={onViewDashboard} className="btn-bounce w-full py-4 text-base font-bold rounded-2xl mt-6 lg:max-w-md lg:mx-auto"
          style={{ background: "var(--muted)", color: "var(--foreground)" }}>
          Ver painel da turma
        </button>
      </div>
    </Shell>
  );
}

// ── Screen 3: Student Path Choice ────────────────────────────────────────────

const PATHS = [
  { id: "investigar", Scene: SceneInvestigar, title: "Investigar", desc: "Pesquisar e comparar fontes", activeBorder: "#F5B82E", activeBg: "#FFF8DD" },
  { id: "criar",      Scene: SceneCriar,      title: "Criar",      desc: "Produzir um vídeo curto",   activeBorder: "#FF7A59", activeBg: "#FFF0EB" },
  { id: "resolver",   Scene: SceneResolver,   title: "Resolver",   desc: "Solucionar um problema real", activeBorder: "#2FB67C", activeBg: "#E9FAF2" },
  { id: "colaborar",  Scene: SceneColaborar,  title: "Colaborar",  desc: "Desenvolver solução em grupo", activeBorder: "#8E6CFF", activeBg: "#F1EDFF" },
];

function StudentJoin({ onJoined, onBack }: { onJoined: (session: Session) => void; onBack: () => void }) {
  const [code, setCode] = useState(() => codeFromSearch(window.location.search));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = code.trim().length > 0 && !busy;

  const enter = async () => {
    const normalized = code.trim().toUpperCase();
    setBusy(true);
    setError(null);
    try {
      const session = await apiJoinSession(normalized);
      onJoined({ ...session, code: normalized });
    } catch (error) {
      setError(
        error instanceof Error && error.message === "not_found"
          ? "Não encontramos uma sessão com esse código. Confira com o professor."
          : error instanceof Error && error.message === "too_many_attempts"
            ? "Muitas tentativas seguidas. Espere alguns minutos e tente de novo."
            : "Não consegui entrar agora. Tente de novo.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <div className="screen-enter flex flex-col min-h-[100svh] px-6 pt-10 pb-24 lg:mx-auto lg:max-w-lg lg:w-full">
        <button onClick={onBack} className="self-start text-sm font-bold mb-8" style={{ color: "var(--muted-foreground)" }}>
          ← Voltar
        </button>
        <div className="cartoon-card p-6 flex flex-col gap-4">
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>Digite o código da sessão</h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            O professor mostra o código na tela, no formato SOC-1234.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && ready) enter(); }}
            placeholder="SOC-1234"
            autoCapitalize="characters"
            aria-label="Código da sessão"
            className="w-full text-2xl font-extrabold tracking-widest text-center py-4 rounded-2xl outline-none"
            style={{ background: "var(--muted)", border: "2px solid var(--border)", color: "var(--foreground)" }}
          />
          {error && <p className="text-sm" style={{ color: "#B42318" }}>{error}</p>}
          <button
            onClick={enter}
            disabled={!ready}
            className="cartoon-btn w-full py-4 text-base font-extrabold"
            style={{ background: ready ? "var(--primary)" : "var(--muted)", color: ready ? "#FFFFFF" : "var(--muted-foreground)" }}
          >
            {busy ? "Entrando…" : "Entrar na sessão"}
          </button>
        </div>
      </div>
    </Shell>
  );
}

const CHECKIN_OPTIONS = {
  difficulty: [
    { value: "entendo", label: "Entendo bem" },
    { value: "duvidas", label: "Tenho dúvidas" },
    { value: "nao_entendi", label: "Não entendi ainda" },
  ],
  time: [
    { value: "pouco", label: "Pouco (até 10 min)" },
    { value: "medio", label: "Médio (cerca de 20 min)" },
    { value: "bastante", label: "Bastante (30 min ou mais)" },
  ],
  feeling: [
    { value: "animado", label: "Animado" },
    { value: "ok", label: "Tranquilo" },
    { value: "cansado", label: "Cansado" },
    { value: "desmotivado", label: "Desmotivado" },
  ],
} as const;

function StudentCheckin({ sessionId, onBack, onDone }: { sessionId: string; onBack: () => void; onDone: (mission: string) => void }) {
  const [answers, setAnswers] = useState<{ difficulty?: string; time?: string; feeling?: string }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const complete = Boolean(answers.difficulty && answers.time && answers.feeling);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await postJson("/api/checkins", { sessionId, ...answers });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { mission: string };
      onDone(data.mission);
    } catch {
      setError("Não consegui salvar suas respostas. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  const group = (title: string, key: "difficulty" | "time" | "feeling", options: readonly { value: string; label: string }[]) => (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-extrabold" style={{ color: "var(--muted-foreground)" }}>{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = answers[key] === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setAnswers((prev) => ({ ...prev, [key]: option.value }))}
              className="tap-scale px-4 py-2.5 rounded-full text-sm font-bold"
              style={{
                background: active ? "var(--primary)" : "var(--card)",
                color: active ? "#FFFFFF" : "var(--foreground)",
                border: "2px solid var(--border)",
                boxShadow: active ? "none" : "0 3px 0 var(--border)",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Shell>
      <div className="screen-enter flex flex-col min-h-[100svh] px-5 pt-10 pb-8 lg:mx-auto lg:max-w-2xl lg:w-full">
        <BackLink onClick={onBack} />
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: "var(--foreground)" }}>Antes de começar</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
          Três perguntas rápidas para a sua missão ficar do seu tamanho.
        </p>
        <div className="cartoon-card p-5 flex flex-col gap-6">
          {group("Como você está com o assunto?", "difficulty", CHECKIN_OPTIONS.difficulty)}
          {group("Quanto tempo você tem hoje?", "time", CHECKIN_OPTIONS.time)}
          {group("Como você está se sentindo?", "feeling", CHECKIN_OPTIONS.feeling)}
        </div>
        {error && <p className="text-sm mt-4" style={{ color: "#B42318" }}>{error}</p>}
        <button
          onClick={send}
          disabled={!complete || busy}
          className="cartoon-btn w-full py-4 text-base font-extrabold mt-6"
          style={{ background: complete && !busy ? "var(--primary)" : "var(--muted)", color: complete && !busy ? "#FFFFFF" : "var(--muted-foreground)" }}
        >
          {busy ? "Salvando…" : "Continuar"}
        </button>
      </div>
    </Shell>
  );
}

function StudentPaths({ objective, onBack, onChoose }: { objective: string; onBack: () => void; onChoose: (path: Path) => void }) {
  const [selected, setSelected] = useState<Path>(null);

  return (
    <Shell wide>
      <div className="screen-enter flex flex-col min-h-[100svh] px-5 pt-6 pb-8 lg:px-12 lg:pt-12 lg:mx-auto lg:max-w-6xl lg:w-full">
        <BackLink onClick={onBack} />
        {/* Objective banner */}
        <div className="rounded-2xl px-4 py-3 mb-5 flex items-start gap-3" style={{ background: "var(--muted)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mt-0.5 shrink-0">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--primary)" }}>OBJETIVO DE HOJE</p>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{objective}</p>
          </div>
        </div>

        <div className="mb-5">
          <h1 className="text-[26px] font-extrabold leading-tight mb-1" style={{ color: "var(--foreground)" }}>
            Mesmo destino pra todo mundo.
          </h1>
          <p className="text-base font-medium" style={{ color: "var(--muted-foreground)" }}>
            O caminho, você escolhe.
          </p>
        </div>

        {/* Mapa de trilhas: rota até o destino, com cada caminho como um ponto de controle */}
        <div className="relative flex-1">
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <path
              d="M50 4 C 12 26, 88 40, 50 52 S 12 80, 50 96"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.6"
              strokeDasharray="0.1 4.2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 py-2">
            {PATHS.map((p, index) => {
              const active = selected === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id as Path)}
                  aria-pressed={active}
                  className="cartoon-card tap-scale relative flex flex-col overflow-hidden text-left"
                  style={{
                    background: active ? p.activeBg : "var(--card)",
                    boxShadow: active ? `0 5px 0 ${p.activeBorder}` : "var(--sticker-shadow)",
                    borderColor: active ? p.activeBorder : "var(--border)",
                  }}
                >
                  <span
                    className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold"
                    style={{ background: "var(--accent)", color: "var(--foreground)", border: "2px solid var(--border)" }}
                  >
                    {index + 1}
                  </span>
                  <div className="w-full h-[84px] lg:h-[170px] overflow-hidden">
                    <p.Scene />
                  </div>
                  <div className="px-3 pt-2 pb-3">
                    <p className="text-sm font-bold mb-0.5" style={{ color: "var(--foreground)" }}>{p.title}</p>
                    <p className="text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>{p.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center mt-3">
          <span
            className="px-4 py-1.5 rounded-full text-xs font-extrabold"
            style={{ background: "var(--accent)", color: "var(--foreground)", border: "2px solid var(--border)" }}
          >
            Destino: o objetivo de hoje
          </span>
        </div>

        <button
          onClick={() => selected && onChoose(selected)}
          disabled={!selected}
          className="btn-bounce w-full py-4 text-base font-bold rounded-2xl mt-4"
          style={{ background: selected ? "var(--primary)" : "var(--muted)", color: selected ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
        >
          Bora lá!
        </button>
      </div>
    </Shell>
  );
}

// ── Screen 4: Modo Foco ───────────────────────────────────────────────────────

const DURATIONS = [
  { label: "10 min", secs: 600 },
  { label: "20 min", secs: 1200, suggested: true },
  { label: "30 min", secs: 1800 },
];

function StudentFocus({ onBack, onContinue }: { onBack: () => void; onContinue: (active: boolean, secs: number) => void }) {
  const [enabled, setEnabled] = useState(false);
  const [selectedSecs, setSelectedSecs] = useState(1200);

  return (
    <Shell wide>
      <div className="screen-enter flex flex-col min-h-[100svh] px-5 pt-10 pb-8 lg:px-16 lg:pt-20 lg:mx-auto lg:max-w-6xl lg:w-full lg:grid lg:grid-cols-2 lg:gap-20 lg:items-center">
        <div className="lg:flex lg:flex-col">
        <BackLink onClick={onBack} />
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: enabled ? "var(--ai-muted)" : "var(--muted)", transition: "background 0.3s" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={enabled ? "var(--ai)" : "var(--muted-foreground)"}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7" style={{ transition: "stroke 0.3s" }}>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </div>

        <h1 className="text-[22px] font-extrabold leading-snug mb-2">
          Quer silenciar as notificações enquanto resolve o desafio?
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
          Você pode ativar ou pular — a escolha é sua.
        </p>

        </div>
        <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between px-5 py-4 rounded-2xl mb-2"
          style={{ background: "var(--card)", border: `1.5px solid ${enabled ? "rgba(101,108,199,0.4)" : "var(--border)"}`, transition: "border-color 0.25s" }}>
          <div>
            <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Modo Foco</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Silencia notificações durante o desafio</p>
          </div>
          <Toggle on={enabled} onChange={setEnabled} />
        </div>

        <p className="text-xs mb-6 ml-1" style={{ color: "var(--muted-foreground)" }}>
          Você pode desativar a qualquer momento, sem perder seu progresso.
        </p>

        {/* Duration chips — animated show/hide */}
        <div style={{ overflow: "hidden", maxHeight: enabled ? 130 : 0, opacity: enabled ? 1 : 0, transition: "max-height 0.32s ease, opacity 0.25s ease" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--muted-foreground)" }}>DURAÇÃO</p>
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map((d) => (
              <button key={d.secs} onClick={() => setSelectedSecs(d.secs)}
                className="tap-scale flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold"
                style={{ background: selectedSecs === d.secs ? "var(--ai)" : "var(--muted)", color: selectedSecs === d.secs ? "white" : "var(--foreground)" }}>
                {d.label}
                {d.suggested && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: selectedSecs === d.secs ? "rgba(255,255,255,0.22)" : "rgba(101,108,199,0.12)", color: selectedSecs === d.secs ? "white" : "var(--ai)" }}>
                    sugerido
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-xl" style={{ background: "var(--ai-muted)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--ai)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.4" />
            </svg>
            <p className="text-xs" style={{ color: "var(--ai)" }}>Baseado no tempo médio de desafios como esse.</p>
          </div>
        </div>

        <div className="flex-1" />

        <button onClick={() => onContinue(enabled, enabled ? selectedSecs : 0)}
          className="btn-bounce w-full py-4 text-base font-bold rounded-2xl"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          Continuar
        </button>
        </div>
      </div>
    </Shell>
  );
}

// ── Screen 5: Student Chat ────────────────────────────────────────────────────

const EXERCISE_ID = "f1-avaliacao-1";
const DEFAULT_MISSION = "Vamos pensar juntos.";

function StudentChat({ sessionId, mission, path, focusActive: initFocus, focusSecs: initSecs, onBack, onFinish }: { sessionId: string; mission: string | null; path: Path; focusActive: boolean; focusSecs: number; onBack: () => void; onFinish: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: `Oi! ${mission ?? DEFAULT_MISSION} Se f(x) = 2x + 3, quanto vale f(4)? Me conta como você pensaria para resolver.` },
  ]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState(1);
  const [sending, setSending] = useState(false);
  const [exerciseId, setExerciseId] = useState(EXERCISE_ID);

  const [focusOn, setFocusOn] = useState(initFocus);
  const [secsLeft, setSecsLeft] = useState(initSecs);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathLabel = PATHS.find((p) => p.id === path)?.title ?? "Investigar";

  const stopFocus = useCallback(() => {
    setFocusOn(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!focusOn) return;
    timerRef.current = setInterval(() => {
      setSecsLeft((s) => { if (s <= 1) { stopFocus(); return 0; } return s - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [focusOn, stopFocus]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Só libera "Concluí o desafio" quando o raciocínio atinge o nível 3 — não na primeira resposta da IA.
  const showFinish = level >= 3;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((p) => [...p, { role: "student", text }]);
    setInput("");
    setSending(true);
    try {
      const res = await postJson("/api/tutor/turn", { sessionId, exerciseId, message: text });
      if (!res.ok) throw new Error(`tutor ${res.status}`);
      const data = (await res.json()) as { action: string; resposta_ao_aluno: string; exerciseId: string };
      setExerciseId(data.exerciseId);
      setMessages((p) => [...p, { role: "ai", text: data.resposta_ao_aluno }]);
      setLevel(data.action === "solved" ? 3 : 2);
    } catch {
      setMessages((p) => [
        ...p,
        { role: "ai", text: "Não consegui falar com o tutor agora. Tente enviar de novo." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Shell wide>
      <div className="screen-enter flex flex-col lg:flex-row h-[100svh]">
        <div className="flex flex-col flex-1 min-w-0 min-h-0 lg:mx-auto lg:max-w-3xl lg:w-full">
        {/* Header */}
        <div className="px-5 pt-4 pb-4 flex flex-col gap-3" style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          <button onClick={onBack} className="self-start text-sm font-bold py-1" style={{ color: "var(--muted-foreground)" }}>← Voltar</button>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted-foreground)" }}>{pathLabel} — mudanças climáticas</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Nível de raciocínio: {level}/3</p>
            </div>
            <div className="flex items-center gap-2">
              {focusOn ? (
                <>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl" style={{ background: "var(--ai-muted)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--ai)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    <span className="text-xs font-medium" style={{ color: "var(--ai)" }}>Foco · {fmt(secsLeft)}</span>
                  </div>
                  <button onClick={stopFocus} className="tap-scale text-xs px-2 py-1 rounded-xl"
                    style={{ color: "var(--muted-foreground)", background: "var(--muted)" }}>
                    Encerrar
                  </button>
                </>
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "var(--muted)", color: "var(--primary)" }}>A</div>
              )}
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: "var(--muted)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(level / 3) * 100}%`, background: "var(--ai)" }} />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}>
              {m.role === "ai" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 self-end" style={{ background: "var(--foreground)", border: "2px solid var(--border)" }}>
                  <QuestionBubble size={16} color="white" />
                </div>
              )}
              <div
                className="max-w-[78%] px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: m.role === "ai" ? "var(--card)" : "var(--primary)",
                  color: m.role === "ai" ? "var(--foreground)" : "white",
                  borderRadius: m.role === "ai" ? "6px 22px 22px 22px" : "22px 6px 22px 22px",
                  border: "2.5px solid var(--border)",
                  boxShadow: m.role === "ai" ? "0 4px 0 var(--border)" : "0 4px 0 #0E2A8C",
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 pt-3 pb-4 flex flex-col gap-2" style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}>
          {showFinish && (
            <button onClick={onFinish} className="btn-bounce w-full py-3 text-sm font-bold rounded-xl"
              style={{ background: "var(--secondary)", color: "var(--secondary-foreground)", border: "2px solid var(--border)" }}>
              Concluí o desafio!
            </button>
          )}
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Escreva sua resposta…" rows={1}
              className="flex-1 resize-none text-sm outline-none py-3 px-4 rounded-xl"
              style={{ background: "var(--muted)", color: "var(--foreground)", fontFamily: "Outfit, sans-serif", maxHeight: 100, border: "1.5px solid transparent" }} />
            <button onClick={handleSend} disabled={!input.trim() || sending}
              className="tap-scale w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: input.trim() ? "var(--primary)" : "var(--muted)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={input.trim() ? "white" : "var(--muted-foreground)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
        </div>
        <aside className="hidden lg:flex flex-col gap-5 w-96 shrink-0 p-8" style={{ background: "var(--card)", borderLeft: "2px solid var(--border)" }}>
          <div className="cartoon-card p-5">
            <p className="text-xs font-extrabold mb-1" style={{ color: "var(--muted-foreground)" }}>TRILHA</p>
            <p className="text-lg font-extrabold" style={{ color: "var(--foreground)" }}>{pathLabel}</p>
          </div>
          <div className="cartoon-card p-5">
            <p className="text-xs font-extrabold mb-1" style={{ color: "var(--muted-foreground)" }}>EXERCÍCIO DE HOJE</p>
            <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>Se f(x) = 2x + 3, quanto vale f(4)?</p>
          </div>
          <div className="cartoon-card p-5">
            <p className="text-xs font-extrabold mb-3" style={{ color: "var(--muted-foreground)" }}>NÍVEL DE RACIOCÍNIO</p>
            <div className="flex gap-3">
              {[1, 2, 3].map((n) => (
                <span key={n} className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold"
                  style={{ background: n <= level ? "var(--accent)" : "var(--muted)", color: "var(--foreground)", border: "2px solid var(--border)" }}>{n}</span>
              ))}
            </div>
          </div>
          {focusOn && (
            <div className="cartoon-card p-5">
              <p className="text-xs font-extrabold mb-1" style={{ color: "var(--muted-foreground)" }}>MODO FOCO</p>
              <p className="text-lg font-extrabold" style={{ color: "var(--ai)" }}>{fmt(secsLeft)}</p>
            </div>
          )}
        </aside>
      </div>
    </Shell>
  );
}

// ── Screen 6: Student Reflection ──────────────────────────────────────────────

const FEELINGS = [
  { emoji: "😄", label: "Muito envolvido" },
  { emoji: "🙂", label: "Envolvido" },
  { emoji: "😐", label: "Pouco envolvido" },
  { emoji: "😓", label: "Desmotivado" },
];
const HELPED = ["Escolher como fazer", "Trabalhar com colegas", "O desafio", "Feedback da IA"];

function StudentReflection({ onSend }: { onSend: () => void }) {
  const [feeling, setFeeling] = useState<number | null>(null);
  const [helped, setHelped] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const toggleHelped = (h: string) => setHelped((prev) => {
    const next = new Set(prev);
    if (next.has(h)) next.delete(h);
    else next.add(h);
    return next;
  });

  const handleSubmit = () => {
    if (feeling === null) return;
    setSubmitted(true);
    setTimeout(onSend, 1600);
  };

  return (
    <Shell wide>
      <Confetti active={submitted} />
      <div className="screen-enter flex flex-col min-h-[100svh] pb-24 lg:pb-16 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center lg:mx-auto lg:max-w-6xl lg:w-full lg:px-12">
        {/* Illustration banner */}
        <div className="overflow-hidden" style={{ borderRadius: "0 0 24px 24px" }}>
          <SceneReflection />
        </div>

        <div className="px-5 pt-5 flex-1 flex flex-col lg:px-0 lg:pt-0">
          <h1 className="text-2xl lg:text-4xl font-extrabold mb-1">
            {submitted ? "Boa! Você mandou bem 🎉" : "Como você se sentiu?"}
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
            Sua resposta ajuda o professor a entender o que funcionou.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-7">
            {FEELINGS.map((f, i) => (
              <button key={i} onClick={() => !submitted && setFeeling(i)}
                className="tap-scale flex flex-col items-center py-4 px-3 rounded-2xl border-2 transition-all"
                style={{
                  background: feeling === i ? "var(--primary)" : "var(--card)",
                  borderColor: feeling === i ? "var(--primary)" : "var(--border)",
                  boxShadow: feeling === i ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
                }}>
                <span className="text-3xl mb-2">{f.emoji}</span>
                <span className="text-xs font-semibold text-center leading-snug"
                  style={{ color: feeling === i ? "white" : "var(--foreground)" }}>
                  {f.label}
                </span>
              </button>
            ))}
          </div>

          <h2 className="text-base font-bold mb-3">O que mais ajudou você?</h2>
          <div className="flex flex-wrap gap-2 mb-auto">
            {HELPED.map((h) => (
              <button key={h} onClick={() => toggleHelped(h)}
                className="tap-scale px-4 py-2 rounded-full text-sm font-medium"
                style={{ background: helped.has(h) ? "var(--accent)" : "var(--muted)", color: "var(--foreground)" }}>
                {h}
              </button>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={feeling === null || submitted}
            className="btn-bounce w-full py-4 text-base font-bold rounded-2xl mt-7"
            style={{
              background: feeling !== null && !submitted ? "var(--primary)" : "var(--muted)",
              color: feeling !== null && !submitted ? "var(--primary-foreground)" : "var(--muted-foreground)",
            }}>
            {submitted ? "Enviado!" : "Enviar"}
          </button>
        </div>
      </div>
    </Shell>
  );
}

// ── Política de privacidade: o que é guardado, quem vê e por quanto tempo ──────

function PrivacyPage({ onBack }: { onBack: () => void }) {
  const section = (title: string, text: string) => (
    <div className="cartoon-card p-5 flex flex-col gap-1.5">
      <h2 className="text-base font-extrabold">{title}</h2>
      <p className="text-sm leading-relaxed" style={{ color: "var(--secondary-foreground)" }}>{text}</p>
    </div>
  );
  return (
    <Shell>
      <div className="screen-enter flex flex-col min-h-[100svh] px-5 pt-6 pb-8 lg:mx-auto lg:max-w-2xl lg:w-full">
        <BackLink onClick={onBack} />
        <h1 className="text-2xl font-extrabold mb-1">Política de privacidade</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
          Esta é uma versão de demonstração. Os dados abaixo são os que o app realmente guarda.
        </p>
        <div className="flex flex-col gap-4">
          {section("O que é guardado", "O código e o objetivo da sessão, as respostas do check-in (dificuldade, tempo disponível e sentimento), a trilha escolhida, a quantidade de tentativas em cada exercício e um código aleatório do aparelho que liga essas respostas à sessão. Não pedimos nome, e-mail, documento nem foto.")}
          {section("Quem vê", "O professor da sessão vê apenas os totais da turma, no painel. Cada aluno vê só a própria sessão. Ninguém vê as respostas de outro aluno.")}
          {section("Tutor de IA", "As mensagens que você escreve no chat são enviadas ao serviço de IA do Google (Gemini) para gerar a resposta do tutor. O app não grava o texto dessas mensagens.")}
          {section("Por quanto tempo", "Os dados de cada sessão são apagados automaticamente após 90 dias. O professor também pode apagar os dados da turma antes, pelo botão no painel.")}
          {section("Uso pedagógico", "O app é de uso pedagógico mediado pelo professor, conforme a Lei 15.100/2025. Dúvidas sobre os dados da turma devem ser levadas ao professor responsável.")}
        </div>
      </div>
    </Shell>
  );
}

// ── Screen 7: Teacher Dashboard ───────────────────────────────────────────────


function TeacherDashboard({ session, onBack, onErased }: { session: Session | null; onBack: () => void; onErased: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error" | "locked">("loading");
  const [confirmErase, setConfirmErase] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [eraseError, setEraseError] = useState(false);

  const erase = async () => {
    if (!session) return;
    setErasing(true);
    setEraseError(false);
    try {
      await apiEraseSession(session.id);
      onErased();
    } catch {
      setEraseError(true);
      setErasing(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    getRequest(`/api/dashboard?sessionId=${encodeURIComponent(session.id)}`)
      .then((res) => {
        if (res.status === 401) throw new Error("locked");
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<DashboardData>;
      })
      .then((body) => {
        if (cancelled) return;
        setData(body);
        setStatus(body.students === 0 ? "empty" : "ready");
      })
      .catch((error: unknown) => {
        if (!cancelled) setStatus(error instanceof Error && error.message === "locked" ? "locked" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const shownStatus = session ? status : "empty";
  const metrics = data
    ? [
        { label: "Engajamento", value: data.engagement, sub: "escolheram uma trilha", color: "#2F6BE8" },
        { label: "Autonomia", value: data.autonomy, sub: "trilhas diferentes usadas pela turma", color: "#A16A00" },
        { label: "Competência", value: data.competence, sub: "alunos que resolveram pelo menos um exercício", color: "#8A5CF0" },
        { label: "Vínculo", value: data.bond, sub: "escolheram colaborar", color: "#1F8F5F" },
      ]
    : [];

  const pathRows = [
    { key: "investigar", label: "Investigar", color: "#F5B82E" },
    { key: "colaborar", label: "Colaborar", color: "#8E6CFF" },
    { key: "resolver", label: "Resolver", color: "#2FB67C" },
    { key: "criar", label: "Criar", color: "#FF7A59" },
  ];
  const totalChosen = data ? Object.values(data.pathCounts).reduce((a, b) => a + b, 0) : 0;

  return (
    <Shell wide>
      <div className="screen-enter flex flex-col min-h-[100svh] px-5 lg:px-10 pt-6 pb-8 overflow-y-auto scrollbar-hide lg:max-w-6xl lg:mx-auto lg:w-full">
        <BackLink onClick={onBack} />
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted-foreground)" }}>PAINEL DO PROFESSOR</p>
            <h1 className="text-xl font-bold leading-tight">{session?.objective ?? "Nenhuma sessão ativa"}</h1>
          </div>
          {session && (
            <div className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "#E9FAF2", color: "#1F8F5F" }}>
              {session.code}
            </div>
          )}
        </div>

        {shownStatus === "loading" && <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando dados da turma…</p>}
        {shownStatus === "empty" && (
          <div className="cartoon-card p-6 mb-6">
            <p className="text-base font-bold">Ainda não há respostas nesta sessão.</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Os números aparecem assim que os alunos entrarem e escolherem uma trilha.</p>
          </div>
        )}
        {shownStatus === "error" && (
          <div className="cartoon-card p-6 mb-6">
            <p className="text-base font-bold" style={{ color: "#B42318" }}>Não consegui carregar o painel agora.</p>
          </div>
        )}
        {shownStatus === "locked" && (
          <div className="cartoon-card p-6 mb-6">
            <p className="text-base font-bold">Este painel só abre no navegador em que a sessão foi criada.</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Use o aparelho do professor que criou a sessão.</p>
          </div>
        )}

        {shownStatus === "ready" && data && !data.enough && (
          <div className="cartoon-card p-6 mb-6">
            <p className="text-base font-bold">Ainda são poucas respostas para mostrar percentuais.</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              {data.students} de {data.required} alunos já fizeram o check-in. Os números aparecem quando a turma chegar a {data.required}.
            </p>
          </div>
        )}

        {shownStatus === "ready" && data && data.enough && (
          <>
            <div className="rounded-2xl p-4 mb-5 flex items-center justify-between" style={{ background: "var(--muted)", border: "2px solid var(--border)" }}>
              <div className="text-center">
                <p className="text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>{data.students}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>alunos no check-in</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {metrics.map((m) => (
                <div key={m.label} className="cartoon-card rounded-2xl p-4 flex flex-col gap-2">
                  <p className="text-xs font-extrabold" style={{ color: "var(--muted-foreground)" }}>{m.label.toUpperCase()}</p>
                  <p className="text-3xl font-extrabold" style={{ color: m.color }}>{m.value}%</p>
                  <div className="w-full h-2 rounded-full" style={{ background: "var(--muted)" }}>
                    <div className="h-full rounded-full" style={{ width: `${m.value}%`, background: m.color }} />
                  </div>
                  <p className="text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>{m.sub}</p>
                </div>
              ))}
            </div>

            <div className="lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">
              <div className="rounded-2xl p-5 flex gap-3 mb-6" style={{ background: "var(--secondary)", border: "2px solid var(--border)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--ai)", border: "2px solid var(--border)" }}>
                  <QuestionBubble size={20} color="white" />
                </div>
                <div>
                  <p className="text-xs font-bold mb-1.5" style={{ color: "var(--foreground)" }}>SUGESTÃO PARA A PRÓXIMA AULA</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--secondary-foreground)" }}>{data.suggestion}</p>
                  <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                    {data.stuckShare}% dos alunos marcaram “não entendi ainda” no check-in.
                  </p>
                </div>
              </div>

              <div className="cartoon-card rounded-2xl p-4 mb-6">
                <p className="text-xs font-extrabold mb-4" style={{ color: "var(--muted-foreground)" }}>ESCOLHAS POR TRILHA</p>
                {pathRows.map((r) => {
                  const count = data.pathCounts[r.key] ?? 0;
                  const share = totalChosen === 0 ? 0 : Math.round((count / totalChosen) * 100);
                  return (
                    <div key={r.key} className="flex items-center gap-3 mb-3 last:mb-0">
                      <p className="text-xs font-bold w-20 shrink-0" style={{ color: "var(--foreground)" }}>{r.label}</p>
                      <div className="flex-1 h-2 rounded-full" style={{ background: "var(--muted)" }}>
                        <div className="h-full rounded-full" style={{ width: `${share}%`, background: r.color }} />
                      </div>
                      <p className="text-xs w-16 text-right" style={{ color: "var(--muted-foreground)" }}>{count} · {share}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {session && shownStatus !== "locked" && (
          <div className="mb-4">
            {!confirmErase ? (
              <button onClick={() => setConfirmErase(true)} className="text-sm font-bold underline" style={{ color: "#B42318" }}>
                Apagar dados desta turma
              </button>
            ) : (
              <div className="cartoon-card p-5 flex flex-col gap-3">
                <p className="text-sm">Isso apaga a sessão, os check-ins, as trilhas e as conversas de todos os alunos. Não dá para desfazer.</p>
                <div className="flex gap-2">
                  <button onClick={erase} disabled={erasing} className="cartoon-btn px-4 py-2.5 text-sm font-extrabold"
                    style={{ background: "#B42318", color: "#FFFFFF" }}>
                    {erasing ? "Apagando…" : "Sim, apagar"}
                  </button>
                  <button onClick={() => setConfirmErase(false)} disabled={erasing} className="cartoon-btn px-4 py-2.5 text-sm font-extrabold"
                    style={{ background: "var(--card)", color: "var(--foreground)" }}>
                    Cancelar
                  </button>
                </div>
                {eraseError && <p className="text-sm" style={{ color: "#B42318" }}>Não consegui apagar agora. Tente de novo.</p>}
              </div>
            )}
          </div>
        )}

        <button onClick={onBack} className="cartoon-btn w-full py-4 text-base font-extrabold"
          style={{ background: "var(--primary)", color: "#FFFFFF" }}>
          Nova sessão
        </button>
      </div>
    </Shell>
  );
}

// ── Estado salvo no navegador: permite recuperar a tela ao recarregar a página ──

type SavedState = { session: Session; mission: string | null; path: Path };
const STATE_KEY = "socrates-state";

function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as SavedState) : null;
  } catch {
    return null;
  }
}

function saveState(state: SavedState | null): void {
  try {
    if (state) localStorage.setItem(STATE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STATE_KEY);
  } catch {
    // Sem armazenamento, a página continua funcionando; só não recupera ao recarregar.
  }
}

// ── App Root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [initial] = useState(() => loadState());
  const [requested, setScreen] = useState<Screen>(() => screenFromPath(window.location.pathname));
  const [path, setPath] = useState<Path>(initial?.path ?? null);
  const [session, setSession] = useState<Session | null>(initial?.session ?? null);
  const [mission, setMission] = useState<string | null>(initial?.mission ?? null);
  const [focusActive, setFocusActive] = useState(false);
  const [focusSecs, setFocusSecs] = useState(0);

  useEffect(() => {
    saveState(session ? { session, mission, path } : null);
  }, [session, mission, path]);

  // Voltar e avançar do navegador trocam a tela conforme a URL.
  useEffect(() => {
    const onPop = () => setScreen(screenFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const go = useCallback((s: Screen, replace = false) => {
    const url = ROUTES[s];
    if (window.location.pathname !== url) {
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    }
    setScreen(s);
  }, []);

  // Sem sessão carregada, a tela mostrada é a entrada da área, e a URL acompanha.
  const screen = needsSession(requested) && !session ? entryFor(requested) : requested;
  useEffect(() => {
    if (screen !== requested) window.history.replaceState(null, "", ROUTES[screen]);
  }, [screen, requested]);

  const handleChoosePath = (p: Path) => {
    setPath(p);
    if (session) {
      postJson("/api/participations", { sessionId: session.id, path: p }).catch(() => undefined);
    }
    go("student-focus");
  };

  const handleFocusContinue = (active: boolean, secs: number) => {
    setFocusActive(active); setFocusSecs(secs); go("student-chat");
  };

  return (
    <div className="relative">
      {screen === "intro"              && <Intro onEnter={() => go("teacher-activate")} onStudent={() => go("student-join")} onPrivacy={() => go("privacy")} />}
      {screen === "privacy"            && <PrivacyPage onBack={() => go("intro")} />}
      {screen === "student-join"       && <StudentJoin onBack={() => go("intro")} onJoined={(s) => { setSession(s); go("student-checkin"); }} />}
      {screen === "student-checkin"    && <StudentCheckin sessionId={session?.id ?? ""} onBack={() => go("student-join")} onDone={(m) => { setMission(m); go("student-paths"); }} />}
      {screen === "teacher-activate"   && <TeacherActivate onActivate={(s) => { setSession(s); go("teacher-activated"); }} onBack={() => go("intro")} />}
      {screen === "teacher-activated"  && <TeacherActivated session={session} onBack={() => go("teacher-activate")} onViewDashboard={() => go("teacher-dashboard")} />}
      {screen === "student-paths"      && <StudentPaths objective={session?.objective ?? "Objetivo ainda não definido"} onBack={() => go("student-checkin")} onChoose={handleChoosePath} />}
      {screen === "student-focus"      && <StudentFocus onBack={() => go("student-paths")} onContinue={handleFocusContinue} />}
      {screen === "student-chat"       && <StudentChat sessionId={session?.id ?? "sem-sessao"} mission={mission} path={path} focusActive={focusActive} focusSecs={focusSecs} onBack={() => go("student-focus")} onFinish={() => go("student-reflection")} />}
      {/* Ao terminar, o aluno volta à entrada: o painel é só do professor. */}
      {screen === "student-reflection" && <StudentReflection onSend={() => { saveState(null); setSession(null); go("intro"); }} />}
      {screen === "teacher-dashboard"  && <TeacherDashboard session={session} onBack={() => go("teacher-activated")} onErased={() => { saveState(null); setSession(null); go("intro"); }} />}
    </div>
  );
}
