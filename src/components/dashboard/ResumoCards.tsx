"use client";

import { motion } from "framer-motion";
import { CreditCard, Target, PiggyBank, ChevronRight } from "lucide-react";
import Link from "next/link";

interface ResumoCardsProps {
  totalDividas: number;
  dividasVencendoEmBreve: number;
  totalMetas: number;
  metasPorcentagemMedia: number;
  totalCofrinho: number;
  metaCofrinhoMensal: number;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: value >= 10000 ? "compact" : "standard",
  }).format(value);
}

const cards = [
  {
    href: "/dividas",
    icon: CreditCard,
    label: "Dívidas",
    cor: "from-red-500/15 to-red-600/5",
    borda: "border-red-500/15",
    iconBg: "bg-red-500/15",
    iconCor: "text-red-400",
    getValue: (p: ResumoCardsProps) => formatBRL(p.totalDividas),
    getSubtitle: (p: ResumoCardsProps) =>
      p.dividasVencendoEmBreve > 0
        ? `${p.dividasVencendoEmBreve} vencendo em breve`
        : "Tudo em dia ✓",
    subtitleCor: (p: ResumoCardsProps) =>
      p.dividasVencendoEmBreve > 0 ? "text-amber-400" : "text-emerald-400",
  },
  {
    href: "/metas",
    icon: Target,
    label: "Metas",
    cor: "from-blue-500/15 to-blue-600/5",
    borda: "border-blue-500/15",
    iconBg: "bg-blue-500/15",
    iconCor: "text-blue-400",
    getValue: (p: ResumoCardsProps) =>
      `${p.metasPorcentagemMedia.toFixed(0)}%`,
    getSubtitle: (_: ResumoCardsProps) => "progresso médio",
    subtitleCor: () => "text-zinc-500",
  },
  {
    href: "/cofrinho",
    icon: PiggyBank,
    label: "Cofrinho",
    cor: "from-violet-500/15 to-violet-600/5",
    borda: "border-violet-500/15",
    iconBg: "bg-violet-500/15",
    iconCor: "text-violet-400",
    getValue: (p: ResumoCardsProps) => formatBRL(p.totalCofrinho),
    getSubtitle: (p: ResumoCardsProps) =>
      p.metaCofrinhoMensal > 0
        ? `Meta: ${formatBRL(p.metaCofrinhoMensal)}/mês`
        : "Sem meta mensal",
    subtitleCor: () => "text-zinc-500",
  },
];

export default function ResumoCards(props: ResumoCardsProps) {
  return (
    <div className="px-5 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-300">Visão geral</h2>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i + 0.3 }}
            >
              <Link href={card.href}>
                <div
                  className={`relative rounded-2xl border bg-gradient-to-br ${card.cor} ${card.borda} p-3.5 active:scale-95 transition-transform duration-150`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}
                  >
                    <Icon size={16} className={card.iconCor} />
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-0.5 font-medium">
                    {card.label}
                  </p>
                  <p className="text-sm font-bold text-white leading-tight">
                    {card.getValue(props)}
                  </p>
                  <p
                    className={`text-[9px] mt-1 leading-tight ${card.subtitleCor(props)}`}
                  >
                    {card.getSubtitle(props)}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}