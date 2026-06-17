"use client";
// src/app/(dashboard)/cofrinho/PiggyHero.tsx

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Props {
  totalGuardado: number;
  celebrating: boolean;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

export function PiggyHero({ totalGuardado, celebrating }: Props) {
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
    </div>
  );
}