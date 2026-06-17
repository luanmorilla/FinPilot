"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Plus,
  TrendingUp,
  Trophy,
  Zap,
  BarChart3,
} from "lucide-react";
import type { Goal, GoalStats } from "./types";
import { GoalCard } from "./GoalCard";
import { GoalFormModal } from "./GoalFormModal";
import { ContributionModal } from "./ContributionModal";
import { GoalDetailModal } from "./GoalDetailModal";
import { FinnInsights } from "./FinnInsights";
import { MetasStats } from "./MetasStats";
import { MetasCharts } from "./MetasCharts";
import { EmptyMetas } from "./EmptyMetas";
import { MetasSkeleton } from "./MetasSkeleton";
import { useMetas } from "./useMetas";

const FILTER_OPTIONS = [
  { value: "ALL", label: "Todas" },
  { value: "ACTIVE", label: "Ativas" },
  { value: "COMPLETED", label: "Concluídas" },
  { value: "PAUSED", label: "Pausadas" },
];

export default function MetasClient() {
  const { goals, stats, isLoading, mutate } = useMetas();
  const [filter, setFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);

  const filteredGoals = goals.filter((g) =>
    filter === "ALL" ? true : g.status === filter
  );

  const handleGoalCreated = useCallback(
    (goal: Goal) => {
      mutate();
      setShowCreateModal(false);
    },
    [mutate]
  );

  const handleContributionAdded = useCallback(() => {
    mutate();
    setContributionGoal(null);
  }, [mutate]);

  const handleGoalUpdated = useCallback(() => {
    mutate();
    setSelectedGoal(null);
    setDetailGoal(null);
  }, [mutate]);

  const handleOpenContribution = useCallback((goal: Goal) => {
    setContributionGoal(goal);
  }, []);

  const handleOpenDetail = useCallback((goal: Goal) => {
    setDetailGoal(goal);
  }, []);

  if (isLoading) return <MetasSkeleton />;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Target size={24} className="text-[#a855f7]" />
              Metas
            </h1>
            <p className="text-sm text-white/50 mt-0.5">
              Planeje seus objetivos financeiros
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              boxShadow: "0 6px 24px rgba(168,85,247,0.35)",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Nova Meta
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        {goals.length > 0 && <MetasStats stats={stats} />}

        {/* Finn Insights */}
        {goals.length > 0 && <FinnInsights goals={goals} stats={stats} />}

        {/* Filter Tabs */}
        {goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 overflow-x-auto pb-1"
          >
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  filter === opt.value
                    ? "text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
                style={
                  filter === opt.value
                    ? {
                        background: "rgba(168,85,247,0.2)",
                        border: "1px solid rgba(168,85,247,0.4)",
                      }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid transparent" }
                }
              >
                {opt.label}
                {opt.value !== "ALL" && (
                  <span className="ml-1.5 text-xs opacity-60">
                    ({goals.filter((g) => g.status === opt.value).length})
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <EmptyMetas onCreateClick={() => setShowCreateModal(true)} />
        ) : filteredGoals.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Target size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhuma meta com esse filtro</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredGoals.map((goal, i) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  index={i}
                  onAddContribution={() => handleOpenContribution(goal)}
                  onViewDetail={() => handleOpenDetail(goal)}
                  onEdit={() => setSelectedGoal(goal)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Charts - only show when there are goals */}
        {goals.length > 1 && <MetasCharts goals={goals} />}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <GoalFormModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleGoalCreated}
          />
        )}
        {selectedGoal && (
          <GoalFormModal
            goal={selectedGoal}
            onClose={() => setSelectedGoal(null)}
            onSuccess={handleGoalUpdated}
          />
        )}
        {contributionGoal && (
          <ContributionModal
            goal={contributionGoal}
            onClose={() => setContributionGoal(null)}
            onSuccess={handleContributionAdded}
          />
        )}
        {detailGoal && (
          <GoalDetailModal
            goal={detailGoal}
            onClose={() => setDetailGoal(null)}
            onAddContribution={() => {
              setContributionGoal(detailGoal);
              setDetailGoal(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}