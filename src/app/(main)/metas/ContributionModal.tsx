"use client";
// src/app/(dashboard)/metas/ContributionModal.tsx

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Loader2, AlertTriangle } from "lucide-react";
import type { Goal } from "./types";
import { CATEGORY_CONFIG } from "./types";

interface Props {
  goal: Goal;
  onClose: () => void;
  onSuccess: () => void;
}

function fmtBRL(val: string): string {
  const num = val.replace(/\D/g, "");
  if (!num) return "";
  const parsed = (parseInt(num) / 100).toFixed(2);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    parseFloat(parsed)
  );
}

function parseBRL(val: string): number {
  return parseFloat(val.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
}

// raw = centavos em string. Ex: "5000" = R$ 50,00
function quickValueToRaw(val: number): string {
  return String(val * 100);
}

const QUICK_VALUES = [50, 100, 200, 500];

export function ContributionModal({ goal, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");

  const category     = CATEGORY_CONFIG[goal.category];
  const progress     = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const parsedAmount = parseBRL(amount ? fmtBRL(amount) : "");
  const newProgress  = Math.min(
    ((goal.currentAmount + parsedAmount) / goal.targetAmount) * 100,
    100
  );

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  // Converte valor inteiro (ex: 50) para raw de centavos (ex: "5000")
  const handleQuick = (val: number) => {
    setAmount(quickValueToRaw(val));
  };

  const handleSubmit = async () => {
    if (parsedAmount <= 0) {
      setError("Informe um valor válido");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/metas/${goal.id}/aportes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount, note: note || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Erro ao registrar aporte");
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao registrar aporte");
    } finally {
      setIsLoading(false);
    }
  };

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
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: "#13131a",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: `${category.color}20` }}
            >
              {category.emoji}
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{goal.name}</p>
              <p className="text-xs text-white/40">Adicionar aporte</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Progresso atual */}
          <div
            className="p-4 rounded-2xl space-y-3"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Progresso atual</span>
              <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #a855f7, #7c3aed)",
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/40">
              <span>{formatCurrency(goal.currentAmount)}</span>
              <span>{formatCurrency(goal.targetAmount)}</span>
            </div>
          </div>

          {/* Valores rápidos */}
          <div>
            <p className="text-xs font-medium text-white/50 mb-2">Valores rápidos</p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_VALUES.map((v) => {
                const isSelected = parsedAmount === v;
                return (
                  <button
                    key={v}
                    onClick={() => handleQuick(v)}
                    className="py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    style={
                      isSelected
                        ? {
                            background: "rgba(168,85,247,0.2)",
                            border: "1px solid rgba(168,85,247,0.4)",
                            color: "#a855f7",
                          }
                        : {
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.6)",
                          }
                    }
                  >
                    R${v}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input de valor */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              Valor do aporte *
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={amount ? fmtBRL(amount) : ""}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setAmount(raw);
              }}
              placeholder="R$ 0,00"
              className="w-full px-4 py-3.5 rounded-xl text-lg font-bold text-white placeholder-white/30 outline-none transition-all text-center"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.5)")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              autoFocus
            />
          </div>

          {/* Preview novo progresso */}
          {parsedAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 rounded-xl"
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <p className="text-xs text-white/50 mb-2">Após este aporte</p>
              <div
                className="h-1.5 rounded-full overflow-hidden mb-1"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <motion.div
                  initial={{ width: `${progress}%` }}
                  animate={{ width: `${newProgress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #22c55e, #4ade80)" }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">
                  {formatCurrency(goal.currentAmount + parsedAmount)}
                </span>
                <span className="text-[#22c55e] font-bold">{newProgress.toFixed(1)}%</span>
              </div>
            </motion.div>
          )}

          {/* Observação */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              Observação (opcional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Salário de junho"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.5)")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {/* Erro */}
          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl text-sm font-medium text-white/60"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Cancelar
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSubmit}
              disabled={isLoading || parsedAmount <= 0}
              className="flex-[2] py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              style={{
                background:
                  parsedAmount > 0
                    ? "linear-gradient(135deg, #a855f7, #7c3aed)"
                    : "rgba(255,255,255,0.08)",
                boxShadow:
                  parsedAmount > 0 ? "0 6px 24px rgba(168,85,247,0.35)" : "none",
              }}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Plus size={16} strokeWidth={2.5} />
                  Registrar Aporte
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}