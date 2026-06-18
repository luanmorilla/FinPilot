"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Zap, Bell } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export interface AlertaFinnData {
  tipo: "pagamento_amanha" | "vencendo_hoje" | "vencida" | "urgente";
  titulo: string;
  mensagem: string;
  subtitulo?: string;
  href?: string;
}

interface AlertaFinnProps {
  alertas: AlertaFinnData[];
}

const configTipo = {
  pagamento_amanha: {
    bg: "from-violet-600/20 to-purple-600/10",
    borda: "border-violet-500/30",
    iconBg: "bg-violet-500/20",
    iconCor: "text-violet-300",
    dot: "bg-violet-400",
    pulsa: false,
    Icon: Zap,
  },
  vencendo_hoje: {
    bg: "from-amber-600/20 to-orange-600/10",
    borda: "border-amber-500/30",
    iconBg: "bg-amber-500/20",
    iconCor: "text-amber-300",
    dot: "bg-amber-400",
    pulsa: true,
    Icon: Bell,
  },
  urgente: {
    bg: "from-amber-600/20 to-orange-600/10",
    borda: "border-amber-500/30",
    iconBg: "bg-amber-500/20",
    iconCor: "text-amber-300",
    dot: "bg-amber-400",
    pulsa: true,
    Icon: AlertTriangle,
  },
  vencida: {
    bg: "from-red-600/20 to-rose-600/10",
    borda: "border-red-500/30",
    iconBg: "bg-red-500/20",
    iconCor: "text-red-300",
    dot: "bg-red-400",
    pulsa: true,
    Icon: AlertTriangle,
  },
};

export default function AlertaFinn({ alertas }: AlertaFinnProps) {
  const [descartados, setDescartados] = useState<Set<number>>(new Set());

  const visiveis = alertas.filter((_, i) => !descartados.has(i));

  if (visiveis.length === 0) return null;

  return (
    <div className="mx-4 mt-3 space-y-2.5">
      <AnimatePresence>
        {visiveis.map((alerta, idx) => {
          const cfg = configTipo[alerta.tipo];
          const Icon = cfg.Icon;
          const originalIdx = alertas.indexOf(alerta);

          const inner = (
            <motion.div
              key={originalIdx}
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              className={`relative rounded-2xl border bg-gradient-to-br ${cfg.bg} ${cfg.borda} p-4 overflow-hidden`}
              style={{
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              {/* Glow interno */}
              <div
                className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
                style={{
                  background:
                    alerta.tipo === "vencida"
                      ? "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)"
                      : alerta.tipo === "pagamento_amanha"
                      ? "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)"
                      : "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
                }}
              />

              <div className="flex items-start gap-3">
                {/* Ícone */}
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-xl ${cfg.iconBg} flex items-center justify-center`}
                >
                  <Icon size={16} className={cfg.iconCor} />
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${cfg.pulsa ? "animate-pulse" : ""}`}
                    />
                    <p className="text-[11px] font-bold text-white/90 uppercase tracking-wide">
                      {alerta.titulo}
                    </p>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {alerta.mensagem}
                  </p>
                  {alerta.subtitulo && (
                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                      {alerta.subtitulo}
                    </p>
                  )}
                </div>

                {/* Fechar */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDescartados((prev) => new Set([...prev, originalIdx]));
                  }}
                  className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X size={12} className="text-white/40" />
                </button>
              </div>
            </motion.div>
          );

          return alerta.href ? (
            <Link key={originalIdx} href={alerta.href}>
              {inner}
            </Link>
          ) : (
            <div key={originalIdx}>{inner}</div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}