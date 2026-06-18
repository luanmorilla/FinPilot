"use client";
// src/app/(dashboard)/cofrinho/PrevisaoCard.tsx

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { PrevisaoItem } from "./types";

interface Props {
  previsoes: PrevisaoItem[];
  valorAtual: number;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

export function PrevisaoCard({ previsoes, valorAtual }: Props) {
  const max = Math.max(...previsoes.map((p) => p.valor), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.25)",
          }}
        >
          <TrendingUp size={15} className="text-green-400" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-green-400">
          Se continuar nesse ritmo
        </p>
      </div>

      {/* Projeções */}
      <div className="space-y-3">
        {previsoes.map((p, i) => {
          const pct = Math.max((p.valor / max) * 100, 6);
          return (
            <motion.div
              key={p.dias}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
            >
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-white/60 font-medium">{p.label}</span>
                <span className="text-white font-bold">
                  {formatCurrency(p.valor)}
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.35 + i * 0.1 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, #22c55e, ${
                      i >= 2 ? "#a855f7" : "#16a34a"
                    })`,
                    boxShadow: "0 0 6px rgba(34,197,94,0.4)",
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-white/25 mt-4 leading-relaxed">
        Projeção baseada na média dos seus últimos depósitos. Valores aproximados,
        sem garantia de resultado.
      </p>
    </motion.div>
  );
}