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

export default function AlertaFinn({ alertas }: AlertaFinnProps) {
  const [descartados, setDescartados] = useState<Set<number>>(new Set());
  const visiveis = alertas.filter((_, i) => !descartados.has(i));
  if (visiveis.length === 0) return null;

  return (
    <div style={{ margin: "12px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
      <AnimatePresence>
        {visiveis.map((alerta, idx) => {
          const originalIdx = alertas.indexOf(alerta);

          const isVencida = alerta.tipo === "vencida";
          const isHoje = alerta.tipo === "vencendo_hoje" || alerta.tipo === "urgente";
          const isPagamento = alerta.tipo === "pagamento_amanha";

          const bg = isVencida
            ? "linear-gradient(135deg, rgba(220,38,38,0.16) 0%, rgba(120,10,10,0.10) 100%)"
            : isHoje
            ? "linear-gradient(135deg, rgba(217,119,6,0.16) 0%, rgba(120,60,0,0.10) 100%)"
            : "linear-gradient(135deg, rgba(109,40,217,0.16) 0%, rgba(55,15,120,0.10) 100%)";

          const borderColor = isVencida
            ? "rgba(239,68,68,0.22)"
            : isHoje
            ? "rgba(245,158,11,0.22)"
            : "rgba(139,92,246,0.22)";

          const iconBg = isVencida
            ? "rgba(239,68,68,0.14)"
            : isHoje
            ? "rgba(245,158,11,0.14)"
            : "rgba(139,92,246,0.14)";

          const iconColor = isVencida ? "#fca5a5" : isHoje ? "#fcd34d" : "#c4b5fd";
          const dotColor = isVencida ? "#f87171" : isHoje ? "#f59e0b" : "#a78bfa";
          const glowColor = isVencida
            ? "rgba(239,68,68,0.12)"
            : isHoje
            ? "rgba(245,158,11,0.12)"
            : "rgba(139,92,246,0.12)";

          const Icon = isVencida ? AlertTriangle : isHoje ? Bell : Zap;
          const pulsa = isVencida || isHoje;

          const inner = (
            <motion.div
              key={originalIdx}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.28, delay: idx * 0.06 }}
              style={{
                position: "relative",
                borderRadius: 16,
                padding: 14,
                overflow: "hidden",
                background: bg,
                border: `1px solid ${borderColor}`,
                boxShadow: `0 2px 16px rgba(0,0,0,0.25)`,
              }}
            >
              {/* glow */}
              <div style={{
                position: "absolute", top: -24, right: -24,
                width: 80, height: 80, borderRadius: "50%", pointerEvents: "none",
                background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              }} />

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                {/* ícone */}
                <div style={{
                  flexShrink: 0, width: 34, height: 34, borderRadius: 10,
                  background: iconBg, color: iconColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={14} color={iconColor} />
                </div>

                {/* texto */}
                <div style={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: dotColor, flexShrink: 0,
                      animation: pulsa ? "pulse 2s infinite" : undefined,
                    }} />
                    <p style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                      textTransform: "uppercase", color: dotColor, margin: 0,
                    }}>
                      {alerta.titulo}
                    </p>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,0.82)", margin: 0 }}>
                    {alerta.mensagem}
                  </p>
                  {alerta.subtitulo && (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 4, margin: 0 }}>
                      {alerta.subtitulo}
                    </p>
                  )}
                </div>

                {/* fechar */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDescartados((prev) => new Set([...prev, originalIdx]));
                  }}
                  style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: 7,
                    background: "rgba(255,255,255,0.05)", border: "none",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <X size={10} color="rgba(255,255,255,0.35)" />
                </button>
              </div>
            </motion.div>
          );

          return alerta.href ? (
            <Link key={originalIdx} href={alerta.href} style={{ textDecoration: "none" }}>
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