"use client";
// src/app/(dashboard)/metas/useMetas.ts

import { useState, useEffect, useCallback } from "react";
import type { Goal, GoalStats } from "./types";

function computeStats(goals: Goal[]): GoalStats {
  const active = goals.filter((g) => g.status === "ACTIVE");
  const completed = goals.filter((g) => g.status === "COMPLETED");
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  // nearest = highest progress % among active
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

export function useMetas() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/metas");
      if (!res.ok) throw new Error("Erro ao buscar metas");
      const data = await res.json();
      setGoals(data);
      setError(null);
    } catch (err) {
      setError("Não foi possível carregar as metas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const stats = computeStats(goals);

  return { goals, stats, isLoading, error, mutate: fetchGoals };
}