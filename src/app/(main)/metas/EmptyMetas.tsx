"use client";
// src/app/(dashboard)/metas/EmptyMetas.tsx

import { motion } from "framer-motion";
import { Target, Plus, Sparkles } from "lucide-react";

interface Props {
  onCreateClick: () => void;
}

const SUGGESTIONS = [
  { emoji: "🏠", label: "Casa própria" },
  { emoji: "✈️", label: "Viagem dos sonhos" },
  { emoji: "🛡️", label: "Reserva de emergência" },
  { emoji: "📚", label: "Educação" },
];

export function EmptyMetas({ onCreateClick }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="text-center py-14 px-6 rounded-3xl relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px dashed rgba(255,255,255,0.08)",
      }}
    >
      {/* Glow de fundo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Ícone animado */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 14 }}
        className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 relative"
        style={{
          background:
            "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(124,58,237,0.1))",
          border: "1px solid rgba(168,85,247,0.25)",
          boxShadow: "0 8px 32px rgba(168,85,247,0.15)",
        }}
      >
        <Target size={32} className="text-[#a855f7]" />
        <motion.div
          animate={{ rotate: [0, 15, -10, 0] }}
          transition={{ delay: 0.6, duration: 0.6, ease: "easeInOut" }}
          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}
        >
          <Sparkles size={12} className="text-white" />
        </motion.div>
      </motion.div>

      {/* Texto principal */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-white font-bold text-lg">Nenhuma meta por aqui ainda</p>
        <p className="text-white/40 text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
          Defina onde quer chegar e descubra quanto precisa guardar por mês para
          conquistar cada meta.
        </p>
      </motion.div>

      {/* Sugestões de categorias */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-2 mt-5"
      >
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 + i * 0.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={onCreateClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/60 transition-colors hover:text-white/90"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span>{s.emoji}</span>
            {s.label}
          </motion.button>
        ))}
      </motion.div>

      {/* CTA principal */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        onClick={onCreateClick}
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm text-white"
        style={{
          background: "linear-gradient(135deg, #a855f7, #7c3aed)",
          boxShadow: "0 8px 28px rgba(168,85,247,0.4)",
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Criar primeira meta
      </motion.button>
    </motion.div>
  );
}