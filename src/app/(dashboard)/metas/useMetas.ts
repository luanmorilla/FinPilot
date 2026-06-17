"use client";
// src/app/(dashboard)/metas/useMetas.ts

import { useState, useEffect, useCallback, useRef } from "react";
import type { Goal, GoalStats } from "./types";

const MAX_RETRIES  = 3;
const RETRY_DELAY  = 2000; // ms

function computeStats(goals: Goal[]): GoalStats {
  const active    = goals.filter((g) => g.status === "ACTIVE");
  const completed = goals.filter((g) => g.status === "COMPLETED");
  const totalSaved  = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount,  0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  // Meta mais próxima = maior percentual de progresso entre as ativas
  const nearestGoal =
    active.length > 0
      ? active.reduce((best, g) =>
          g.currentAmount / g.targetAmount > best.currentAmount / best.targetAmount
            ? g
            : best
        )
      : null;

  return {
    totalGoals: goals.length,
    activeGoals: active.length,
    completedGoals: completed.length,
    totalSaved,
    totalTarget,
    overallProgress,
    nearestGoal,
  };
}

async function fetchWithRetry(
  url: string,
  retries: number = MAX_RETRIES
): Promise<Goal[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as Goal[];
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
    }
  }
  // TypeScript: nunca alcançado, mas necessário para tipagem
  throw new Error("Falha ao buscar metas");
}

export function useMetas() {
  const [goals, setGoals]       = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Evita atualizar estado após desmontagem do componente
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchWithRetry("/api/metas");

      if (!mountedRef.current) return;
      setGoals(data);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as metas"
      );
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Update otimista: atualiza a lista local imediatamente
  // sem precisar aguardar um refetch completo
  const updateGoalLocally = useCallback((updated: Goal) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === updated.id ? updated : g))
    );
  }, []);

  const removeGoalLocally = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const addGoalLocally = useCallback((goal: Goal) => {
    setGoals((prev) => [...prev, goal]);
  }, []);

  const stats = computeStats(goals);

  return {
    goals,
    stats,
    isLoading,
    error,
    mutate: fetchGoals,
    updateGoalLocally,
    removeGoalLocally,
    addGoalLocally,
  };
}