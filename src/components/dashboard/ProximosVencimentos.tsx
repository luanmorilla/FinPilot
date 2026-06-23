"use client";

import { motion } from "framer-motion";
import { Clock, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Vencimento {
  id: string;
  nome: string;
  valor: number;
  dataVencimento: Date | string;
  categoria: string;
}

interface ProximosVencimentosProps {
  vencimentos: Vencimento[];
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getDiasRestantes(data: Date | string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(data);
  venc.setHours(0, 0, 0, 0);
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgenciaConfig(dias: number) {
  if (dias < 0)
    return {
      label: "Vencida!",
      cor: "text-red-400",
      bg: "bg-red-500/10",
      borda: "border-red-500/20",
      dot: "bg-red-400",
    };
  if (dias === 0)
    return {
      label: "Hoje!",
      cor: "text-red-400",
      bg: "bg-red-500/10",
      borda: "border-red-500/20",
      dot: "bg-red-400 animate-pulse",
    };
  if (dias <= 3)
    return {
      label: `${dias}d`,
      cor: "text-amber-400",
      bg: "bg-amber-500/10",
      borda: "border-amber-500/20",
      dot: "bg-amber-400",
    };
  if (dias <= 7)
    return {
      label: `${dias}d`,
      cor: "text-yellow-400",
      bg: "bg-yellow-500/10",
      borda: "border-yellow-500/20",
      dot: "bg-yellow-400",
    };
  return {
    label: `${dias}d`,
    cor: "text-zinc-500",
    bg: "bg-zinc-800/50",
    borda: "border-white/5",
    dot: "bg-zinc-600",
  };
}

function getMensagemJarvis(vencimentos: Vencimento[]): string | null {
  const urgentes = vencimentos.filter(
    (v) => getDiasRestantes(v.dataVencimento) <= 3
  );
  if (urgentes.length === 0) return null;
  if (urgentes.length === 1)
    return `Ei! ${urgentes[0].nome} vence em breve. Já separou o valor?`;
  return `Atenção! Você tem ${urgentes.length} contas vencendo em até 3 dias.`;
}

export default function ProximosVencimentos({
  vencimentos,
}: ProximosVencimentosProps) {
  const mensagemJarvis = getMensagemJarvis(vencimentos);
  const ordenados = [...vencimentos].sort(
    (a, b) =>
      new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="mx-5 mt-4"
    >
      {mensagemJarvis && (
        <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-3">
          <AlertCircle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-200 leading-relaxed">{mensagemJarvis}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-300">
            Próximos vencimentos
          </h2>
        </div>
        <Link href="/dividas">
          <span className="text-[10px] text-emerald-400 font-medium">
            Ver todos
          </span>
        </Link>
      </div>

      {ordenados.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-zinc-800/30 p-6 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-sm font-medium text-white mb-1">Tudo em dia!</p>
          <p className="text-xs text-zinc-500">
            Nenhum vencimento nos próximos dias.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {ordenados.slice(0, 5).map((item, i) => {
            const dias = getDiasRestantes(item.dataVencimento);
            const urg = getUrgenciaConfig(dias);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.5 }}
              >
                <Link href="/dividas">
                  <div
                    className={`flex items-center gap-3 rounded-xl border ${urg.borda} ${urg.bg} p-3.5 active:scale-[0.98] transition-transform`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${urg.dot}`} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.nome}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {item.categoria}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-white">
                        {formatBRL(item.valor)}
                      </p>
                      <p className={`text-[10px] font-medium mt-0.5 ${urg.cor}`}>
                        {urg.label}
                      </p>
                    </div>

                    <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}