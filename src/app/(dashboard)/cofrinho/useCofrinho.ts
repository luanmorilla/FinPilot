"use client";
// src/app/(dashboard)/cofrinho/useCofrinho.ts

import { useState, useEffect, useCallback } from "react";
import type { CofrinhoData, Cofrinho } from "./types";

const RETRY_DELAYS = [2000, 4000, 6000];

export interface AvaliacaoRetirada {
  nivel: "emergencia" | "importante" | "duvidoso" | "nao_urgente";
  liberaDireto: boolean;
  mensagemFinn: string;
}

interface RetirarResult {
  liberado: boolean;
  avaliacao: AvaliacaoRetirada;
  cofrinho?: Cofrinho;
}

export function useCofrinho() {
  const [data, setData] = useState<CofrinhoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchData = useCallback(async (attempt = 0): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/cofrinho");
      if (!res.ok) throw new Error("Erro ao carregar cofrinho");

      const json = await res.json();
      setData(json);
    } catch (err) {
      if (attempt < RETRY_DELAYS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        return fetchData(attempt + 1);
      }
      setError(
        err instanceof Error ? err.message : "Não foi possível carregar o cofrinho"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const depositar = useCallback(
    async (valor: number, descricao?: string): Promise<boolean> => {
      setIsDepositing(true);
      setDepositSuccess(false);
      try {
        const res = await fetch("/api/cofrinho", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valor, descricao }),
        });
        if (!res.ok) throw new Error("Erro ao registrar depósito");

        const updated: Cofrinho = await res.json();

        // update otimista local
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            cofrinho: updated,
            streak: {
              ...prev.streak,
              diasSeguidos: prev.streak.diasSeguidos + 1,
              totalDias: prev.streak.totalDias + 1,
              ultimoDeposito: new Date().toISOString(),
            },
          };
        });

        setDepositSuccess(true);
        setTimeout(() => setDepositSuccess(false), 3000);

        // refetch para atualizar conquistas e previsões
        setTimeout(() => fetchData(), 1000);
        return true;
      } catch {
        return false;
      } finally {
        setIsDepositing(false);
      }
    },
    [fetchData]
  );

  // Avalia/processa retirada. Se confirmado=false e o Finn julgar que não é
  // urgente, retorna a avaliação sem mexer no saldo (pra UI mostrar a
  // mensagem do Finn e pedir confirmação extra). Se confirmado=true ou for
  // emergência/importante, libera direto e atualiza o saldo.
  const retirar = useCallback(
    async (valor: number, motivo: string, confirmado = false): Promise<RetirarResult> => {
      setIsWithdrawing(true);
      try {
        const res = await fetch("/api/cofrinho/retirar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valor, motivo, confirmado }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json?.error ?? "Erro ao processar retirada");
        }

        const json: RetirarResult = await res.json();

        if (json.liberado && json.cofrinho) {
          setData((prev) => {
            if (!prev) return prev;
            return { ...prev, cofrinho: json.cofrinho! };
          });
          setTimeout(() => fetchData(), 1000);
        }

        return json;
      } catch (err) {
        return {
          liberado: false,
          avaliacao: {
            nivel: "duvidoso",
            liberaDireto: false,
            mensagemFinn:
              err instanceof Error ? err.message : "Não consegui processar a retirada agora.",
          },
        };
      } finally {
        setIsWithdrawing(false);
      }
    },
    [fetchData]
  );

  return {
    data,
    isLoading,
    error,
    isDepositing,
    depositSuccess,
    isWithdrawing,
    depositar,
    retirar,
    refetch: fetchData,
  };
}