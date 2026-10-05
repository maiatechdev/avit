/** Balão de pergunta da logo: a voz do tutor socrático */
export function QuestionBubble({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, display: "block", flexShrink: 0 }}>
      <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
      <path d="M9.6 9.2a2.4 2.4 0 1 1 3.4 2.2c-.7.3-1 .8-1 1.5" />
      <circle cx="12" cy="14.6" r="0.6" fill={color} stroke="none" />
    </svg>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="tap-scale shrink-0"
      style={{ width: 56, height: 32, borderRadius: 999, background: on ? "var(--ai)" : "var(--border)", border: "none", cursor: "pointer", transition: "background 0.25s", position: "relative" }}>
      <span style={{ position: "absolute", top: 4, left: on ? 28 : 4, width: 24, height: 24, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.22s cubic-bezier(.4,0,.2,1)", display: "block" }} />
    </button>
  );
}

// ── Confetti (only used on challenge completion) ──────────────────────────────

export function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const palette = ["#2F6BE8", "#F5B82E", "#FF7A59", "#2FB67C", "#8E6CFF", "#6C8CFF"];
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
