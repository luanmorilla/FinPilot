"use client";
// src/app/(dashboard)/metas/MetasStats.tsx

import { motion } from "framer-motion";
import { Wallet, Target, TrendingUp, Trophy } from "lucide-react";
import type { GoalStats } from "./types";

interface Props {
  stats: GoalStats;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function getDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

export function MetasStats({ stats }: Props) {
  const nearest = stats.nearestGoal;
  const nearestProgress = nearest
    ? Math.min((nearest.currentAmount / nearest.targetAmount) * 100, 100)
    : 0;
  const predictionDays = nearest ? getDaysUntil(nearest.predictedDate ?? nearest.targetDate) : null;

  const cards = [
    {
      icon: Wallet,
      label: "Total economizado",
      value: formatCurrency(stats.totalSaved),
      sub: `de ${formatCurrency(stats.totalTarget)}`,
      color: "#a855f7",
    },
    {
      icon: Target,
      label: "Metas ativas",
      value: String(stats.activeGoals),
      sub: `${stats.completedGoals} concluída${stats.completedGoals !== 1 ? "s" : ""}`,
      color: "#3b82f6",
    },
    {
      icon: TrendingUp,
      label: "Meta mais próxima",
      value: nearest ? nearest.name : "—",
      sub: nearest ? `${nearestProgress.toFixed(0)}%` : "Nenhuma meta ativa",
      color: "#22c55e",
    },
    {
      icon: Trophy,
      label: "Próxima conquista",
      value: predictionDays !== null ? `${predictionDays} dias` : "—",
      sub: "Previsão estimada",
      color: "#f59e0b",
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
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-10 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${c.color}, transparent)` }}
            />
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${c.color}1f`, border: `1px solid ${c.color}33` }}
            >
              <Icon size={15} style={{ color: c.color }} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: c.color }}>
              {c.label}
            </p>
            <p className="text-base font-bold text-white leading-tight truncate">{c.value}</p>
            <p className="text-[10px] text-white/40 mt-0.5 truncate">{c.sub}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}