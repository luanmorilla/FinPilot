"use client";
// src/app/(dashboard)/cofrinho/MissaoCard.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Bot, AlertTriangle, Target } from "lucide-react";
import type { MissaoDia } from "./types";

interface Props {
  missao: MissaoDia;
  onDepositar: (valor: number, descricao?: string) => Promise<boolean>;
  isDepositing: boolean;
  depositSuccess: boolean;
  jaDepositouHoje: boolean;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

export function MissaoCard({
  missao,
  onDepositar,
  isDepositing,
  depositSuccess,
  jaDepositouHoje,
}: Props) {
  const [valorCustom, setValorCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [localSuccess, setLocalSuccess] = useState(false);
  // Permite reabrir as ações mesmo já tendo cumprido a missão hoje,
  // pra deixar claro que dá pra guardar mais quando quiser.
  const [quiserGuardarMais, setQuiserGuardarMais] = useState(false);

  const handleDepositar = async (valor?: number) => {
    const v = valor ?? parseFloat(valorCustom.replace(",", "."));
    if (!v || v <= 0) return;
    const ok = await onDepositar(v, "Missão do dia");
    if (ok) {
      setLocalSuccess(true);
      setShowCustom(false);
      setValorCustom("");
      setQuiserGuardarMais(false);
    }
  };

  const success = (depositSuccess || localSuccess || jaDepositouHoje) && !quiserGuardarMais;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(124,58,237,0.08) 100%)",
        border: "1px solid rgba(168,85,247,0.25)",
      }}
    >
      {/* Glow sutil */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.15), transparent)",
          filter: "blur(20px)",
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(168,85,247,0.15)",
            border: "1px solid rgba(168,85,247,0.3)",
          }}
        >
          <Target size={15} className="text-[#a855f7]" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#a855f7]">
            Missão de Hoje
          </p>
        </div>
        {missao.contexto === "divida_pendente" && (
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-lg"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <AlertTriangle size={11} className="text-red-400" />
            <span className="text-[10px] text-red-400 font-semibold">Dívida pendente</span>
          </div>
        )}
      </div>

      {/* Valor sugerido */}
      <div className="relative z-10 mb-4">
        <p className="text-white/50 text-xs mb-1">Valor sugerido pelo Finn</p>
        <motion.p
          key={missao.valorSugerido}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-black text-white"
          style={{ textShadow: "0 0 20px rgba(168,85,247,0.4)" }}
        >
          {formatCurrency(missao.valorSugerido)}
        </motion.p>
      </div>

      {/* Mensagem do Finn */}
      <div
        className="flex gap-2.5 p-3 rounded-2xl mb-4 relative z-10"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.3)" }}
        >
          <Bot size={13} className="text-[#a855f7]" />
        </div>
        <p className="text-white/70 text-sm leading-relaxed">{missao.mensagem}</p>
      </div>

      {/* Meta relacionada */}
      {missao.metaRelacionada && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 relative z-10"
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.18)",
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/50">Contribui para a meta</p>
            <p className="text-sm font-semibold text-white truncate">
              {missao.metaRelacionada.nome}
            </p>
          </div>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-lg"
            style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
          >
            {missao.metaRelacionada.progresso.toFixed(0)}%
          </span>
        </div>
      )}

      {/* Estado de sucesso */}
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-2 relative z-10"
          >
            <div
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl"
              style={{
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              <CheckCircle2 size={18} className="text-green-400" />
              <span className="text-green-400 font-semibold text-sm">
                {jaDepositouHoje && !localSuccess
                  ? "Missão cumprida hoje! 🎉"
                  : "Registrado com sucesso! 🎉"}
              </span>
            </div>
            <button
              onClick={() => setQuiserGuardarMais(true)}
              className="w-full py-2 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Quero guardar mais hoje
            </button>
          </motion.div>
        ) : (
          <motion.div key="actions" className="space-y-2 relative z-10">
            {/* Botão principal */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => handleDepositar(missao.valorSugerido)}
              disabled={isDepositing}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
              style={{
                background: isDepositing
                  ? "rgba(168,85,247,0.4)"
                  : "linear-gradient(135deg, #a855f7, #7c3aed)",
                boxShadow: isDepositing ? "none" : "0 8px 28px rgba(168,85,247,0.4)",
              }}
            >
              {isDepositing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>✅ Consegui Guardar {formatCurrency(missao.valorSugerido)}</>
              )}
            </motion.button>

            {/* Outro valor */}
            <button
              onClick={() => setShowCustom((v) => !v)}
              className="w-full py-2 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Guardar outro valor
            </button>

            <AnimatePresence>
              {showCustom && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2 pt-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="R$ 0,00"
                      value={valorCustom}
                      onChange={(e) => setValorCustom(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    />
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleDepositar()}
                      disabled={isDepositing || !valorCustom}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                      style={{
                        background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                        opacity: !valorCustom ? 0.5 : 1,
                      }}
                    >
                      OK
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {quiserGuardarMais && (
              <button
                onClick={() => setQuiserGuardarMais(false)}
                className="w-full py-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
              >
                Voltar
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}