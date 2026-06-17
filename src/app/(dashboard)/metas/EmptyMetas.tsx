"use client";
// src/app/(dashboard)/metas/EmptyMetas.tsx

import { motion } from "framer-motion";
import { Target, Plus } from "lucide-react";

interface Props {
  onCreateClick: () => void;
}

export function EmptyMetas({ onCreateClick }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 rounded-3xl"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}
      >
        <Target size={28} className="text-[#a855f7]" />
      </div>
      <p className="text-white font-semibold text-base">Nenhuma meta por aqui ainda</p>
      <p className="text-white/40 text-sm mt-1 max-w-xs mx-auto">
        Crie sua primeira meta e descubra quanto precisa guardar para conquistá-la.
      </p>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onCreateClick}
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm text-white"
        style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 6px 24px rgba(168,85,247,0.35)" }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Criar primeira meta
      </motion.button>
    </motion.div>
  );
}