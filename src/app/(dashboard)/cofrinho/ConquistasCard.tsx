"use client";
// src/app/(dashboard)/cofrinho/ConquistasCard.tsx

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { ConquistaCofrinho } from "./types";

interface Props {
  conquistas: ConquistaCofrinho[];
}

export function ConquistasCard({ conquistas }: Props) {
  const conquistadas = conquistas.filter((c) => c.conquistada);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
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
              background: "rgba(234,179,8,0.12)",
              border: "1px solid rgba(234,179,8,0.25)",
            }}
          >
            <Trophy size={15} className="text-yellow-400" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">
            Conquistas
          </p>
        </div>
        <span className="text-xs text-white/40">
          {conquistadas.length}/{conquistas.length}
        </span>
      </div>

      {/* Grid de conquistas */}
      <div className="grid grid-cols-3 gap-2.5">
        {conquistas.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.25 + i * 0.06,
              type: "spring",
              stiffness: 200,
              damping: 14,
            }}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl relative"
            style={{
              background: c.conquistada
                ? "linear-gradient(135deg, rgba(234,179,8,0.12), rgba(245,158,11,0.08))"
                : "rgba(255,255,255,0.03)",
              border: c.conquistada
                ? "1px solid rgba(234,179,8,0.3)"
                : "1px solid rgba(255,255,255,0.06)",
            }}
            title={c.descricao}
          >
            {/* Brilho na conquista */}
            {c.conquistada && (
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 50% 0%, rgba(234,179,8,0.15), transparent 60%)",
                }}
              />
            )}

            <span
              className="text-2xl relative z-10"
              style={{ filter: c.conquistada ? "none" : "grayscale(1) opacity(0.3)" }}
            >
              {c.emoji}
            </span>

            <span
              className="text-[10px] font-semibold text-center leading-tight relative z-10"
              style={{
                color: c.conquistada ? "#eab308" : "rgba(255,255,255,0.25)",
              }}
            >
              {c.titulo}
            </span>

            {c.conquistada && c.conquistadaEm && (
              <span className="text-[9px] text-white/25 relative z-10">
                {new Date(c.conquistadaEm).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            )}

            {!c.conquistada && (
              <span className="text-[9px] text-white/20 relative z-10">bloqueada</span>
            )}
          </motion.div>
        ))}
      </div>

      {conquistadas.length === 0 && (
        <p className="text-center text-white/30 text-xs mt-2">
          Complete missões para desbloquear conquistas
        </p>
      )}
    </motion.div>
  );
}