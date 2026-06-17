// src/app/(dashboard)/metas/types.ts

export type GoalStatus = "ACTIVE" | "COMPLETED" | "PAUSED";
export type GoalPriority = "HIGH" | "MEDIUM" | "LOW";
export type GoalCategory =
  | "CASA"
  | "CARRO"
  | "VIAGEM"
  | "RESERVA"
  | "EDUCACAO"
  | "NEGOCIO"
  | "OUTROS";

export interface Goal {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  category: GoalCategory;
  priority: GoalPriority;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null;
  predictedDate?: string | null;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  contributions?: GoalContribution[];
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  note?: string | null;
  createdAt: string;
}

export interface GoalFormData {
  name: string;
  description?: string;
  category: GoalCategory;
  priority: GoalPriority;
  targetAmount: string;
  currentAmount: string;
  targetDate?: string;
}

export interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalSaved: number;
  totalTarget: number;
  overallProgress: number;
  nearestGoal: Goal | null;
}

export const CATEGORY_CONFIG: Record<
  GoalCategory,
  { label: string; emoji: string; color: string }
> = {
  CASA: { label: "Casa", emoji: "🏠", color: "#f97316" },
  CARRO: { label: "Carro", emoji: "🚗", color: "#3b82f6" },
  VIAGEM: { label: "Viagem", emoji: "✈️", color: "#06b6d4" },
  RESERVA: { label: "Reserva", emoji: "🛡️", color: "#22c55e" },
  EDUCACAO: { label: "Educação", emoji: "📚", color: "#a855f7" },
  NEGOCIO: { label: "Negócio", emoji: "💼", color: "#eab308" },
  OUTROS: { label: "Outros", emoji: "🎯", color: "#ec4899" },
};

export const PRIORITY_CONFIG: Record<
  GoalPriority,
  { label: string; color: string; bg: string }
> = {
  HIGH: { label: "Alta", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  MEDIUM: { label: "Média", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  LOW: { label: "Baixa", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
};