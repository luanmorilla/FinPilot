"use client";
// src/app/(dashboard)/cofrinho/PiggyHero.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Plus,
  Minus,
  X,
  Loader2,
  Bot,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { AvaliacaoRetirada } from "./useCofrinho";

interface Props {
  totalGuardado: number;
  celebrating: boolean;
  onAddClick?: () => void;
  onRetirar?: (
    valor: number,
    motivo: string,
    confirmado?: boolean
  ) => Promise<{ liberado: boolean; avaliacao: AvaliacaoRetirada }>;
  isWithdrawing?: boolean;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

// ─── Modal de retirada ──────────────────────────────────────────────────────

function RetirarModal({
  totalGuardado,
  onClose,
  onRetirar,
  isWithdrawing,
}: {
  totalGuardado: number;
  onClose: () => void;
  onRetirar: Props["onRetirar"];
  isWithdrawing?: boolean;
}) {
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [avaliacao, setAvaliacao] = useState<AvaliacaoRetirada | null>(null);
  const [liberado, setLiberado] = useState(false);
  const [erro, setErro] = useState("");

  const valorNum = parseFloat(valor.replace(",", ".")) || 0;
  const podeEnviar = valorNum > 0 && valorNum <= totalGuardado && motivo.trim().length > 0;

  async function handleAvaliar(forcarConfirmacao = false) {
    if (!onRetirar) return;
    setErro("");

    if (!forcarConfirmacao && !podeEnviar) {
      if (valorNum > totalGuardado) setErro("Esse valor é maior do que você tem guardado.");
      return;
    }

    const result = await onRetirar(valorNum, motivo.trim(), forcarConfirmacao);
    setAvaliacao(result.avaliacao);
    if (result.liberado) setLiberado(true);
  }

  // Mostra o footer de "Continuar" só antes de qualquer avaliação do Finn.
  // Depois que o Finn avaliou, os botões de ação vivem dentro do card de
  // avaliação (Confirmar retirada / Mesmo assim, quero retirar agora),
  // pra não duplicar ações conflitantes na tela.
  const mostrarFooterInicial = !liberado && !avaliacao;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-x-0 top-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
style={{ bottom: 80, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col"
        style={{
          background: "#13131a",
          border: "1px solid rgba(255,255,255,0.1)",
          maxHeight: "calc(100dvh - 80px)",
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2 className="font-bold text-lg text-white">Retirar do cofrinho</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">
          {!liberado && (
            <>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">
                  Quanto você quer retirar?
                </label>
                <div
                  className="rounded-2xl p-4 flex items-center gap-2"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span className="text-white/50 text-xl font-bold">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valor}
                    onChange={(e) => setValor(e.target.value.replace(/[^\d,]/g, ""))}
                    placeholder="0,00"
                    className="flex-1 bg-transparent outline-none text-white text-2xl font-bold placeholder:text-white/20"
                  />
                </div>
                <p className="text-xs text-white/35 mt-1.5">
                  Você tem {formatCurrency(totalGuardado)} guardado.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">
                  Por que você precisa retirar?
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value.slice(0, 200))}
                  placeholder="Ex: preciso pagar uma conta de luz atrasada..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none resize-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <p className="text-[10px] text-white/30 mt-1">
                  O Finn vai te ajudar a pensar antes de decidir.
                </p>
              </div>

              {erro && (
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <AlertTriangle size={14} className="shrink-0" />
                  {erro}
                </div>
              )}
            </>
          )}

          {/* Resposta do Finn */}
          <AnimatePresence>
            {avaliacao && !liberado && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl p-4 space-y-3"
                style={{
                  background:
                    avaliacao.nivel === "nao_urgente"
                      ? "rgba(245,158,11,0.08)"
                      : "rgba(168,85,247,0.08)",
                  border: `1px solid ${
                    avaliacao.nivel === "nao_urgente"
                      ? "rgba(245,158,11,0.25)"
                      : "rgba(168,85,247,0.2)"
                  }`,
                }}
              >
                <div className="flex gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background:
                        avaliacao.nivel === "nao_urgente"
                          ? "rgba(245,158,11,0.18)"
                          : "rgba(168,85,247,0.18)",
                    }}
                  >
                    <Bot
                      size={15}
                      className={
                        avaliacao.nivel === "nao_urgente"
                          ? "text-amber-400"
                          : "text-[#a855f7]"
                      }
                    />
                  </div>
                  <p className="text-sm text-white/85 leading-relaxed flex-1">
                    {avaliacao.mensagemFinn}
                  </p>
                </div>

                {avaliacao.liberaDireto ? (
                  // O Finn liberou direto: precisa de um botão claro pra
                  // efetivar a retirada (antes não existia nenhum aqui).
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAvaliar(true)}
                    disabled={isWithdrawing}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                      boxShadow: "0 6px 24px rgba(168,85,247,0.35)",
                    }}
                  >
                    {isWithdrawing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Confirmar retirada"
                    )}
                  </motion.button>
                ) : (
                  <button
                    onClick={() => handleAvaliar(true)}
                    disabled={isWithdrawing}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-white/70 transition-all disabled:opacity-50"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {isWithdrawing ? (
                      <Loader2 size={14} className="animate-spin mx-auto" />
                    ) : (
                      "Mesmo assim, quero retirar agora"
                    )}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sucesso */}
          {liberado && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center gap-3 py-6"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.15)" }}
              >
                <CheckCircle2 size={22} className="text-green-400" />
              </div>
              <p className="text-white font-semibold">
                Retirada de {formatCurrency(valorNum)} concluída
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}
              >
                Fechar
              </button>
            </motion.div>
          )}

          <div className="h-1" />
        </div>

        {/* Footer */}
        {mostrarFooterInicial && (
          <div
            className="shrink-0 px-6 py-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAvaliar(false)}
              disabled={!podeEnviar || isWithdrawing}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                boxShadow: "0 6px 24px rgba(168,85,247,0.35)",
              }}
            >
              {isWithdrawing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Continuar"
              )}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function PiggyHero({
  totalGuardado,
  celebrating,
  onAddClick,
  onRetirar,
  isWithdrawing,
}: Props) {
  const [showRetirar, setShowRetirar] = useState(false);

  return (
    <div className="flex flex-col items-center relative py-4">
      {/* Glow roxo de fundo */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)",
          filter: "blur(24px)",
        }}
      />

      {/* Partículas ao celebrar */}
      <AnimatePresence>
        {celebrating &&
          ["💰", "✨", "🎉", "⭐", "💜"].map((emoji, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 1, y: 0, x: 0, scale: 0.5 }}
              animate={{
                opacity: 0,
                y: -80 - i * 15,
                x: (i % 2 === 0 ? 1 : -1) * (30 + i * 12),
                scale: 1.2,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
              className="absolute text-2xl pointer-events-none z-10"
              style={{ top: "40%", left: "50%" }}
            >
              {emoji}
            </motion.span>
          ))}
      </AnimatePresence>

      {/* Porquinho */}
      <motion.div
        animate={
          celebrating
            ? { scale: [1, 1.12, 0.95, 1.08, 1], rotate: [0, -4, 4, -2, 0] }
            : { y: [0, -8, 0] }
        }
        transition={
          celebrating
            ? { duration: 0.7, ease: "easeInOut" }
            : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
        }
        className="relative z-10"
      >
        <Image
          src="/images/cofrinho.png"
          alt="Cofrinho do Finn"
          width={200}
          height={200}
          priority
          className="drop-shadow-2xl"
          style={{
            filter: celebrating
              ? "drop-shadow(0 0 32px rgba(168,85,247,0.7))"
              : "drop-shadow(0 8px 24px rgba(168,85,247,0.35))",
            transition: "filter 0.4s ease",
          }}
        />
      </motion.div>

      {/* Total guardado */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-5 text-center relative z-10"
      >
        <p
          className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: "rgba(168,85,247,0.8)" }}
        >
          Total Registrado
        </p>
        <motion.p
          key={totalGuardado}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-black text-white"
          style={{ textShadow: "0 0 24px rgba(168,85,247,0.4)" }}
        >
          {formatCurrency(totalGuardado)}
        </motion.p>
        <p className="text-xs text-white/35 mt-1.5 max-w-[220px] mx-auto leading-relaxed">
          Valor informado por você como economizado.
          <br />
          Não é dinheiro armazenado pelo FinPilot.
        </p>
      </motion.div>

      {/* Ações */}
      <div className="flex gap-2.5 mt-5 relative z-10">
        {onAddClick && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              boxShadow: "0 4px 16px rgba(168,85,247,0.35)",
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Guardar mais
          </motion.button>
        )}
        {totalGuardado > 0 && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowRetirar(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white/60"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Minus size={14} strokeWidth={2.5} />
            Retirar
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showRetirar && onRetirar && (
          <RetirarModal
            totalGuardado={totalGuardado}
            onClose={() => setShowRetirar(false)}
            onRetirar={onRetirar}
            isWithdrawing={isWithdrawing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}