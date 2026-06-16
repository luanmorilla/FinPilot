"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"

interface SaldoRealCardProps {
  saldoDisponivel: number
  receita: number
  totalComprometido: number
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function CircleProgress({ pct, size = 88 }: { pct: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ

  // Cor baseada no percentual DISPONÍVEL (inverso do comprometido)
  const disp = 100 - pct
  const stroke =
    disp >= 50 ? "#22C55E" : disp >= 30 ? "#F59E0B" : "#EF4444"

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${stroke}80)` }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white leading-none">{Math.round(100 - pct)}%</span>
        <span className="text-[9px] text-slate-500 mt-0.5">disponível</span>
      </div>
    </div>
  )
}

export default function SaldoRealCard({ saldoDisponivel, receita, totalComprometido }: SaldoRealCardProps) {
  const [oculto, setOculto] = useState(false)
  const pctComprometido = receita > 0 ? Math.min((totalComprometido / receita) * 100, 100) : 0

  // Barra de progresso linear
  const barColor =
    pctComprometido < 50 ? "from-green-500 to-emerald-400"
    : pctComprometido < 75 ? "from-amber-500 to-yellow-400"
    : "from-red-500 to-rose-400"

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mx-4 mt-3"
    >
      <div
        className="rounded-3xl p-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.4), 0 0 40px rgba(124,77,255,0.08)",
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Saldo disponível
            </span>
          </div>
          <button
            onClick={() => setOculto(!oculto)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {oculto ? <EyeOff size={13} className="text-slate-500" /> : <Eye size={13} className="text-slate-500" />}
          </button>
        </div>

        {/* Main value + circle */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {oculto ? (
              <div className="flex gap-1.5 items-center h-10">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-6 h-3.5 rounded-full bg-white/10" />
                ))}
              </div>
            ) : (
              <motion.p
                key="val"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[32px] font-bold leading-none"
                style={{ color: saldoDisponivel < 0 ? "#EF4444" : "#F8FAFC" }}
              >
                {formatBRL(saldoDisponivel)}
              </motion.p>
            )}
            <p className="text-xs text-slate-500 mt-1.5">
              de {oculto ? "•••••" : formatBRL(receita)} recebidos este mês
            </p>

            {/* Linear progress */}
            <div className="mt-3 w-48">
              <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pctComprometido}%` }}
                  transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                />
              </div>
            </div>
          </div>

          {/* Circle progress */}
          <CircleProgress pct={pctComprometido} size={90} />
        </div>

        {/* Bottom row: Receitas / Compromissos / Guardado */}
        <div className="grid grid-cols-3 gap-2 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <p className="text-[10px] font-semibold mb-1" style={{ color: "#22C55E" }}>Receitas</p>
            <p className="text-sm font-bold text-white">{oculto ? "•••••" : formatBRL(receita)}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">Este mês</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold mb-1" style={{ color: "#EF4444" }}>Compromissos</p>
            <p className="text-sm font-bold text-white">{oculto ? "•••••" : formatBRL(-totalComprometido)}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">Este mês</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold mb-1" style={{ color: "#7C4DFF" }}>Guardado</p>
            <p className="text-sm font-bold text-white">{oculto ? "•••••" : "R$ 0"}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">Este mês</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}