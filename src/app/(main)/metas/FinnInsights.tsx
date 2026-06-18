"use client";
// src/app/(dashboard)/metas/FinnInsights.tsx

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X } from "lucide-react";
import type { Goal, GoalStats } from "./types";

interface Props {
  goals: Goal[];
  stats: GoalStats;
}

interface Insight {
  id: string;
  message: string;
  type: "positive" | "warning" | "info";
}

function generateInsights(goals: Goal[], stats: GoalStats): Insight[] {
  const insights: Insight[] = [];
  const active = goals.filter((g) => g.status === "ACTIVE");

  // Progresso geral
  if (stats.overallProgress >= 75) {
    insights.push({
      id: "progress-high",
      message: `Incrível! Você já alcançou ${stats.overallProgress.toFixed(0)}% do total das suas metas. Continue nesse ritmo! 🚀`,
      type: "positive",
    });
  } else if (stats.overallProgress >= 40) {
    insights.push({
      id: "progress-mid",
      message: `Você está economizando acima da média. ${stats.overallProgress.toFixed(0)}% do total das suas metas já foi conquistado.`,
      type: "positive",
    });
  }

  // Meta mais próxima
  if (stats.nearestGoal) {
    const g   = stats.nearestGoal;
    const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
    if (pct >= 80) {
      insights.push({
        id: "nearest-close",
        message: `Sua meta "${g.name}" está quase lá! Apenas ${(100 - pct).toFixed(0)}% para concluir. Você pode!`,
        type: "positive",
      });
    } else if (pct >= 50) {
      insights.push({
        id: "nearest-half",
        message: `"${g.name}" ultrapassou a metade! Se continuar nesse ritmo, pode atingir antes do prazo.`,
        type: "info",
      });
    }
  }

  // Metas com prazo vencido
  const overdueGoals = active.filter((g) => {
    if (!g.targetDate) return false;
    return new Date(g.targetDate) < new Date() && g.currentAmount < g.targetAmount;
  });
  if (overdueGoals.length > 0) {
    insights.push({
      id: "overdue",
      message: `Você tem ${overdueGoals.length} meta${overdueGoals.length > 1 ? "s" : ""} com prazo vencido. Considere revisar as datas ou aumentar os aportes.`,
      type: "warning",
    });
  }

  // Metas sem aporte recente
  const goalsWithoutRecent = active.filter((g) => {
    const contribs = g.contributions ?? [];
    if (contribs.length === 0) return true;
    const lastDate    = new Date(contribs[0].createdAt);
    const daysSinceLast = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLast > 30;
  });
  if (goalsWithoutRecent.length > 0) {
    insights.push({
      id: "no-recent",
      message: `Sua meta "${goalsWithoutRecent[0].name}" não recebe aportes há mais de 30 dias. Que tal retomar?`,
      type: "warning",
    });
  }

  // Sem reserva de emergência
  const hasReserva = goals.some((g) => g.category === "RESERVA");
  if (!hasReserva) {
    insights.push({
      id: "no-reserva",
      message: "Você ainda não tem uma Reserva de Emergência. Especialistas recomendam 6 meses de despesas guardadas.",
      type: "warning",
    });
  }

  // Metas concluídas
  if (stats.completedGoals > 0) {
    insights.push({
      id: "completed",
      message: `Você já concluiu ${stats.completedGoals} meta${stats.completedGoals > 1 ? "s" : ""}. Cada conquista te aproxima da liberdade financeira! 🏆`,
      type: "positive",
    });
  }

  // Embaralha para variar a ordem a cada render
  return shuffle(insights).slice(0, 3);
}

// Fisher-Yates shuffle estável para arrays pequenos
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TYPE_STYLES = {
  positive: {
    bg:     "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
    dot:    "#22c55e",
  },
  warning: {
    bg:     "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    dot:    "#f59e0b",
  },
  info: {
    bg:     "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
    dot:    "#3b82f6",
  },
};

export function FinnInsights({ goals, stats }: Props) {
  const allInsights = useMemo(
    () => generateInsights(goals, stats),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goals.length, stats.overallProgress, stats.completedGoals]
  );

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleInsights = allInsights.filter((i) => !dismissed.has(i.id));

  function dismiss(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  if (visibleInsights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(168,85,247,0.06)",
        border: "1px solid rgba(168,85,247,0.15)",
      }}
    >
      {/* Header Finn */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(168,85,247,0.1)" }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, #a855f7, #7c3aed)",
            boxShadow: "0 0 20px rgba(168,85,247,0.4)",
          }}
        >
          <Bot size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#a855f7]">Finn IA</p>
          <p className="text-xs text-white/40">Análise das suas metas</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="text-xs text-[#22c55e]">online</span>
        </div>
      </div>

      {/* Insights */}
      <div className="p-4 space-y-2.5">
        <AnimatePresence initial={false}>
          {visibleInsights.map((insight, i) => {
            const style = TYPE_STYLES[insight.type];
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                transition={{ delay: i * 0.06, duration: 0.25 }}
                className="flex items-start gap-3 px-4 py-3 rounded-xl relative"
                style={{
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: style.dot }}
                />
                <p className="text-sm text-white/80 leading-relaxed flex-1 pr-4">
                  {insight.message}
                </p>
                <button
                  onClick={() => dismiss(insight.id)}
                  title="Dispensar"
                  className="absolute top-2.5 right-2.5 w-5 h-5 rounded-md flex items-center justify-center text-white/20 hover:text-white/60 transition-colors"
                >
                  <X size={11} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}