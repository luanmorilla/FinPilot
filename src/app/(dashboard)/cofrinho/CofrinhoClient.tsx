"use client";
// src/app/(dashboard)/cofrinho/CofrinhoClient.tsx

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, AlertCircle, Plus, Target } from "lucide-react";
import { useCofrinho } from "./useCofrinho";
import { PiggyHero } from "./PiggyHero";
import { MissaoCard } from "./MissaoCard";
import { StreakCard } from "./StreakCard";
import { ConquistasCard } from "./ConquistasCard";
import { PrevisaoCard } from "./PrevisaoCard";
import { HistoricoCard } from "./HistoricoCard";
import { FinnCofrinhoInsights } from "./FinnCofrinhoInsights";

function jaDepositouHoje(depositos: { createdAt: string }[]): boolean {
  if (depositos.length === 0) return false;
  const hoje = new Date().toISOString().slice(0, 10);
  return depositos[0].createdAt.slice(0, 10) === hoje;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[200, 160, 140, 120, 100].map((h, i) => (
        <div
          key={i}
          className="rounded-3xl"
          style={{
            height: h,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyCofrinho({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-6 rounded-3xl relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px dashed rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.08) 0%, transparent 70%)",
        }}
      />
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="text-6xl mb-4"
      >
        🐷
      </motion.div>
      <p className="text-white font-bold text-lg">
        Todo grande patrimônio começa com a primeira moeda.
      </p>
      <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
        Registre seu primeiro hábito de guardar dinheiro e deixe o Finn te guiar
        nessa jornada.
      </p>
      <motion.button
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        onClick={onStart}
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white"
        style={{
          background: "linear-gradient(135deg, #a855f7, #7c3aed)",
          boxShadow: "0 8px 28px rgba(168,85,247,0.4)",
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Começar Agora
      </motion.button>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CofrinhoClient() {
  const { data, isLoading, error, isDepositing, depositSuccess, depositar, refetch } =
    useCofrinho();

  const [celebrating, setCelebrating] = useState(false);

  // Disparar celebração ao depositar com sucesso
  useEffect(() => {
    if (depositSuccess) {
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 2000);
      return () => clearTimeout(t);
    }
  }, [depositSuccess]);

  const handleDepositar = async (valor: number, descricao?: string) => {
    return depositar(valor, descricao);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-[#0a0a0f] text-white"
        style={{ paddingBottom: 100 }}
      >
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="h-7 w-40 rounded-xl bg-white/5 mb-2" />
            <div className="h-4 w-56 rounded-lg bg-white/4" />
          </div>
          <Skeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center"
        style={{ paddingBottom: 100 }}
      >
        <div className="text-center px-6">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Não foi possível carregar</p>
          <p className="text-white/40 text-sm mb-5">{error}</p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}
          >
            <RefreshCw size={15} />
            Tentar novamente
          </motion.button>
        </div>
      </div>
    );
  }

  const primeiroUso = !data?.cofrinho || data.cofrinho.depositos.length === 0;
  const depositos = data?.cofrinho?.depositos ?? [];
  const depositouHoje = jaDepositouHoje(depositos);

  return (
    <div
      className="min-h-screen bg-[#0a0a0f] text-white"
      style={{ paddingBottom: 100 }}
    >
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <h1 className="text-2xl font-black text-white">🐷 Cofrinho do Finn</h1>
          <p className="text-white/45 text-sm mt-0.5">
            Pequenas economias criam grandes resultados.
          </p>
        </motion.div>

        {/* Hero do porquinho */}
        {data && (
          <PiggyHero
            totalGuardado={data.cofrinho?.valorAtual ?? 0}
            celebrating={celebrating}
          />
        )}

        {/* Estado vazio */}
        <AnimatePresence>
          {primeiroUso && data && (
            <EmptyCofrinho
              onStart={() => data && depositar(data.missao.valorSugerido, "Primeiro depósito 🌱")}
            />
          )}
        </AnimatePresence>

        {/* Conteúdo principal */}
        {data && !primeiroUso && (
          <>
            {/* Missão do dia */}
            <MissaoCard
              missao={data.missao}
              onDepositar={handleDepositar}
              isDepositing={isDepositing}
              depositSuccess={depositSuccess}
              jaDepositouHoje={depositouHoje}
            />

            {/* Insights do Finn */}
            <FinnCofrinhoInsights data={data} />

            {/* Streak */}
            <StreakCard streak={data.streak} />

            {/* Conquistas */}
            <ConquistasCard conquistas={data.conquistas} />

            {/* Previsão */}
            <PrevisaoCard
              previsoes={data.previsoes}
              valorAtual={data.cofrinho?.valorAtual ?? 0}
            />

            {/* Histórico */}
            <HistoricoCard depositos={depositos} />
          </>
        )}

        {/* Se tem cofrinho mas primeiroUso ainda mostra missão */}
        {data && primeiroUso && data.cofrinho && (
          <MissaoCard
            missao={data.missao}
            onDepositar={handleDepositar}
            isDepositing={isDepositing}
            depositSuccess={depositSuccess}
            jaDepositouHoje={false}
          />
        )}
      </div>
    </div>
  );
}