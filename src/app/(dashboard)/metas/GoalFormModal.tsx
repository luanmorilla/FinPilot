"use client";
// src/app/(dashboard)/metas/GoalFormModal.tsx

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  Lightbulb,
  Loader2,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import type { Goal, GoalCategory, GoalPriority } from "./types";
import { CATEGORY_CONFIG } from "./types";

interface Props {
  goal?: Goal | null;
  onClose: () => void;
  onSuccess: (goal: Goal) => void;
}

interface SituacaoFinanceira {
  salario: number;
  despesaMediaMensal: number;
  dividaMensal: number;
  sobraMensal: number;
}

const CATEGORIES: GoalCategory[] = [
  "CASA", "CARRO", "VIAGEM", "RESERVA", "EDUCACAO", "NEGOCIO", "OUTROS",
];

const PRIORITIES: { value: GoalPriority; label: string; color: string }[] = [
  { value: "HIGH",   label: "Alta",  color: "#ef4444" },
  { value: "MEDIUM", label: "Média", color: "#f59e0b" },
  { value: "LOW",    label: "Baixa", color: "#22c55e" },
];

function parseBRL(val: string): number {
  return parseFloat(val.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
}

function fmtBRL(val: string): string {
  const num = val.replace(/\D/g, "");
  if (!num) return "";
  const parsed = (parseInt(num) / 100).toFixed(2);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    parseFloat(parsed)
  );
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

// ── Modal de confirmação de delete ──────────────────────────────────────────
function DeleteConfirmModal({
  onConfirm,
  onCancel,
  isDeleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-x-0 top-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
  style={{
    bottom: 80,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
  }}
  onClick={(e) => e.target === e.currentTarget && onCancel()}>
  <motion.div
    initial={{ y: 60, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 60, opacity: 0 }}
    transition={{ type: "spring", damping: 28, stiffness: 300 }}
    className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col"
    style={{
      background: "#13131a",
      border: "1px solid rgba(255,255,255,0.1)",
      maxHeight: "calc(100dvh - 80px)",
    }}
  >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <p className="font-bold text-white text-base">Excluir meta?</p>
            <p className="text-xs text-white/50 mt-0.5">Todos os aportes serão perdidos.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Cancelar
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-[2] py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
            }}
          >
            {isDeleting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                <Trash2 size={15} />
                Excluir
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export function GoalFormModal({ goal, onClose, onSuccess }: Props) {
  const isEdit = !!goal;

  const [form, setForm] = useState({
    name: goal?.name ?? "",
    description: goal?.description ?? "",
    category: (goal?.category ?? "OUTROS") as GoalCategory,
    priority: (goal?.priority ?? "MEDIUM") as GoalPriority,
    targetAmount:  goal ? String(Math.round(goal.targetAmount  * 100)) : "",
    currentAmount: goal ? String(Math.round(goal.currentAmount * 100)) : "",
    targetDate: goal?.targetDate
      ? new Date(goal.targetDate).toISOString().split("T")[0]
      : "",
  });

  const [isLoading, setIsLoading]           = useState(false);
  const [isDeleting, setIsDeleting]         = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError]                   = useState("");
  const [situacao, setSituacao]             = useState<SituacaoFinanceira | null>(null);
  const [reservaAplicada, setReservaAplicada] = useState(false);

  // Carrega situação financeira do usuário
  useEffect(() => {
    fetch("/api/metas/situacao-financeira")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSituacao(data))
      .catch(() => setSituacao(null));
  }, []);

  // Reseta reservaAplicada sempre que a categoria mudar
  useEffect(() => {
    setReservaAplicada(false);
  }, [form.category]);

  // Sugestão: Reserva de Emergência = 6x despesa mensal
  const reservaSuggestion = useMemo(() => {
    if (form.category !== "RESERVA") return null;
    if (!situacao || situacao.despesaMediaMensal <= 0) return null;
    return situacao.despesaMediaMensal * 6;
  }, [form.category, situacao]);

  // Inteligência financeira: valor mensal necessário
  const intelligence = useMemo(() => {
    const target    = parseBRL(fmtBRL(form.targetAmount));
    const current   = parseBRL(fmtBRL(form.currentAmount));
    const remaining = target - current;

    if (!form.targetDate || target <= 0 || remaining <= 0) return null;

    const today    = new Date();
    const deadline = new Date(form.targetDate);
    const monthsDiff =
      (deadline.getFullYear() - today.getFullYear()) * 12 +
      (deadline.getMonth() - today.getMonth());

    if (monthsDiff <= 0) return null;

    const monthlyNeeded = remaining / monthsDiff;
    return { monthlyNeeded, monthsDiff, remaining, target, current };
  }, [form.targetAmount, form.currentAmount, form.targetDate]);

  // Viabilidade: cruza mensal necessário com sobra real
  const viability = useMemo(() => {
    if (!intelligence || !situacao) return null;
    const margemSegura = situacao.sobraMensal * 0.9;
    if (intelligence.monthlyNeeded <= margemSegura) return null;

    const mesesIdeais =
      situacao.sobraMensal > 0
        ? Math.ceil(intelligence.remaining / (situacao.sobraMensal * 0.8))
        : null;

    return { mesesIdeais };
  }, [intelligence, situacao]);

  function aplicarReserva() {
    if (!reservaSuggestion) return;
    setForm((p) => ({
      ...p,
      targetAmount: String(Math.round(reservaSuggestion * 100)),
    }));
    setReservaAplicada(true);
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Informe o nome da meta"); return; }
    const target = parseBRL(fmtBRL(form.targetAmount));
    if (target <= 0) { setError("Informe um valor objetivo válido"); return; }

    setIsLoading(true);
    setError("");

    try {
      const payload = {
        name:          form.name,
        description:   form.description || undefined,
        category:      form.category,
        priority:      form.priority,
        targetAmount:  target,
        currentAmount: parseBRL(fmtBRL(form.currentAmount)),
        targetDate:    form.targetDate || null,
      };

      const url    = isEdit ? `/api/metas/${goal!.id}` : "/api/metas";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Erro ao salvar meta");
      }

      const data: Goal = await res.json();
      onSuccess(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar meta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!goal) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/metas/${goal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      onSuccess(goal);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao excluir meta");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
            maxHeight: "calc(100dvh - 80px)",
          }}
        >
          {/* Header fixo */}
          <div
            className="shrink-0 flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h2 className="font-bold text-lg text-white">
              {isEdit ? "Editar Meta" : "Nova Meta"}
            </h2>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scroll area */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">

            {/* Categoria */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Categoria</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const cfg      = CATEGORY_CONFIG[cat];
                  const selected = form.category === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setForm((p) => ({ ...p, category: cat }))}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs transition-all active:scale-95"
                      style={
                        selected
                          ? {
                              background: `${cfg.color}20`,
                              border: `1px solid ${cfg.color}50`,
                              color: cfg.color,
                            }
                          : {
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              color: "rgba(255,255,255,0.5)",
                            }
                      }
                    >
                      <span className="text-lg">{cfg.emoji}</span>
                      <span className="font-medium leading-tight">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sugestão Reserva de Emergência */}
            <AnimatePresence>
              {reservaSuggestion && !reservaAplicada && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl p-4 space-y-2"
                  style={{
                    background: "rgba(34,197,94,0.08)",
                    border: "1px solid rgba(34,197,94,0.2)",
                  }}
                >
                  <div className="flex items-center gap-2 text-[#22c55e]">
                    <ShieldCheck size={14} />
                    <span className="text-xs font-semibold">Reserva de Emergência</span>
                  </div>
                  <p className="text-sm text-white/80">
                    Sua despesa mensal média é{" "}
                    <span className="text-white font-semibold">
                      {formatCurrency(situacao!.despesaMediaMensal)}
                    </span>
                    . O ideal é guardar 6 meses:
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="flex-1 flex items-center justify-center py-2.5 rounded-xl"
                      style={{ background: "rgba(34,197,94,0.15)" }}
                    >
                      <span className="text-lg font-bold text-[#22c55e]">
                        {formatCurrency(reservaSuggestion)}
                      </span>
                    </div>
                    <button
                      onClick={aplicarReserva}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                    >
                      Aplicar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Nome */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">
                Nome da meta *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Viagem para Europa"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.5)")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>

            {/* Descrição */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-white/50">
                  Descrição (opcional)
                </label>
                <span className="text-[10px] text-white/30">
                  {form.description.length}/200
                </span>
              </div>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    description: e.target.value.slice(0, 200),
                  }))
                }
                placeholder="Detalhes sobre sua meta..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none resize-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.5)")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>

            {/* Valores */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">
                  Valor objetivo *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.targetAmount ? fmtBRL(form.targetAmount) : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setForm((p) => ({ ...p, targetAmount: raw }));
                  }}
                  placeholder="R$ 0,00"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.5)")}
                  onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">
                  Valor inicial
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.currentAmount ? fmtBRL(form.currentAmount) : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setForm((p) => ({ ...p, currentAmount: raw }));
                  }}
                  placeholder="R$ 0,00"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.5)")}
                  onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
            </div>

            {/* Prazo */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">
                Prazo desejado
              </label>
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  colorScheme: "dark",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.5)")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">
                Prioridade
              </label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setForm((prev) => ({ ...prev, priority: p.value }))}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    style={
                      form.priority === p.value
                        ? {
                            background: `${p.color}20`,
                            border: `1px solid ${p.color}50`,
                            color: p.color,
                          }
                        : {
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.4)",
                          }
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inteligência Financeira */}
            <AnimatePresence>
              {intelligence && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl p-4 space-y-2"
                  style={{
                    background: "rgba(168,85,247,0.08)",
                    border: "1px solid rgba(168,85,247,0.2)",
                  }}
                >
                  <div className="flex items-center gap-2 text-[#a855f7]">
                    <Lightbulb size={14} />
                    <span className="text-xs font-semibold">Inteligência Financeira</span>
                  </div>
                  <p className="text-sm text-white/80">
                    Para atingir{" "}
                    <span className="text-white font-semibold">
                      {formatCurrency(intelligence.target)}
                    </span>{" "}
                    em{" "}
                    <span className="text-white font-semibold">
                      {intelligence.monthsDiff} meses
                    </span>
                    , você precisa guardar:
                  </p>
                  <div
                    className="flex items-center justify-center py-3 rounded-xl"
                    style={{ background: "rgba(168,85,247,0.15)" }}
                  >
                    <span className="text-2xl font-bold text-[#a855f7]">
                      {formatCurrency(intelligence.monthlyNeeded)}
                    </span>
                    <span className="text-white/50 text-sm ml-1.5">/ mês</span>
                  </div>

                  {viability && (
                    <div
                      className="flex items-start gap-2 pt-2"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-300">
                        Meta difícil de alcançar com sua situação atual.{" "}
                        {viability.mesesIdeais
                          ? `O prazo ideal seria de ${viability.mesesIdeais} meses.`
                          : "Considere aumentar sua sobra mensal antes de assumir esse prazo."}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

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

            <div className="h-1" />
          </div>

          {/* Footer fixo */}
          <div
            className="shrink-0 flex gap-3 px-6 py-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {isEdit && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="flex items-center justify-center px-4 py-3 rounded-xl text-red-400 transition-all disabled:opacity-50"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <Trash2 size={16} />
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60 transition-all"
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
              disabled={isLoading}
              className="flex-[2] py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                boxShadow: "0 6px 24px rgba(168,85,247,0.35)",
              }}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isEdit ? (
                "Salvar"
              ) : (
                "Criar Meta"
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Modal de confirmação de delete */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmModal
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </>
  );
}