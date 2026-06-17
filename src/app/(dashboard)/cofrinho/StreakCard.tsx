"use client";
// src/app/(dashboard)/cofrinho/StreakCard.tsx

import { motion } from "framer-motion";
import { Flame, Calendar, Trophy } from "lucide-react";
import type { StreakInfo } from "./types";

interface Props {
  streak: StreakInfo;
}

const MARCOS = [
  { dias: 3, emoji: "🔥", label: "3 dias" },
  { dias: 7, emoji: "🔥", label: "1 semana" },
  { dias: 15, emoji: "⚡", label: "15 dias" },
  { dias: 30, emoji: "🏆", label: "1 mês" },
  { dias: 60, emoji: "💎", label: "2 meses" },
  { dias: 100, emoji: "🚀", label: "100 dias" },
];

export function StreakCard({ streak }: Props) {
  const proximoMarco = MARCOS.find((m) => m.dias > streak.diasSeguidos);
  const progressoProximo = proximoMarco
    ? Math.min((streak.diasSeguidos / proximoMarco.dias) * 100, 100)
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.25)",
            }}
          >
            <Flame size={15} className="text-amber-400" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Sequência
          </p>
        </div>
        <div className="flex items-center gap-1 text-white/40 text-xs">
          <Calendar size={11} />
          <span>{streak.totalDias} dia{streak.totalDias !== 1 ? "s" : ""} total</span>
        </div>
      </div>

      {/* Streak atual */}
      <div className="flex items-end gap-3 mb-4">
        <motion.p
          key={streak.diasSeguidos}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-black text-white leading-none"
        >
          {streak.diasSeguidos}
        </motion.p>
        <div className="mb-1.5">
          <p className="text-white font-semibold text-sm leading-tight">
            dia{streak.diasSeguidos !== 1 ? "s" : ""} seguidos
          </p>
          <p className="text-white/40 text-xs">
            Melhor: {streak.melhorStreak} dia{streak.melhorStreak !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Progresso para próximo marco */}
      {proximoMarco && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/40 mb-1.5">
            <span>Próximo: {proximoMarco.emoji} {proximoMarco.label}</span>
            <span>{streak.diasSeguidos}/{proximoMarco.dias}</span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressoProximo}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                boxShadow: "0 0 8px rgba(245,158,11,0.5)",
              }}
            />
          </div>
        </div>
      )}

      {/* Marcos */}
      <div className="grid grid-cols-3 gap-2">
        {MARCOS.map((marco) => {
          const atingido = streak.melhorStreak >= marco.dias;
          return (
            <motion.div
              key={marco.dias}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + MARCOS.indexOf(marco) * 0.04 }}
              className="flex flex-col items-center gap-1 py-2.5 rounded-2xl"
              style={{
                background: atingido
                  ? "rgba(245,158,11,0.1)"
                  : "rgba(255,255,255,0.03)",
                border: atingido
                  ? "1px solid rgba(245,158,11,0.25)"
                  : "1px solid rgba(255,255,255,0.06)",
                opacity: atingido ? 1 : 0.45,
              }}
            >
              <span className="text-xl">{marco.emoji}</span>
              <span
                className="text-[10px] font-bold"
                style={{ color: atingido ? "#f59e0b" : "rgba(255,255,255,0.4)" }}
              >
                {marco.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Zero dias — motivação */}
      {streak.diasSeguidos === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-center"
        >
          <p className="text-white/40 text-xs">
            Comece hoje e construa sua sequência 🔥
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}