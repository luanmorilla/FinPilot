"use client";
// src/app/(dashboard)/metas/MetasCharts.tsx

import { useMemo } from "react";
import { motion } from "framer-motion";
import { PieChart, LineChart } from "lucide-react";
import type { Goal } from "./types";
import { CATEGORY_CONFIG } from "./types";

interface Props {
  goals: Goal[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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

function buildConicGradient(dist: { cat: keyof typeof CATEGORY_CONFIG; pct: number }[]) {
  let acc = 0;
  const stops = dist.map((d) => {
    const start = acc;
    acc += d.pct;
    const color = CATEGORY_CONFIG[d.cat].color;
    return `${color} ${start}% ${acc}%`;
  });
  return stops.length > 0 ? `conic-gradient(${stops.join(", ")})` : "rgba(255,255,255,0.08)";
}

function useEvolution(goals: Goal[]) {
  return useMemo(() => {
    const contribs = goals
      .flatMap((g) => (g.contributions ?? []).map((c) => ({ date: new Date(c.createdAt), amount: c.amount })))
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
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString("pt-BR", { month: "short" });
      return { key, label, total };
    });
  }, [goals]);
}

export function MetasCharts({ goals }: Props) {
  const distribution = useDistribution(goals);
  const evolution = useEvolution(goals);

  const maxTotal = Math.max(...evolution.map((e) => e.total), 1);
  const points = evolution
    .map((e, i) => {
      const x = evolution.length > 1 ? (i / (evolution.length - 1)) * 280 : 140;
      const y = 100 - (e.total / maxTotal) * 90;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 mb-4">
          <LineChart size={15} className="text-[#a855f7]" />
          <p className="text-sm font-semibold text-white">Evolução das Metas</p>
        </div>
        {evolution.length === 0 ? (
          <p className="text-xs text-white/40 py-8 text-center">Adicione aportes para ver sua evolução aqui.</p>
        ) : (
          <div>
            <svg viewBox="0 0 280 100" className="w-full h-28" preserveAspectRatio="none">
              <defs>
                <linearGradient id="evoFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points={`0,100 ${points} 280,100`} fill="url(#evoFill)" stroke="none" />
              <polyline points={points} fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex justify-between mt-2 text-[10px] text-white/40">
              <span>{evolution[0]?.label}</span>
              <span>{evolution[evolution.length - 1]?.label}</span>
            </div>
            <p className="text-right text-sm font-bold text-[#a855f7] mt-1">
              {formatCurrency(evolution[evolution.length - 1]?.total ?? 0)}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 mb-4">
          <PieChart size={15} className="text-[#a855f7]" />
          <p className="text-sm font-semibold text-white">Distribuição das Metas</p>
        </div>
        {distribution.length === 0 ? (
          <p className="text-xs text-white/40 py-8 text-center">Crie metas para ver a distribuição aqui.</p>
        ) : (
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 shrink-0">
              <div className="w-full h-full rounded-full" style={{ background: buildConicGradient(distribution) }} />
              <div className="absolute inset-[18%] rounded-full flex items-center justify-center" style={{ background: "#13131a" }}>
                <span className="text-xs font-bold text-white">{distribution.length}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {distribution.slice(0, 5).map((d) => (
                <div key={d.cat} className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_CONFIG[d.cat].color }} />
                  <span className="text-xs text-white/70 truncate flex-1">{CATEGORY_CONFIG[d.cat].label}</span>
                  <span className="text-xs font-semibold text-white/50 shrink-0">{d.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}