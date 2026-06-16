"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, Target, PiggyBank } from "lucide-react"

interface SaudoCardProps {
  saudeFinanceira: "otima" | "boa" | "atencao" | "critica"
  mensagem: string
  detalhe?: string
}

const saudeConfig = {
  otima:   { label: "Excelente 🚀", color: "text-emerald-400", border: "rgba(52,211,153,0.2)" },
  boa:     { label: "Boa 💪",       color: "text-blue-400",    border: "rgba(96,165,250,0.2)" },
  atencao: { label: "Atenção ⚠️",  color: "text-amber-400",   border: "rgba(251,191,36,0.2)" },
  critica: { label: "Crítica 🚨",   color: "text-red-400",     border: "rgba(248,113,113,0.2)" },
}

export default function SaudoCard({ saudeFinanceira, mensagem, detalhe }: SaudoCardProps) {
  const config = saudeConfig[saudeFinanceira]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-4 mt-4"
    >
      <div
        className="relative rounded-3xl overflow-hidden p-5"
        style={{
          background: "linear-gradient(135deg, #1a1040 0%, #0d0820 100%)",
          border: `1px solid ${config.border}`,
          boxShadow: "0 8px 32px rgba(109, 40, 217, 0.15)",
        }}
      >
        {/* Glow de fundo */}
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(109,40,217,0.15) 0%, transparent 70%)" }}
        />

        <div className="flex items-start justify-between">
          {/* Texto esquerdo */}
          <div className="flex-1 pr-4">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
              Olá, eu sou Finn 👋
            </p>
            <span className={`text-xs font-bold ${config.color} mb-2 block`}>
              • {config.label}
            </span>
            <p className="text-sm text-zinc-300 leading-relaxed mb-1">
              {mensagem}
            </p>
            {detalhe && (
              <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                {detalhe}
              </p>
            )}
          </div>

          {/* Finn corpo flutuando */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex-shrink-0"
          >
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full"
              style={{ background: "radial-gradient(ellipse, rgba(109,40,217,0.4) 0%, transparent 70%)" }}
            />
            <Image
              src="/images/finn-corpo.png"
              alt="Finn"
              width={110}
              height={110}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </motion.div>
        </div>

        {/* Botões de ação rápida */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/dividas">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center">
                <Plus size={16} className="text-red-400" />
              </div>
              <span className="text-[10px] font-semibold text-red-400">Dívidas</span>
            </motion.div>
          </Link>

          <Link href="/metas">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all"
              style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Target size={16} className="text-blue-400" />
              </div>
              <span className="text-[10px] font-semibold text-blue-400">Metas</span>
            </motion.div>
          </Link>

          <Link href="/cofrinho">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all"
              style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <PiggyBank size={16} className="text-purple-400" />
              </div>
              <span className="text-[10px] font-semibold text-purple-400">Cofrinho</span>
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}