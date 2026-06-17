"use client";
// src/app/(dashboard)/metas/GoalCard.tsx

import { motion } from "framer-motion";
import { Plus, Eye, Clock, CheckCircle2, PauseCircle, Pencil } from "lucide-react";
import type { Goal } from "./types";
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from "./types";

interface Props {
  goal: Goal;
  index: number;
  onAddContribution: () => void;
  onViewDetail: () => void;
  onEdit: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function getDaysRemaining(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const STATUS_ICONS = {
  ACTIVE: null,
  COMPLETED: CheckCircle2,
  PAUSED: PauseCircle,
};

export function GoalCard({ goal, index, onAddContribution, onViewDetail, onEdit }: Props) {
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const category = CATEGORY_CONFIG[goal.category];
  const priority = PRIORITY_CONFIG[goal.priority];
  const daysRemaining = getDaysRemaining(goal.targetDate);
  const predictedDate = formatDate(goal.predictedDate);
  const StatusIcon = STATUS_ICONS[goal.status];
  const isCompleted = goal.status === "COMPLETED";

  const progressColor =
    progress >= 80
      ? "#22c55e"
      : progress >= 50
      ? "#a855f7"
      : progress >= 25
      ? "#3b82f6"
      : "#f59e0b";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className="relative rounded-2xl p-5 flex flex-col gap-4 overflow-hidden group"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Glow background based on category */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${category.color}10 0%, transparent 60%)`,
        }}
      />

      {/* Completed overlay */}
      {isCompleted && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.03)" }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${category.color}20`, border: `1px solid ${category.color}30` }}
          >
            {category.emoji}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm leading-tight truncate max-w-[160px]">
              {goal.name}
            </h3>
            <span
              className="text-xs font-medium"
              style={{ color: category.color }}
            >
              {category.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {StatusIcon && (
            <StatusIcon
              size={14}
              className={isCompleted ? "text-[#22c55e]" : "text-[#f59e0b]"}
            />
          )}
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ color: priority.color, background: priority.bg }}
          >
            {priority.label}
          </span>
        </div>
      </div>

      {/* Values */}
      <div>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs text-white/40 mb-0.5">Economizado</p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(goal.currentAmount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40 mb-0.5">Objetivo</p>
            <p className="text-sm font-semibold text-white/70">
              {formatCurrency(goal.targetAmount)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 + 0.2 }}
            className="h-full rounded-full"
            style={{
              background: isCompleted
                ? "linear-gradient(90deg, #22c55e, #4ade80)"
                : `linear-gradient(90deg, ${progressColor}, ${progressColor}cc)`,
              boxShadow: `0 0 8px ${progressColor}60`,
            }}
          />
        </div>

        <div className="flex justify-between mt-1.5">
          <span className="text-xs font-bold" style={{ color: progressColor }}>
            {progress.toFixed(0)}%
          </span>
          {daysRemaining !== null && !isCompleted && (
            <span
              className={`text-xs flex items-center gap-1 ${
                daysRemaining < 30 ? "text-red-400" : "text-white/40"
              }`}
            >
              <Clock size={10} />
              {daysRemaining > 0 ? `${daysRemaining}d restantes` : "Prazo vencido"}
            </span>
          )}
        </div>
      </div>

      {/* Predicted Date */}
      {predictedDate && !isCompleted && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
          style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}
        >
          <span className="text-white/50">Previsão:</span>
          <span className="text-[#a855f7] font-semibold">{predictedDate}</span>
        </div>
      )}

      {isCompleted && (
        <div
          className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-[#22c55e]"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <CheckCircle2 size={14} />
          Meta concluída! 🎉
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {!isCompleted && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onAddContribution}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              boxShadow: "0 4px 16px rgba(168,85,247,0.3)",
            }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Aportar
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onViewDetail}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-all"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Eye size={13} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onEdit}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-all"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Pencil size={13} />
        </motion.button>
      </div>
    </motion.div>
  );
}