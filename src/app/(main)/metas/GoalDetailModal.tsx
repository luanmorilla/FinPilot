"use client";
// src/app/(dashboard)/metas/GoalDetailModal.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Clock, Calendar, History,
  TrendingUp, Trash2, Loader2, ChevronDown,
} from "lucide-react";
import type { Goal } from "./types";
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from "./types";

interface Props {
  goal: Goal;
  onClose: () => void;
  onAddContribution: () => void;
  onGoalUpdated?: () => void;
}

const PAGE_SIZE = 5;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateLong(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function GoalDetailModal({
  goal,
  onClose,
  onAddContribution,
  onGoalUpdated,
}: Props) {
  const category  = CATEGORY_CONFIG[goal.category];
  const priority  = PRIORITY_CONFIG[goal.priority];
  const progress  = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const isCompleted = goal.status === "COMPLETED";

  const [visibleCount, setVisibleCount]       = useState(PAGE_SIZE);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const [contributions, setContributions]     = useState(
    [...(goal.contributions ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  );

  const visibleHistory = contributions.slice(0, visibleCount);
  const hasMore        = contributions.length > visibleCount;

  let monthlyNeeded: number | null = null;
  if (goal.targetDate && remaining > 0) {
    const months =
      (new Date(goal.targetDate).getFullYear() - new Date().getFullYear()) * 12 +
      (new Date(goal.targetDate).getMonth() - new Date().getMonth());
    if (months > 0) monthlyNeeded = remaining / months;
  }

  async function handleDeleteContribution(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/metas/${goal.id}/aportes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir aporte");
      setContributions((prev) => prev.filter((c) => c.id !== id));
      onGoalUpdated?.();
    } catch {
      // silencioso — pode adicionar toast futuramente
    } finally {
      setDeletingId(null);
    }
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
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col"
        style={{
          background: "#13131a",
          border: "1px solid rgba(255,255,255,0.1)",
          maxHeight: "92dvh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{
                background: `${category.color}20`,
                border: `1px solid ${category.color}30`,
              }}
            >
              {category.emoji}
            </div>
            <div className="min-w-0">
              <p
                className="font-semibold text-white text-sm truncate"
                title={goal.name}
              >
                {goal.name}
              </p>
              <span className="text-xs" style={{ color: category.color }}>
                {category.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors shrink-0 ml-3"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">

          {/* Progresso */}
          <div
            className="p-4 rounded-2xl space-y-3"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Progresso</span>
              <span
                className="font-bold"
                style={{ color: isCompleted ? "#22c55e" : "#a855f7" }}
              >
                {progress.toFixed(1)}%
              </span>
            </div>
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: isCompleted
                    ? "linear-gradient(90deg, #22c55e, #4ade80)"
                    : "linear-gradient(90deg, #a855f7, #7c3aed)",
                  boxShadow: isCompleted
                    ? "0 0 8px rgba(34,197,94,0.4)"
                    : "0 0 8px rgba(168,85,247,0.4)",
                }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/60">
                {formatCurrency(goal.currentAmount)}
              </span>
              <span className="text-white/40">
                {formatCurrency(goal.targetAmount)}
              </span>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-3 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-1.5 text-white/40 mb-1">
                <Clock size={11} />
                <span className="text-[10px] uppercase tracking-wide font-semibold">
                  Prazo
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                {formatDateLong(goal.targetDate) ?? "Sem prazo"}
              </p>
            </div>
            <div
              className="p-3 rounded-xl"
              style={{
                background: "rgba(168,85,247,0.08)",
                border: "1px solid rgba(168,85,247,0.2)",
              }}
            >
              <div className="flex items-center gap-1.5 text-[#a855f7] mb-1">
                <TrendingUp size={11} />
                <span className="text-[10px] uppercase tracking-wide font-semibold">
                  Previsão
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                {formatDateLong(goal.predictedDate) ?? "Calculando..."}
              </p>
            </div>
          </div>

          {/* Mensal necessário */}
          {monthlyNeeded !== null && !isCompleted && (
            <div
              className="p-4 rounded-2xl"
              style={{
                background: "rgba(168,85,247,0.06)",
                border: "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <p className="text-xs text-white/50 mb-1">
                Para cumprir o prazo, guarde:
              </p>
              <p className="text-xl font-bold text-[#a855f7]">
                {formatCurrency(monthlyNeeded)}
                <span className="text-white/40 text-sm font-normal"> /mês</span>
              </p>
            </div>
          )}

          {/* Prioridade e descrição */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Prioridade:</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ color: priority.color, background: priority.bg }}
            >
              {priority.label}
            </span>
          </div>

          {goal.description && (
            <p className="text-sm text-white/60 leading-relaxed">
              {goal.description}
            </p>
          )}

          {/* Histórico de aportes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History size={14} className="text-white/40" />
                <p className="text-sm font-semibold text-white">
                  Histórico de aportes
                </p>
              </div>
              {contributions.length > 0 && (
                <span className="text-xs text-white/30">
                  {contributions.length} aporte{contributions.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {contributions.length === 0 ? (
              <p
                className="text-xs text-white/40 py-6 text-center rounded-xl"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                Nenhum aporte registrado ainda.
              </p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {visibleHistory.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#22c55e]">
                            + {formatCurrency(c.amount)}
                          </p>
                          {c.note && (
                            <p className="text-xs text-white/40 mt-0.5 truncate">
                              {c.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-xs text-white/40 flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDateShort(c.createdAt)}
                          </span>
                          <button
                            onClick={() => handleDeleteContribution(c.id)}
                            disabled={!!deletingId}
                            title="Excluir aporte"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
                            style={{
                              background: "rgba(239,68,68,0.08)",
                              border: "1px solid rgba(239,68,68,0.15)",
                            }}
                          >
                            {deletingId === c.id ? (
                              <Loader2 size={11} className="animate-spin text-red-400" />
                            ) : (
                              <Trash2 size={11} className="text-red-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Ver mais */}
                {hasMore && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    <ChevronDown size={13} />
                    Ver mais {Math.min(contributions.length - visibleCount, PAGE_SIZE)} aportes
                  </motion.button>
                )}
              </div>
            )}
          </div>

          <div className="h-1" />
        </div>

        {/* Footer */}
        {!isCompleted && (
          <div
            className="shrink-0 px-6 py-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onAddContribution}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                boxShadow: "0 6px 24px rgba(168,85,247,0.35)",
              }}
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