"use client";
// src/app/(dashboard)/cofrinho/HistoricoCard.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronDown } from "lucide-react";
import type { DepositoCofrinho } from "./types";

interface Props {
  depositos: DepositoCofrinho[];
}

const PAGE_SIZE = 5;

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function HistoricoCard({ depositos }: Props) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  const shown = depositos.slice(0, visible);
  const hasMore = visible < depositos.length;

  if (depositos.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
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
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.25)",
            }}
          >
            <History size={15} className="text-[#a855f7]" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#a855f7]">
            Histórico
          </p>
        </div>
        <span className="text-xs text-white/40">{depositos.length} registro{depositos.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {shown.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between px-3 py-2.5 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs"
                  style={{ background: "rgba(168,85,247,0.15)" }}
                >
                  🐷
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold">
                    {formatDate(d.createdAt)}
                  </p>
                  {d.descricao && (
                    <p className="text-white/35 text-[10px] truncate">
                      {d.descricao}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-green-400 font-bold text-sm flex-shrink-0 ml-2">
                +{formatCurrency(d.valor)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Ver mais */}
      {hasMore && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="w-full mt-3 py-2.5 rounded-2xl text-xs font-semibold text-white/50 flex items-center justify-center gap-1 hover:text-white/80 transition-colors"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <ChevronDown size={13} />
          Ver mais ({depositos.length - visible} restantes)
        </motion.button>
      )}
    </motion.div>
  );
}