// ── Cartoon illustrations (estilo da logo: traço marinho forte, cores vivas) ──

const INK = "#142463";
const SKIN = "#F4B183";

export function CartoonFigure({ x, y, shirt = "#2F6BE8", hair = "#142463" }: { x: number; y: number; shirt?: string; hair?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round" strokeLinecap="round">
      <path d="M-17 46 Q-17 24 0 24 Q17 24 17 46 Z" fill={shirt} stroke={INK} strokeWidth="3" />
      <rect x="-5" y="15" width="10" height="11" rx="3" fill={SKIN} stroke={INK} strokeWidth="2.5" />
      <circle cx="0" cy="0" r="13" fill={SKIN} stroke={INK} strokeWidth="3" />
      <path d="M-13.5 -1 Q-15 -17 0 -16 Q15 -17 13.5 -1 Q8 -8 0 -8 Q-8 -8 -13.5 -1 Z" fill={hair} stroke={INK} strokeWidth="2.5" />
      <circle cx="-4.8" cy="2" r="1.9" fill={INK} />
      <circle cx="4.8" cy="2" r="1.9" fill={INK} />
      <path d="M-4 7 Q0 10.5 4 7" fill="none" stroke={INK} strokeWidth="2.2" />
    </g>
  );
}

export function SceneInvestigar() {
  return (
    <svg viewBox="0 0 120 90" className="w-full h-full">
      <rect width="120" height="90" fill="#FFF3C4" />
      <CartoonFigure x={38} y={44} />
      <circle cx="84" cy="40" r="15" fill="#D6ECFF" stroke={INK} strokeWidth="3" />
      <path d="M77 40h14M77 46h9" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M93 52 L106 66" stroke="#F5B82E" strokeWidth="6" strokeLinecap="round" />
      <path d="M93 52 L106 66" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SceneCriar() {
  return (
    <svg viewBox="0 0 120 90" className="w-full h-full">
      <rect width="120" height="90" fill="#FFE3DA" />
      <CartoonFigure x={36} y={44} shirt="#FF7A59" />
      <rect x="62" y="32" width="38" height="26" rx="8" fill="#2F6BE8" stroke={INK} strokeWidth="3" />
      <rect x="72" y="26" width="12" height="8" rx="3" fill="#2F6BE8" stroke={INK} strokeWidth="2.5" />
      <circle cx="81" cy="45" r="7" fill="#D6ECFF" stroke={INK} strokeWidth="2.5" />
      <path d="M100 18 L102 23 L107 25 L102 27 L100 32 L98 27 L93 25 L98 23 Z" fill="#F5B82E" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function SceneResolver() {
  return (
    <svg viewBox="0 0 120 90" className="w-full h-full">
      <rect width="120" height="90" fill="#DDF6EA" />
      <CartoonFigure x={36} y={44} shirt="#2FB67C" />
      <circle cx="84" cy="34" r="14" fill="#FFE58A" stroke={INK} strokeWidth="3" />
      <rect x="77" y="46" width="14" height="9" rx="3" fill="#6C8CFF" stroke={INK} strokeWidth="2.5" />
      <path d="M84 12 V7 M66 24 L62 20 M102 24 L106 20" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function SceneColaborar() {
  return (
    <svg viewBox="0 0 120 90" className="w-full h-full">
      <rect width="120" height="90" fill="#EDE7FF" />
      <CartoonFigure x={30} y={46} />
      <CartoonFigure x={90} y={46} shirt="#8E6CFF" />
      <rect x="46" y="8" width="28" height="18" rx="8" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
      <path d="M52 26 L56 26 L52 31 Z" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <text x="60" y="22" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="13" fill={INK}>?</text>
    </svg>
  );
}

export function SceneReflection() {
  return (
    <svg viewBox="0 0 320 90" className="w-full">
      <rect width="320" height="90" fill="#FFF1C7" />
      <CartoonFigure x={130} y={50} shirt="#FF7A59" />
      <rect x="186" y="6" width="90" height="42" rx="18" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
      <circle cx="200" cy="50" r="3.5" fill="#FFFFFF" stroke={INK} strokeWidth="2.2" />
      <circle cx="194" cy="56" r="2" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
      <path d="M205 27 L214 36 L232 17" fill="none" stroke="#2FB67C" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
