"use client";
// src/app/(dashboard)/metas/MetasCharts.tsx

import { useMemo, useId } from "react";
import { motion } from "framer-motion";
import { PieChart, LineChart } from "lucide-react";
import type { Goal } from "./types";
import { CATEGORY_CONFIG } from "./types";

interface Props {
  goals: Goal[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function useDistribution(goals: Goal[]) {
  return useMemo(() => {
    const map = new Map<string, number>();
    goals.forEach((g) => {
      map.set(g.category, (map.get(g.category) ?? 0) + g.currentAmount);
    });
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return Array.from(map.entries())
      .map(([cat, val]) => ({
        cat: cat as keyof typeof CATEGORY_CONFIG,
        val,
        pct: total > 0 ? (val / total) * 100 : 0,
      }))
      .sort((a, b) => b.val - a.val);
  }, [goals]);
}

function buildConicGradient(
  dist: { cat: keyof typeof CATEGORY_CONFIG; pct: number }[]
) {
  let acc = 0;
  const stops = dist.map((d) => {
    const start = acc;
    acc += d.pct;
    const color = CATEGORY_CONFIG[d.cat].color;
    return `${color} ${start.toFixed(2)}% ${acc.toFixed(2)}%`;
  });
  return stops.length > 0
    ? `conic-gradient(${stops.join(", ")})`
    : "rgba(255,255,255,0.08)";
}

function useEvolution(goals: Goal[]) {
  return useMemo(() => {
    const contribs = goals
      .flatMap((g) =>
        (g.contributions ?? []).map((c) => ({
          date: new Date(c.createdAt),
          amount: c.amount,
        }))
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (contribs.length === 0) return [];

    const monthly = new Map<string, number>();
    let running = 0;
    for (const c of contribs) {
      running += c.amount;
      const key = `${c.date.getFullYear()}-${String(c.date.getMonth() + 1).padStart(2, "0")}`;
      monthly.set(key, running);
    }

    return Array.from(monthly.entries()).map(([key, total]) => {
      const [y, m] = key.split("-");
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString(
        "pt-BR",
        { month: "short" }
      );
      return { key, label, total };
    });
  }, [goals]);
}

// Converte pontos de evolução em path SVG suavizado (curva cúbica)
function buildSmoothPath(
  evolution: { total: number }[],
  width: number,
  height: number,
  padding: number
): string {
  if (evolution.length === 0) return "";

  const maxVal = Math.max(...evolution.map((e) => e.total), 1);
  const pts    = evolution.map((e, i) => ({
    x: evolution.length === 1
      ? width / 2
      : padding + (i / (evolution.length - 1)) * (width - padding * 2),
    y: padding + (1 - e.total / maxVal) * (height - padding * 2),
  }));

  if (pts.length === 1) {
    // Ponto único: desenha um círculo via arc
    const { x, y } = pts[0];
    return `M ${x - 4},${y} a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0`;
  }

  // Curva cúbica de Bezier entre pontos
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpX  = (prev.x + curr.x) / 2;
    d += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
  }
  return d;
}

function buildFillPath(
  evolution: { total: number }[],
  width: number,
  height: number,
  padding: number
): string {
  if (evolution.length === 0) return "";

  const maxVal = Math.max(...evolution.map((e) => e.total), 1);
  const pts    = evolution.map((e, i) => ({
    x: evolution.length === 1
      ? width / 2
      : padding + (i / (evolution.length - 1)) * (width - padding * 2),
    y: padding + (1 - e.total / maxVal) * (height - padding * 2),
  }));

  if (pts.length === 1) return "";

  let d = `M ${pts[0].x},${height}`;
  d    += ` L ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpX  = (prev.x + curr.x) / 2;
    d += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
  }
  d += ` L ${pts[pts.length - 1].x},${height} Z`;
  return d;
}

export function MetasCharts({ goals }: Props) {
  const distribution = useDistribution(goals);
  const evolution    = useEvolution(goals);

  // ID único por instância — evita conflito de gradiente SVG entre múltiplos charts
  const uid        = useId().replace(/:/g, "");
  const gradientId = `evoFill_${uid}`;

  const SVG_W   = 280;
  const SVG_H   = 100;
  const PADDING = 8;

  const linePath = buildSmoothPath(evolution, SVG_W, SVG_H, PADDING);
  const fillPath = buildFillPath(evolution, SVG_W, SVG_H, PADDING);
  const isSinglePoint = evolution.length === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {/* Evolução */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <LineChart size={15} className="text-[#a855f7]" />
          <p className="text-sm font-semibold text-white">Evolução das Metas</p>
        </div>

        {evolution.length === 0 ? (
          <p className="text-xs text-white/40 py-8 text-center">
            Adicione aportes para ver sua evolução aqui.
          </p>
        ) : (
          <div>
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full h-28"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#a855f7" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0"    />
                </linearGradient>
              </defs>

              {/* Área preenchida (só com múltiplos pontos) */}
              {!isSinglePoint && fillPath && (
                <path d={fillPath} fill={`url(#${gradientId})`} stroke="none" />
              )}

              {/* Linha / círculo */}
              <path
                d={linePath}
                fill={isSinglePoint ? "#a855f7" : "none"}
                stroke={isSinglePoint ? "none" : "#a855f7"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Ponto final destacado (múltiplos pontos) */}
              {!isSinglePoint && evolution.length > 0 && (() => {
                const maxVal = Math.max(...evolution.map((e) => e.total), 1);
                const last   = evolution[evolution.length - 1];
                const x = PADDING + ((evolution.length - 1) / (evolution.length - 1)) * (SVG_W - PADDING * 2);
                const y = PADDING + (1 - last.total / maxVal) * (SVG_H - PADDING * 2);
                return (
                  <>
                    <circle cx={x} cy={y} r={4}  fill="#13131a" stroke="#a855f7" strokeWidth="2" />
                    <circle cx={x} cy={y} r={2}  fill="#a855f7" />
                  </>
                );
              })()}
            </svg>

            <div className="flex justify-between mt-2 text-[10px] text-white/40">
              <span>{evolution[0]?.label}</span>
              {evolution.length > 1 && (
                <span>{evolution[evolution.length - 1]?.label}</span>
              )}
            </div>
            <p className="text-right text-sm font-bold text-[#a855f7] mt-1">
              {formatCurrency(evolution[evolution.length - 1]?.total ?? 0)}
            </p>
          </div>
        )}
      </div>

      {/* Distribuição */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <PieChart size={15} className="text-[#a855f7]" />
          <p className="text-sm font-semibold text-white">Distribuição das Metas</p>
        </div>

        {distribution.length === 0 ? (
          <p className="text-xs text-white/40 py-8 text-center">
            Crie metas para ver a distribuição aqui.
          </p>
        ) : (
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 shrink-0">
              <div
                className="w-full h-full rounded-full"
                style={{ background: buildConicGradient(distribution) }}
              />
              <div
                className="absolute inset-[18%] rounded-full flex items-center justify-center"
                style={{ background: "#13131a" }}
              >
                <span className="text-xs font-bold text-white">
                  {distribution.length}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {distribution.slice(0, 5).map((d) => (
                <div key={d.cat} className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: CATEGORY_CONFIG[d.cat].color }}
                  />
                  <span className="text-xs text-white/70 truncate flex-1">
                    {CATEGORY_CONFIG[d.cat].label}
                  </span>
                  <span className="text-xs font-semibold text-white/50 shrink-0">
                    {d.pct.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}