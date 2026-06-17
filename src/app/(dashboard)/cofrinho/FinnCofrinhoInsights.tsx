"use client";
// src/app/(dashboard)/cofrinho/FinnCofrinhoInsights.tsx

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X } from "lucide-react";
import type { CofrinhoData } from "./types";

interface Props {
  data: CofrinhoData;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FinnCofrinhoInsights({ data }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const insights = useMemo(() => {
    const list: { id: string; texto: string }[] = [];

    const total = data.cofrinho?.valorAtual ?? 0;
    const streak = data.streak.diasSeguidos;
    const totalDias = data.streak.totalDias;

    if (streak >= 7) {
      list.push({
        id: "streak7",
        texto: `Você está há ${streak} dias seguidos guardando dinheiro. Isso é disciplina real — continue!`,
      });
    }

    if (streak >= 3 && streak < 7) {
      list.push({
        id: "streak3",
        texto: `${streak} dias seguidos! Sua sequência está crescendo. Mantenha o hábito amanhã também.`,
      });
    }

    if (total >= 100) {
      list.push({
        id: "cem",
        texto: `Você já registrou mais de R$${total.toFixed(0)} guardados. Pequenas economias somadas criam grandes resultados.`,
      });
    }

    if (totalDias >= 10) {
      list.push({
        id: "10dias",
        texto: `Em ${totalDias} dias de uso, você já desenvolveu um hábito financeiro consistente. Isso tem mais valor que qualquer valor pontual.`,
      });
    }

    if (data.missao.contexto === "divida_pendente") {
      list.push({
        id: "divida",
        texto: `Você tem dívidas pendentes. Manter o hábito de guardar, mesmo pouco, é importante — mas quitar dívidas vem primeiro.`,
      });
    }

    if (data.missao.contexto === "meta_ativa" && data.missao.metaRelacionada) {
      list.push({
        id: "meta",
        texto: `Sua meta "${data.missao.metaRelacionada.nome}" está em ${data.missao.metaRelacionada.progresso.toFixed(0)}%. Cada real guardado te aproxima dela.`,
      });
    }

    // Insights genéricos sempre presentes
    list.push({
      id: "gen1",
      texto: "Guardar R$5 por dia equivale a R$1.825 em um ano. Consistência supera valor.",
    });
    list.push({
      id: "gen2",
      texto: "Seu comportamento financeiro está evoluindo. O hábito é mais importante que o valor.",
    });
    list.push({
      id: "gen3",
      texto: "Mesmo pequenas economias repetidas geram resultados que grandes esforços pontuais não conseguem.",
    });

    return shuffle(list);
  }, [
    data.cofrinho?.valorAtual,
    data.streak.diasSeguidos,
    data.streak.totalDias,
    data.missao.contexto,
    data.missao.metaRelacionada,
  ]);

  const visibles = insights.filter((i) => !dismissed.has(i.id)).slice(0, 3);

  if (visibles.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(168,85,247,0.15)",
            border: "1px solid rgba(168,85,247,0.3)",
          }}
        >
          <Bot size={15} className="text-[#a855f7]" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#a855f7]">
          Finn diz
        </p>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {visibles.map((insight, i) => (
            <motion.div
              key={insight.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-2.5 p-3 rounded-2xl relative"
              style={{
                background: "rgba(168,85,247,0.06)",
                border: "1px solid rgba(168,85,247,0.12)",
              }}
            >
              <span className="text-[#a855f7] text-xs mt-0.5 flex-shrink-0">🤖</span>
              <p className="text-white/65 text-sm leading-relaxed flex-1">
                {insight.texto}
              </p>
              <button
                onClick={() =>
                  setDismissed((prev) => new Set([...prev, insight.id]))
                }
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={11} className="text-white/30" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}