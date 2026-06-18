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
    style: {
      background: "linear-gradient(135deg, rgba(109,40,217,0.18) 0%, rgba(76,29,149,0.10) 100%)",
      border: "1px solid rgba(139,92,246,0.25)",
      boxShadow: "0 4px 24px rgba(109,40,217,0.15)",
    },
    glowColor: "rgba(139,92,246,0.18)",
    iconStyle: { background: "rgba(139,92,246,0.2)", color: "#c4b5fd" } as React.CSSProperties,
    dotColor: "#a78bfa",
    pulsa: false,
    Icon: Zap,
  },
  vencendo_hoje: {
    style: {
      background: "linear-gradient(135deg, rgba(217,119,6,0.18) 0%, rgba(180,83,9,0.08) 100%)",
      border: "1px solid rgba(245,158,11,0.25)",
      boxShadow: "0 4px 24px rgba(217,119,6,0.12)",
    },
    glowColor: "rgba(245,158,11,0.18)",
    iconStyle: { background: "rgba(245,158,11,0.15)", color: "#fcd34d" } as React.CSSProperties,
    dotColor: "#f59e0b",
    pulsa: true,
    Icon: Bell,
  },
  urgente: {
    style: {
      background: "linear-gradient(135deg, rgba(217,119,6,0.18) 0%, rgba(180,83,9,0.08) 100%)",
      border: "1px solid rgba(245,158,11,0.25)",
      boxShadow: "0 4px 24px rgba(217,119,6,0.12)",
    },
    glowColor: "rgba(245,158,11,0.18)",
    iconStyle: { background: "rgba(245,158,11,0.15)", color: "#fcd34d" } as React.CSSProperties,
    dotColor: "#f59e0b",
    pulsa: true,
    Icon: AlertTriangle,
  },
  vencida: {
    style: {
      background: "linear-gradient(135deg, rgba(220,38,38,0.18) 0%, rgba(153,27,27,0.08) 100%)",
      border: "1px solid rgba(239,68,68,0.25)",
      boxShadow: "0 4px 24px rgba(220,38,38,0.15)",
    },
    glowColor: "rgba(239,68,68,0.18)",
    iconStyle: { background: "rgba(239,68,68,0.15)", color: "#fca5a5" } as React.CSSProperties,
    dotColor: "#f87171",
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
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: idx * 0.07 }}
              className="relative rounded-2xl p-4 overflow-hidden"
              style={cfg.style}
            >
              {/* Glow de canto */}
              <div
                className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${cfg.glowColor} 0%, transparent 70%)` }}
              />

              <div className="flex items-start gap-3">
                {/* Ícone */}
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={cfg.iconStyle}
                >
                  <Icon size={15} />
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.pulsa ? "animate-pulse" : ""}`}
                      style={{ background: cfg.dotColor }}
                    />
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.dotColor }}>
                      {alerta.titulo}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                    {alerta.mensagem}
                  </p>
                  {alerta.subtitulo && (
                    <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
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
                  className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <X size={11} style={{ color: "rgba(255,255,255,0.35)" }} />
                </button>
              </div>
            </motion.div>
          );

          return alerta.href ? (
            <Link key={originalIdx} href={alerta.href}>{inner}</Link>
          ) : (
            <div key={originalIdx}>{inner}</div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}