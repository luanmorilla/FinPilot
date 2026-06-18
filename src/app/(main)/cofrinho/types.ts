// src/app/(dashboard)/cofrinho/types.ts

export interface DepositoCofrinho {
    id: string;
    cofrinhoId: string;
    valor: number;
    descricao?: string | null;
    createdAt: string;
  }
  
  export interface Cofrinho {
    id: string;
    userId: string;
    nome: string;
    valorAtual: number;
    valorMeta?: number | null;
    createdAt: string;
    updatedAt: string;
    depositos: DepositoCofrinho[];
  }
  
  export interface MissaoDia {
    valorSugerido: number;
    mensagem: string;
    contexto: "normal" | "divida_pendente" | "meta_ativa" | "folga";
    metaRelacionada?: {
      id: string;
      nome: string;
      progresso: number;
    } | null;
    dividaAlerta?: {
      nome: string;
    } | null;
  }
  
  export interface StreakInfo {
    diasSeguidos: number;
    melhorStreak: number;
    totalDias: number;
    ultimoDeposito: string | null;
  }
  
  export interface ConquistaCofrinho {
    id: string;
    titulo: string;
    descricao: string;
    emoji: string;
    conquistada: boolean;
    conquistadaEm?: string | null;
  }
  
  export interface PrevisaoItem {
    dias: number;
    label: string;
    valor: number;
  }
  
  export interface CofrinhoData {
    cofrinho: Cofrinho | null;
    missao: MissaoDia;
    streak: StreakInfo;
    conquistas: ConquistaCofrinho[];
    previsoes: PrevisaoItem[];
  }