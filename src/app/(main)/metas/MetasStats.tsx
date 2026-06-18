"use client";
// src/app/(dashboard)/metas/MetasStats.tsx

import { motion } from "framer-motion";
import { Wallet, Target, TrendingUp, Trophy } from "lucide-react";
import type { GoalStats } from "./types";

interface Props {
  stats: GoalStats;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

export function MetasStats({ stats }: Props) {
  const nearest         = stats.nearestGoal;
  const nearestProgress = nearest
    ? Math.min((nearest.currentAmount / nearest.targetAmount) * 100, 100)
    : 0;
  const predictionDays  = nearest
    ? getDaysUntil(nearest.predictedDate ?? nearest.targetDate)
    : null;

  const totalProgress = stats.totalTarget > 0
    ? Math.min((stats.totalSaved / stats.totalTarget) * 100, 100)
    : 0;

  const cards = [
    {
      icon:    Wallet,
      label:   "Total economizado",
      value:   formatCurrency(stats.totalSaved),
      sub:     `de ${formatCurrency(stats.totalTarget)}`,
      color:   "#a855f7",
      progress: totalProgress,
    },
    {
      icon:    Target,
      label:   "Metas ativas",
      value:   String(stats.activeGoals),
      sub:     `${stats.completedGoals} concluída${stats.completedGoals !== 1 ? "s" : ""}`,
      color:   "#3b82f6",
      progress: null,
    },
    {
      icon:    TrendingUp,
      label:   "Meta mais próxima",
      value:   nearest?.name ?? "—",
      sub:     nearest ? `${nearestProgress.toFixed(0)}% concluída` : "Nenhuma meta ativa",
      color:   "#22c55e",
      progress: nearest ? nearestProgress : null,
    },
    {
      icon:    Trophy,
      label:   "Próxima conquista",
      value:   predictionDays !== null ? `${predictionDays}d` : "—",
      sub:     predictionDays !== null ? "para a meta mais próxima" : "Sem previsão",
      color:   "#f59e0b",
      progress: null,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04 }}
            className="rounded-2xl p-4 relative overflow-hidden flex flex-col gap-3"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Glow decorativo */}
            <div
              className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${c.color}, transparent)`,
              }}
            />

            {/* Ícone */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `${c.color}1f`,
                border: `1px solid ${c.color}33`,
              }}
            >
              <Icon size={15} style={{ color: c.color }} />
            </div>

            {/* Conteúdo */}
            <div className="min-w-0">
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate"
                style={{ color: c.color }}
              >
                {c.label}
              </p>
              <p
                className="text-base font-bold text-white leading-tight truncate"
                title={c.value}
              >
                {c.value}
              </p>
              <p
                className="text-[10px] text-white/40 mt-0.5 truncate"
                title={c.sub}
              >
                {c.sub}
              </p>
            </div>

            {/* Barra de progresso (apenas quando relevante) */}
            {c.progress !== null && (
              <div className="mt-auto">
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + i * 0.04 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${c.color}, ${c.color}99)`,
                    }}
                  />
                </div>
                <p
                  className="text-[10px] font-semibold mt-1 text-right"
                  style={{ color: c.color }}
                >
                  {c.progress.toFixed(0)}%
                </p>
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}