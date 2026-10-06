// Rotas por URL: cada área (professor e aluno) tem o seu próprio caminho, e o navegador navega com voltar e avançar.

export type Screen =
  | "intro"
  | "teacher-activate"
  | "teacher-activated"
  | "teacher-dashboard"
  | "student-join"
  | "student-checkin"
  | "student-paths"
  | "student-focus"
  | "student-chat"
  | "student-reflection"
  | "privacy";

export const ROUTES: Record<Screen, string> = {
  intro: "/",
  privacy: "/privacidade",
  "teacher-activate": "/professor",
  "teacher-activated": "/professor/sessao",
  "teacher-dashboard": "/professor/painel",
  "student-join": "/aluno",
  "student-checkin": "/aluno/checkin",
  "student-paths": "/aluno/trilhas",
  "student-focus": "/aluno/foco",
  "student-chat": "/aluno/chat",
  "student-reflection": "/aluno/reflexao",
};

// Telas que só fazem sentido com uma sessão carregada. Sem ela, voltam para a entrada da área.
const NEEDS_SESSION: ReadonlySet<Screen> = new Set<Screen>([
  "teacher-activated",
  "teacher-dashboard",
  "student-checkin",
  "student-paths",
  "student-focus",
  "student-chat",
  "student-reflection",
]);

export function needsSession(screen: Screen): boolean {
  return NEEDS_SESSION.has(screen);
}

export function entryFor(screen: Screen): Screen {
  return screen.startsWith("teacher") ? "teacher-activate" : screen.startsWith("student") ? "student-join" : "intro";
}

export function screenFromPath(pathname: string): Screen {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const match = (Object.keys(ROUTES) as Screen[]).find((s) => ROUTES[s] === normalized);
  return match ?? "intro";
}

// Lê o código da sessão do link do QR, por exemplo /aluno?codigo=SOC-1234.
export function codeFromSearch(search: string): string {
  return new URLSearchParams(search).get("codigo")?.trim().toUpperCase() ?? "";
}
