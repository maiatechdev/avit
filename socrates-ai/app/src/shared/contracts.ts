export type Session = { id: string; code: string; objective: string };

export type Path = "investigar" | "criar" | "resolver" | "colaborar" | null;
export interface Message { role: "ai" | "student"; text: string; }

export type DashboardData = {
  students: number;
  engagement: number;
  autonomy: number;
  competence: number;
  bond: number;
  pathCounts: Record<string, number>;
  stuckShare: number;
  suggestion: string;
};
