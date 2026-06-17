"use client";
// src/app/(dashboard)/metas/GoalDetailModal.tsx

import { motion } from "framer-motion";
import { X, Plus, Clock, Calendar, History, TrendingUp } from "lucide-react";
import type { Goal } from "./types";
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from "./types";

interface Props {
  goal: Goal;
  onClose: () => void;
  onAddContribution: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateLong(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function GoalDetailModal({ goal, onClose, onAddContribution }: Props) {
  const category = CATEGORY_CONFIG[goal.category];
  const priority = PRIORITY_CONFIG[goal.priority];
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const isCompleted = goal.status === "COMPLETED";

  const history = [...(goal.contributions ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  let monthlyNeeded: number | null = null;
  if (goal.targetDate && remaining > 0) {
    const months =
      (new Date(goal.targetDate).getFullYear() - new Date().getFullYear()) * 12 +
      (new Date(goal.targetDate).getMonth() - new Date().getMonth());
    if (months > 0) monthlyNeeded = remaining / months;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: "#13131a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "92vh" }}
      >
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${category.color}20`, border: `1px solid ${category.color}30` }}>
              {category.emoji}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{goal.name}</p>
              <span className="text-xs" style={{ color: category.color }}>{category.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="p-4 rounded-2xl space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Progresso</span>
              <span className="font-bold" style={{ color: isCompleted ? "#22c55e" : "#a855f7" }}>{progress.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: isCompleted ? "linear-gradient(90deg,#22c55e,#4ade80)" : "linear-gradient(90deg,#a855f7,#7c3aed)" }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/60">{formatCurrency(goal.currentAmount)}</span>
              <span className="text-white/40">{formatCurrency(goal.targetAmount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-1.5 text-white/40 mb-1">
                <Clock size={11} />
                <span className="text-[10px] uppercase tracking-wide font-semibold">Prazo</span>
              </div>
              <p className="text-sm font-semibold text-white">{formatDateLong(goal.targetDate) ?? "Sem prazo"}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <div className="flex items-center gap-1.5 text-[#a855f7] mb-1">
                <TrendingUp size={11} />
                <span className="text-[10px] uppercase tracking-wide font-semibold">Previsão</span>
              </div>
              <p className="text-sm font-semibold text-white">{formatDateLong(goal.predictedDate) ?? "Calculando..."}</p>
            </div>
          </div>

          {monthlyNeeded !== null && !isCompleted && (
            <div className="p-4 rounded-2xl" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
              <p className="text-xs text-white/50 mb-1">Para cumprir o prazo, guarde:</p>
              <p className="text-xl font-bold text-[#a855f7]">
                {formatCurrency(monthlyNeeded)}<span className="text-white/40 text-sm font-normal"> /mês</span>
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Prioridade:</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: priority.color, background: priority.bg }}>
              {priority.label}
            </span>
          </div>

          {goal.description && <p className="text-sm text-white/60 leading-relaxed">{goal.description}</p>}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <History size={14} className="text-white/40" />
              <p className="text-sm font-semibold text-white">Histórico de aportes</p>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-white/40 py-6 text-center rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                Nenhum aporte registrado ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <p className="text-sm font-bold text-[#22c55e]">+ {formatCurrency(c.amount)}</p>
                      {c.note && <p className="text-xs text-white/40 mt-0.5">{c.note}</p>}
                    </div>
                    <span className="text-xs text-white/40 flex items-center gap-1">
                      <Calendar size={10} />
                      {formatDateShort(c.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {!isCompleted && (
          <div className="shrink-0 px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onAddContribution}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 6px 24px rgba(168,85,247,0.35)" }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Adicionar Aporte
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}