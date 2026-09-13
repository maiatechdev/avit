import { useState, useRef, useEffect, useCallback } from "react";
import logoAvit from "@/imports/logoAvit.svg";

type Screen =
  | "intro"
  | "teacher-activate"
  | "teacher-activated"
  | "student-paths"
  | "student-focus"
  | "student-chat"
  | "student-reflection"
  | "teacher-dashboard";

type Path = "investigar" | "criar" | "resolver" | "colaborar" | null;
interface Message { role: "ai" | "student"; text: string; }

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ── Design primitives ─────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-start justify-center" style={{ background: "var(--background)" }}>
      <div
        className="relative w-full flex flex-col"
        style={{ maxWidth: 430, minHeight: "100svh", background: "var(--background)", boxShadow: "0 0 60px rgba(0,0,0,0.08)" }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Screen 0: Intro / Splash ──────────────────────────────────────────────────

// Servido direto do GitHub (media LFS endpoint) — o Vercel não baixa objetos
// Git LFS durante o build, então o caminho local /assets/... serviria só o
// ponteiro do LFS, não o vídeo de verdade.
const DEMO_VIDEO_URL = "https://media.githubusercontent.com/media/maiatechdev/avit/main/public/assets/video-demo.mp4";

function Intro() {
  return (
    <div
      className="min-h-screen flex items-start justify-center"
      style={{ background: "var(--primary)" }}
    >
      <div
        className="relative w-full flex flex-col min-h-[100svh] items-center"
        style={{ maxWidth: 430 }}
      >
        {/* Logo + slogan */}
        <div className="flex flex-col items-center px-8 gap-4 pt-10 pb-2">
          <img
            src={logoAvit}
            alt="AVIT"
            className="w-full object-contain"
            style={{ maxWidth: 180 }}
          />

          {/* Slogan */}
          <p
            className="text-center font-extrabold uppercase leading-snug"
            style={{
              color: "white",
              fontFamily: "Nunito, sans-serif",
              fontSize: "clamp(14px, 3.8vw, 17px)",
              letterSpacing: "0.04em",
              textShadow: "0 1px 4px rgba(0,0,0,0.12)",
            }}
          >
            Transformando o smartphone em uma ferramenta de aprendizagem.
          </p>
        </div>

        {/* Vídeo embutido */}
        <div className="flex-1 w-full flex items-center justify-center px-6 py-4">
          <video
            controls
            playsInline
            preload="metadata"
            className="w-full rounded-2xl"
            style={{ maxHeight: "52vh", background: "#000", boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
            src={DEMO_VIDEO_URL}
          />
        </div>

        {/* Rodapé legal */}
        <div className="w-full px-6 pb-10 pt-2 flex flex-col gap-2">
          <p
            className="text-center text-xs"
            style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Outfit, sans-serif" }}
          >
            Uso pedagógico mediado — Lei 15.100/2025
          </p>
        </div>
      </div>
    </div>
  );
}

/** Geometric 4-pointed spark — no face, no expression */
function Spark({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 20 20" style={{ width: size, height: size, display: "block", flexShrink: 0 }}>
      <path d="M10 1 L11.9 8.1 L19 10 L11.9 11.9 L10 19 L8.1 11.9 L1 10 L8.1 8.1 Z" fill={color} />
    </svg>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="tap-scale shrink-0"
      style={{ width: 56, height: 32, borderRadius: 999, background: on ? "var(--ai)" : "var(--border)", border: "none", cursor: "pointer", transition: "background 0.25s", position: "relative" }}>
      <span style={{ position: "absolute", top: 4, left: on ? 28 : 4, width: 24, height: 24, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.22s cubic-bezier(.4,0,.2,1)", display: "block" }} />
    </button>
  );
}

// ── Confetti (only used on challenge completion) ──────────────────────────────

function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const palette = ["#D96B38", "#3EA89A", "#F59E0B", "#8B5CF6", "#4BAA6E", "#E8693A"];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 300, overflow: "hidden" }}>
      {Array.from({ length: 28 }).map((_, i) => {
        const x = 5 + (i / 28) * 90;
        const color = palette[i % palette.length];
        const size = 7 + (i % 4) * 2;
        const delay = (i % 7) * 0.045;
        const dur = 0.8 + (i % 5) * 0.1;
        const shape = i % 3;
        return (
          <div key={i} style={{
            position: "absolute", bottom: "25%", left: `${x}%`,
            width: size, height: shape === 1 ? size * 0.55 : size,
            borderRadius: shape === 0 ? "50%" : shape === 1 ? "2px" : "3px",
            background: color,
            transform: shape === 2 ? "rotate(45deg)" : "none",
            animation: `confettiBurst ${dur}s ${delay}s ease-out forwards`,
            opacity: 0,
          }} />
        );
      })}
    </div>
  );
}

// ── Flat illustrated scenes for path cards ────────────────────────────────────

function SceneInvestigar() {
  return (
    <svg viewBox="0 0 100 70" fill="none" className="w-full h-full">
      <ellipse cx="50" cy="35" rx="48" ry="33" fill="#FEF3C7" />
      {/* Person silhouette */}
      <circle cx="17" cy="20" r="8" fill="#D96B38" />
      <rect x="11" y="29" width="12" height="22" rx="5" fill="#D96B38" opacity="0.85" />
      {/* Arm reaching to phone */}
      <rect x="22" y="34" width="12" height="3.5" rx="1.8" fill="#D96B38" opacity="0.7" />
      {/* Phone */}
      <rect x="33" y="12" width="22" height="38" rx="4" fill="#F59E0B" />
      <rect x="36" y="16" width="16" height="26" rx="2" fill="white" opacity="0.95" />
      <rect x="38" y="20" width="12" height="2" rx="1" fill="#F59E0B" opacity="0.7" />
      <rect x="38" y="25" width="9" height="2" rx="1" fill="#F59E0B" opacity="0.45" />
      <rect x="38" y="30" width="11" height="2" rx="1" fill="#F59E0B" opacity="0.3" />
      {/* Magnifying glass */}
      <circle cx="71" cy="38" r="11" fill="white" opacity="0.65" />
      <circle cx="71" cy="38" r="8" fill="none" stroke="#D96B38" strokeWidth="2.5" />
      <line x1="77" y1="44" x2="83" y2="50" stroke="#D96B38" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="68" cy="35" r="2.5" fill="#D96B38" opacity="0.2" />
    </svg>
  );
}

function SceneCriar() {
  return (
    <svg viewBox="0 0 100 70" fill="none" className="w-full h-full">
      <ellipse cx="50" cy="35" rx="48" ry="33" fill="#FECACA" opacity="0.55" />
      {/* Camera body */}
      <rect x="14" y="22" width="52" height="30" rx="6" fill="#D96B38" />
      <rect x="18" y="26" width="44" height="22" rx="4" fill="white" opacity="0.15" />
      {/* Lens */}
      <circle cx="38" cy="37" r="10" fill="white" opacity="0.9" />
      <circle cx="38" cy="37" r="7" fill="#D96B38" opacity="0.25" />
      <circle cx="38" cy="37" r="4" fill="#D96B38" />
      {/* Viewfinder bump */}
      <rect x="56" y="18" width="6" height="6" rx="2" fill="#D96B38" opacity="0.8" />
      {/* Rec button */}
      <circle cx="62" cy="37" r="4" fill="white" opacity="0.85" />
      <circle cx="62" cy="37" r="2.5" fill="#D96B38" />
      {/* Person holding — partial silhouette right side */}
      <circle cx="85" cy="24" r="8" fill="#F59E0B" />
      <rect x="79" y="33" width="12" height="22" rx="5" fill="#F59E0B" opacity="0.85" />
      {/* Arm holding camera */}
      <rect x="67" y="34" width="14" height="4" rx="2" fill="#F59E0B" opacity="0.7" />
      {/* Record dot indicator */}
      <circle cx="22" cy="15" r="4" fill="#D96B38" />
      <circle cx="22" cy="15" r="2" fill="white" opacity="0.6" />
    </svg>
  );
}

function SceneResolver() {
  return (
    <svg viewBox="0 0 100 70" fill="none" className="w-full h-full">
      <ellipse cx="50" cy="35" rx="48" ry="33" fill="#CCFBF1" opacity="0.6" />
      {/* Person thinking */}
      <circle cx="20" cy="22" r="8" fill="#D96B38" />
      <rect x="14" y="31" width="12" height="22" rx="5" fill="#D96B38" opacity="0.85" />
      {/* Thought dots */}
      <circle cx="31" cy="19" r="2" fill="#3EA89A" opacity="0.7" />
      <circle cx="38" cy="15" r="2.8" fill="#3EA89A" opacity="0.55" />
      <circle cx="46" cy="12" r="3.5" fill="#3EA89A" opacity="0.4" />
      {/* Lightbulb */}
      <circle cx="66" cy="30" r="16" fill="#3EA89A" opacity="0.18" />
      <circle cx="66" cy="30" r="12" fill="#3EA89A" opacity="0.75" />
      <circle cx="66" cy="30" r="7" fill="white" opacity="0.35" />
      {/* Bulb base */}
      <rect x="61" y="42" width="10" height="5" rx="2" fill="#2A6B62" />
      <rect x="63" y="47" width="6" height="3" rx="1.5" fill="#2A6B62" opacity="0.7" />
      {/* Glow rays */}
      <line x1="66" y1="13" x2="66" y2="9" stroke="#3EA89A" strokeWidth="2" strokeLinecap="round" />
      <line x1="78" y1="18" x2="81" y2="15" stroke="#3EA89A" strokeWidth="2" strokeLinecap="round" />
      <line x1="83" y1="30" x2="87" y2="30" stroke="#3EA89A" strokeWidth="2" strokeLinecap="round" />
      <line x1="78" y1="42" x2="81" y2="45" stroke="#3EA89A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SceneColaborar() {
  return (
    <svg viewBox="0 0 100 70" fill="none" className="w-full h-full">
      <ellipse cx="50" cy="35" rx="48" ry="33" fill="#EDE9FE" opacity="0.8" />
      {/* Person 1 (left, violet) */}
      <circle cx="16" cy="20" r="8" fill="#8B5CF6" />
      <rect x="10" y="29" width="12" height="22" rx="5" fill="#8B5CF6" opacity="0.85" />
      <rect x="22" y="33" width="14" height="4" rx="2" fill="#8B5CF6" opacity="0.6" />
      {/* Person 2 (right, terracota) */}
      <circle cx="84" cy="20" r="8" fill="#D96B38" />
      <rect x="78" y="29" width="12" height="22" rx="5" fill="#D96B38" opacity="0.85" />
      <rect x="64" y="33" width="14" height="4" rx="2" fill="#D96B38" opacity="0.6" />
      {/* Shared document/card in center */}
      <rect x="34" y="14" width="32" height="40" rx="5" fill="white" />
      <rect x="34" y="14" width="32" height="40" rx="5" fill="none" stroke="#E8DDD0" strokeWidth="1.5" />
      <rect x="39" y="22" width="22" height="2.5" rx="1.25" fill="#8B5CF6" opacity="0.5" />
      <rect x="39" y="29" width="16" height="2.5" rx="1.25" fill="#D96B38" opacity="0.5" />
      <rect x="39" y="36" width="19" height="2.5" rx="1.25" fill="#3EA89A" opacity="0.5" />
      <rect x="39" y="43" width="14" height="2.5" rx="1.25" fill="#8B5CF6" opacity="0.3" />
    </svg>
  );
}

// ── Illustration: reflection banner ───────────────────────────────────────────

function SceneReflection() {
  return (
    <svg viewBox="0 0 320 90" fill="none" className="w-full">
      <rect width="320" height="90" fill="#EEF6F4" />
      {/* Decorative arcs */}
      <ellipse cx="0" cy="90" rx="80" ry="60" fill="#3EA89A" opacity="0.08" />
      <ellipse cx="320" cy="0" rx="80" ry="60" fill="#D96B38" opacity="0.07" />
      {/* Sitting person */}
      <circle cx="160" cy="30" r="14" fill="#D96B38" />
      <rect x="148" y="44" width="24" height="28" rx="9" fill="#D96B38" opacity="0.85" />
      {/* Phone in hand */}
      <rect x="172" y="50" width="14" height="24" rx="3" fill="#3EA89A" />
      <rect x="174" y="53" width="10" height="16" rx="2" fill="white" opacity="0.85" />
      {/* Arm */}
      <rect x="168" y="54" width="7" height="3.5" rx="1.8" fill="#D96B38" opacity="0.7" />
      {/* Sparkles around */}
      <circle cx="120" cy="25" r="3" fill="#F59E0B" opacity="0.7" />
      <circle cx="200" cy="20" r="2" fill="#8B5CF6" opacity="0.6" />
      <circle cx="210" cy="55" r="2.5" fill="#3EA89A" opacity="0.5" />
      <circle cx="110" cy="55" r="2" fill="#D96B38" opacity="0.5" />
      {/* Heart / feeling indicator */}
      <path d="M135 35 C135 32 139 30 141 33 C143 30 147 32 147 35 C147 38 141 43 141 43 C141 43 135 38 135 35 Z" fill="#D96B38" opacity="0.6" />
    </svg>
  );
}

// ── Screen 1: Teacher Activate ────────────────────────────────────────────────

function TeacherActivate({ onActivate }: { onActivate: () => void }) {
  const [objective, setObjective] = useState("");
  return (
    <Shell>
      <div className="screen-enter flex flex-col min-h-[100svh] px-6 pt-6 pb-8">
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
                boxShadow: objective ? "0 0 0 3px rgba(217,107,56,0.1)" : "none",
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
            onClick={onActivate}
            disabled={!objective.trim()}
            className="btn-bounce w-full py-4 text-base font-bold rounded-2xl"
            style={{
              background: objective.trim() ? "var(--primary)" : "var(--muted)",
              color: objective.trim() ? "var(--primary-foreground)" : "var(--muted-foreground)",
              letterSpacing: "0.01em",
            }}
          >
            Ativar sessão pra turma
          </button>
        </div>
      </div>
    </Shell>
  );
}

// ── Screen 2: Teacher Activated (QR) ─────────────────────────────────────────

function TeacherActivated({ onViewDashboard }: { onViewDashboard: () => void }) {
  return (
    <Shell>
      <div className="screen-enter flex flex-col min-h-[100svh] px-6 pt-6 pb-24">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 block" />
          <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Sessão ativa — Lei 15.100/2025</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: "#EEF8F0" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#3D9A5C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
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
            <div style={{ width: 192, height: 192, borderRadius: 16, display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gridTemplateRows: "repeat(10, 1fr)", gap: 2, padding: 8, background: "#FAFAFA" }}>
              {Array.from({ length: 100 }).map((_, i) => {
                const corners = [0,1,2,3,10,11,12,20,21,22,7,8,9,17,18,19,27,28,29,70,71,72,80,81,82,90,91,92,77,78,79,87,88,89,97,98,99];
                const fill = corners.includes(i) || Math.random() > 0.55;
                return <div key={i} className="rounded-sm" style={{ background: fill ? "#2A1F10" : "transparent" }} />;
              })}
            </div>
            <div className="px-6 py-3 rounded-2xl text-center" style={{ background: "var(--muted)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Código da sessão</p>
              <p className="text-3xl font-bold tracking-[0.15em]" style={{ color: "var(--primary)" }}>AC-4782</p>
            </div>
          </div>

          <div className="w-full rounded-2xl p-4 flex items-center gap-3" style={{ background: "var(--secondary)", border: "1px solid rgba(58,168,154,0.2)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5" />
            </svg>
            <p className="text-sm" style={{ color: "var(--secondary-foreground)" }}>
              Objetivo: <strong>Compreender mudanças climáticas</strong>
            </p>
          </div>
        </div>

        <button onClick={onViewDashboard} className="btn-bounce w-full py-4 text-base font-bold rounded-2xl mt-6"
          style={{ background: "var(--muted)", color: "var(--foreground)" }}>
          Ver painel da turma
        </button>
      </div>
    </Shell>
  );
}

// ── Screen 3: Student Path Choice ────────────────────────────────────────────

const PATHS = [
  { id: "investigar", Scene: SceneInvestigar, title: "Investigar", desc: "Pesquisar e comparar fontes", activeBorder: "#F59E0B", activeBg: "#FFFBEB" },
  { id: "criar",      Scene: SceneCriar,      title: "Criar",      desc: "Produzir um vídeo curto",   activeBorder: "#D96B38", activeBg: "#FFF7F5" },
  { id: "resolver",   Scene: SceneResolver,   title: "Resolver",   desc: "Solucionar um problema real", activeBorder: "#3EA89A", activeBg: "#F0FDFB" },
  { id: "colaborar",  Scene: SceneColaborar,  title: "Colaborar",  desc: "Desenvolver solução em grupo", activeBorder: "#8B5CF6", activeBg: "#F5F3FF" },
];

function StudentPaths({ onChoose }: { onChoose: (path: Path) => void }) {
  const [selected, setSelected] = useState<Path>(null);

  return (
    <Shell>
      <div className="screen-enter flex flex-col min-h-[100svh] px-5 pt-6 pb-24">
        {/* Objective banner */}
        <div className="rounded-2xl px-4 py-3 mb-5 flex items-start gap-3" style={{ background: "var(--muted)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mt-0.5 shrink-0">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--primary)" }}>OBJETIVO DE HOJE</p>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Compreender mudanças climáticas</p>
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

        {/* 2×2 illustrated cards */}
        <div className="grid grid-cols-2 gap-3 flex-1">
          {PATHS.map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id as Path)}
                className="tap-scale flex flex-col rounded-2xl overflow-hidden text-left border-2 transition-colors"
                style={{
                  background: active ? p.activeBg : "var(--card)",
                  borderColor: active ? p.activeBorder : "transparent",
                  boxShadow: active ? "none" : "0 1px 5px rgba(0,0,0,0.07)",
                }}
              >
                {/* Illustration area */}
                <div className="w-full h-[76px] overflow-hidden">
                  <p.Scene />
                </div>
                {/* Text */}
                <div className="px-3 pt-2 pb-3">
                  <p className="text-sm font-bold mb-0.5" style={{ color: "var(--foreground)" }}>{p.title}</p>
                  <p className="text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>{p.desc}</p>
                </div>
              </button>
            );
          })}
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

function StudentFocus({ onContinue }: { onContinue: (active: boolean, secs: number) => void }) {
  const [enabled, setEnabled] = useState(false);
  const [selectedSecs, setSelectedSecs] = useState(1200);

  return (
    <Shell>
      <div className="screen-enter flex flex-col min-h-[100svh] px-5 pt-10 pb-24">
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
    </Shell>
  );
}

// ── Screen 5: Student Chat ────────────────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  { role: "ai", text: "Oi! Você escolheu investigar sobre mudanças climáticas. Antes de buscar fontes, me conta: o que você já sabe sobre o assunto? O que vem à sua mente quando ouve esse tema?" },
  { role: "student", text: "Sei que o planeta tá aquecendo por causa dos gases, tipo CO2 das fábricas e carros." },
  { role: "ai", text: "Boa! Você mencionou as fábricas e os carros. Mas pensa comigo: será que esses são os únicos setores responsáveis? O que acontece, por exemplo, com o que a gente come no dia a dia?" },
];

function StudentChat({ path, focusActive: initFocus, focusSecs: initSecs, onFinish }: { path: Path; focusActive: boolean; focusSecs: number; onFinish: () => void }) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState(2);
  const [showFinish, setShowFinish] = useState(false);
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
    if (!focusOn || secsLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setSecsLeft((s) => { if (s <= 1) { stopFocus(); return 0; } return s - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [focusOn, stopFocus]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Só libera "Concluí o desafio" quando o raciocínio atinge o nível 3 — não na primeira resposta da IA.
  useEffect(() => { if (level >= 3) setShowFinish(true); }, [level]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((p) => [...p, { role: "student", text: input.trim() }]);
    setInput("");
    setTimeout(() => {
      setMessages((p) => [...p, { role: "ai", text: "Interessante! Você está conectando ideias importantes. Agora, como você acha que a mudança nos hábitos alimentares poderia contribuir para reduzir as emissões? Consegue pensar em algum exemplo prático no seu dia a dia?" }]);
      if (level < 3) setLevel((l) => l + 1);
    }, 1200);
  };

  return (
    <Shell>
      <div className="screen-enter flex flex-col h-[100svh]">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex flex-col gap-3" style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
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
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 self-end" style={{ background: "var(--ai)" }}>
                  <Spark size={14} color="white" />
                </div>
              )}
              <div
                className="max-w-[78%] px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: m.role === "ai" ? "var(--card)" : "var(--primary)",
                  color: m.role === "ai" ? "var(--foreground)" : "white",
                  borderRadius: m.role === "ai" ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
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
        <div className="px-4 pt-3 pb-24 flex flex-col gap-2" style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}>
          {showFinish && (
            <button onClick={onFinish} className="btn-bounce w-full py-3 text-sm font-bold rounded-xl"
              style={{ background: "var(--secondary)", color: "var(--secondary-foreground)", border: "1.5px solid rgba(58,168,154,0.3)" }}>
              Concluí o desafio!
            </button>
          )}
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Escreva sua resposta…" rows={1}
              className="flex-1 resize-none text-sm outline-none py-3 px-4 rounded-xl"
              style={{ background: "var(--muted)", color: "var(--foreground)", fontFamily: "Outfit, sans-serif", maxHeight: 100, border: "1.5px solid transparent" }} />
            <button onClick={handleSend} disabled={!input.trim()}
              className="tap-scale w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: input.trim() ? "var(--primary)" : "var(--muted)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={input.trim() ? "white" : "var(--muted-foreground)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
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
    const next = new Set(prev); next.has(h) ? next.delete(h) : next.add(h); return next;
  });

  const handleSubmit = () => {
    if (feeling === null) return;
    setSubmitted(true);
    setTimeout(onSend, 1600);
  };

  return (
    <Shell>
      <Confetti active={submitted} />
      <div className="screen-enter flex flex-col min-h-[100svh] pb-24">
        {/* Illustration banner */}
        <div className="overflow-hidden" style={{ borderRadius: "0 0 24px 24px" }}>
          <SceneReflection />
        </div>

        <div className="px-5 pt-5 flex-1 flex flex-col">
          <h1 className="text-2xl font-extrabold mb-1">
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
                style={{ background: helped.has(h) ? "var(--accent)" : "var(--muted)", color: helped.has(h) ? "white" : "var(--foreground)" }}>
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

// ── Screen 7: Teacher Dashboard ───────────────────────────────────────────────

const METRICS = [
  { label: "Engajamento", value: "81%", sub: "participaram ativamente", color: "var(--primary)" },
  { label: "Autonomia",   value: "74%", sub: "escolheram caminhos diferentes", color: "var(--accent)" },
  { label: "Competência", value: "68%", sub: "avançaram de nível", color: "#A07CC5" },
  { label: "Vínculo",     value: "72%", sub: "participaram em atividade colaborativa", color: "#4BAA6E" },
];

function TeacherDashboard({ onBack }: { onBack: () => void }) {
  return (
    <Shell>
      <div className="screen-enter flex flex-col min-h-[100svh] px-5 pt-6 pb-24 overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted-foreground)" }}>PAINEL DO PROFESSOR</p>
            <h1 className="text-xl font-bold leading-tight">Mudanças climáticas</h1>
          </div>
          <div className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5" style={{ background: "#EEF8F0", color: "#3D9A5C" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" /> Sessão encerrada
          </div>
        </div>

        {/* Summary strip */}
        <div className="rounded-2xl p-4 mb-5 flex items-center justify-between" style={{ background: "var(--muted)" }}>
          {[{ v: "28", l: "alunos", c: "var(--primary)" }, { v: "24", l: "participaram", c: "var(--accent)" }, { v: "19", l: "concluíram", c: "#4BAA6E" }].map((s, i, arr) => (
            <div key={s.l} className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: s.c }}>{s.v}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{s.l}</p>
              </div>
              {i < arr.length - 1 && <div className="w-px h-10" style={{ background: "var(--border)" }} />}
            </div>
          ))}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {METRICS.map((m) => (
            <div key={m.label} className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "var(--card)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{m.label.toUpperCase()}</p>
              <p className="text-3xl font-bold" style={{ color: m.color }}>{m.value}</p>
              <div className="w-full h-1.5 rounded-full" style={{ background: "var(--muted)" }}>
                <div className="h-full rounded-full" style={{ width: m.value, background: m.color, opacity: 0.7 }} />
              </div>
              <p className="text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>{m.sub}</p>
            </div>
          ))}
        </div>

        {/* AI insight */}
        <div className="rounded-2xl p-5 flex gap-3 mb-6" style={{ background: "var(--secondary)", border: "1.5px solid rgba(58,168,154,0.2)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--ai)" }}>
            <Spark size={18} color="white" />
          </div>
          <div>
            <p className="text-xs font-bold mb-1.5" style={{ color: "var(--ai)" }}>INSIGHT DA IA</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--secondary-foreground)" }}>
              Alunos em atividades colaborativas concluíram mais — considere ampliar esse formato nas próximas atividades.
            </p>
          </div>
        </div>

        {/* Path distribution */}
        <div className="rounded-2xl p-4 mb-6" style={{ background: "var(--card)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <p className="text-xs font-bold mb-4" style={{ color: "var(--muted-foreground)" }}>DISTRIBUIÇÃO POR CAMINHO</p>
          {[
            { label: "Investigar", pct: 37, color: "#F59E0B" },
            { label: "Colaborar",  pct: 29, color: "#8B5CF6" },
            { label: "Resolver",   pct: 21, color: "var(--accent)" },
            { label: "Criar",      pct: 13, color: "#D96B38" },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-3 mb-3 last:mb-0">
              <p className="text-xs w-16 shrink-0" style={{ color: "var(--foreground)" }}>{r.label}</p>
              <div className="flex-1 h-2 rounded-full" style={{ background: "var(--muted)" }}>
                <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
              </div>
              <p className="text-xs w-8 text-right" style={{ color: "var(--muted-foreground)" }}>{r.pct}%</p>
            </div>
          ))}
        </div>

        <button onClick={onBack} className="btn-bounce w-full py-4 text-base font-bold rounded-2xl"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          Nova sessão
        </button>
      </div>
    </Shell>
  );
}

// ── Nav bar ───────────────────────────────────────────────────────────────────

const NAV_ITEMS: { screen: Screen; label: string }[] = [
  { screen: "teacher-activate", label: "Ativar" },
  { screen: "student-paths",    label: "Caminhos" },
  { screen: "student-focus",    label: "Foco" },
  { screen: "student-chat",     label: "IA Chat" },
  { screen: "student-reflection", label: "Reflexão" },
  { screen: "teacher-dashboard", label: "Painel" },
];

// ── App Root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [path, setPath] = useState<Path>(null);
  const [focusActive, setFocusActive] = useState(false);
  const [focusSecs, setFocusSecs] = useState(0);

  const go = (s: Screen) => setScreen(s);

  const handleChoosePath = (p: Path) => {
    setPath(p);
    go("student-focus");
  };

  const handleFocusContinue = (active: boolean, secs: number) => {
    setFocusActive(active); setFocusSecs(secs); go("student-chat");
  };

  const isActive = (s: Screen) =>
    screen === s || (screen === "teacher-activated" && s === "teacher-activate");

  return (
    <div className="relative">
      {screen === "intro"              && <Intro />}
      {screen === "teacher-activate"   && <TeacherActivate onActivate={() => go("teacher-activated")} />}
      {screen === "teacher-activated"  && <TeacherActivated onViewDashboard={() => go("teacher-dashboard")} />}
      {screen === "student-paths"      && <StudentPaths onChoose={handleChoosePath} />}
      {screen === "student-focus"      && <StudentFocus onContinue={handleFocusContinue} />}
      {screen === "student-chat"       && <StudentChat path={path} focusActive={focusActive} focusSecs={focusSecs} onFinish={() => go("student-reflection")} />}
      {screen === "student-reflection" && <StudentReflection onSend={() => go("teacher-dashboard")} />}
      {screen === "teacher-dashboard"  && <TeacherDashboard onBack={() => go("teacher-activate")} />}

      {/* Navigation tabs — hidden na tela de splash */}
      {screen !== "intro" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center" style={{ pointerEvents: "none" }}>
          <div className="flex items-center gap-0.5 px-2 py-2 mb-4 rounded-2xl"
            style={{ background: "rgba(42,31,16,0.92)", backdropFilter: "blur(12px)", pointerEvents: "auto", boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}>
            {NAV_ITEMS.map((item) => (
              <button key={item.screen} onClick={() => go(item.screen)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                style={{
                  background: isActive(item.screen) ? "var(--primary)" : "transparent",
                  color: isActive(item.screen) ? "white" : "rgba(255,255,255,0.5)",
                  fontFamily: "Nunito, sans-serif",
                }}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
