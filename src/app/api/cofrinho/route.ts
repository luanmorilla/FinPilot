// src/app/api/cofrinho/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type {
  MissaoDia,
  StreakInfo,
  ConquistaCofrinho,
  PrevisaoItem,
} from "@/app/(dashboard)/cofrinho/types";

// ─── helpers ──────────────────────────────────────────────────────────────

function calcularStreak(depositos: { createdAt: Date }[]): StreakInfo {
  if (depositos.length === 0) {
    return { diasSeguidos: 0, melhorStreak: 0, totalDias: 0, ultimoDeposito: null };
  }

  // agrupar por dia (YYYY-MM-DD) deduplicated
  const dias = [
    ...new Set(
      depositos.map((d) => d.createdAt.toISOString().slice(0, 10))
    ),
  ].sort((a, b) => b.localeCompare(a)); // mais recente primeiro

  const hoje = new Date().toISOString().slice(0, 10);
  const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // streak atual
  let streak = 0;
  let cursor =
    dias[0] === hoje || dias[0] === ontem ? new Date(dias[0]) : null;

  if (cursor) {
    for (const dia of dias) {
      const d = new Date(dia);
      const diff = Math.round(
        (cursor.getTime() - d.getTime()) / 86400000
      );
      if (diff === 0 || diff === 1) {
        streak++;
        cursor = d;
      } else {
        break;
      }
    }
  }

  // melhor streak histórico
  let melhor = 0;
  let temp = 1;
  for (let i = 1; i < dias.length; i++) {
    const prev = new Date(dias[i - 1]);
    const curr = new Date(dias[i]);
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) {
      temp++;
      if (temp > melhor) melhor = temp;
    } else {
      temp = 1;
    }
  }
  if (melhor === 0 && dias.length > 0) melhor = streak;

  return {
    diasSeguidos: streak,
    melhorStreak: Math.max(melhor, streak),
    totalDias: dias.length,
    ultimoDeposito: depositos[0].createdAt.toISOString(),
  };
}

function calcularConquistas(
  totalGuardado: number,
  streak: StreakInfo,
  conquistasDb: { titulo: string; conquistadaEm: Date }[]
): ConquistaCofrinho[] {
  const conquistadas = new Set(conquistasDb.map((c) => c.titulo));
  const encontrar = (titulo: string) =>
    conquistasDb.find((c) => c.titulo === titulo);

  const todas: ConquistaCofrinho[] = [
    {
      id: "primeira",
      titulo: "Primeira Economia",
      descricao: "Registrou seu primeiro depósito no cofrinho",
      emoji: "🌱",
      conquistada: totalGuardado > 0,
      conquistadaEm: encontrar("Primeira Economia")?.conquistadaEm.toISOString(),
    },
    {
      id: "7dias",
      titulo: "7 Dias Seguidos",
      descricao: "Manteve o hábito por uma semana completa",
      emoji: "🔥",
      conquistada: streak.melhorStreak >= 7 || conquistadas.has("7 Dias Seguidos"),
      conquistadaEm: encontrar("7 Dias Seguidos")?.conquistadaEm.toISOString(),
    },
    {
      id: "30dias",
      titulo: "30 Dias Seguidos",
      descricao: "Um mês inteiro de disciplina financeira",
      emoji: "🏆",
      conquistada: streak.melhorStreak >= 30 || conquistadas.has("30 Dias Seguidos"),
      conquistadaEm: encontrar("30 Dias Seguidos")?.conquistadaEm.toISOString(),
    },
    {
      id: "100reais",
      titulo: "Primeiros R$100",
      descricao: "Acumulou R$100 no cofrinho",
      emoji: "💯",
      conquistada: totalGuardado >= 100,
      conquistadaEm: encontrar("Primeiros R$100")?.conquistadaEm.toISOString(),
    },
    {
      id: "500reais",
      titulo: "Primeiros R$500",
      descricao: "Acumulou R$500 — consistência que gera resultado",
      emoji: "💎",
      conquistada: totalGuardado >= 500,
      conquistadaEm: encontrar("Primeiros R$500")?.conquistadaEm.toISOString(),
    },
    {
      id: "1000reais",
      titulo: "Primeiros R$1000",
      descricao: "Quatro dígitos de hábito financeiro sólido",
      emoji: "🚀",
      conquistada: totalGuardado >= 1000,
      conquistadaEm: encontrar("Primeiros R$1000")?.conquistadaEm.toISOString(),
    },
  ];

  return todas;
}

function calcularMissao(
  salario: number,
  totalDespesas: number,
  dividasAtrasadas: { nome: string }[],
  metasAtivas: { id: string; nome: string; valorAtual: number; valorTotal: number }[]
): MissaoDia {
  const saldoLivre = Math.max(salario - totalDespesas, 0);
  const sugestaoBase = saldoLivre * 0.03; // 3% do saldo livre

  // clamp em tiers
  let valorSugerido = 2;
  if (sugestaoBase >= 50) valorSugerido = 50;
  else if (sugestaoBase >= 20) valorSugerido = 20;
  else if (sugestaoBase >= 10) valorSugerido = 10;
  else if (sugestaoBase >= 5) valorSugerido = 5;
  else valorSugerido = 2;

  if (dividasAtrasadas.length > 0) {
    return {
      valorSugerido: Math.min(valorSugerido, 5),
      mensagem: `Antes de aumentar suas economias, recomendo priorizar a quitação da dívida "${dividasAtrasadas[0].nome}". Mas guardar pelo menos R$${Math.min(valorSugerido, 5)} mantém o hábito vivo.`,
      contexto: "divida_pendente",
      dividaAlerta: { nome: dividasAtrasadas[0].nome },
      metaRelacionada: null,
    };
  }

  if (metasAtivas.length > 0) {
    const meta = metasAtivas[0];
    const progresso = Math.min(
      (meta.valorAtual / meta.valorTotal) * 100,
      100
    );
    return {
      valorSugerido,
      mensagem: `Se guardar R$${valorSugerido} hoje, sua meta "${meta.nome}" ficará mais próxima. Você já está em ${progresso.toFixed(0)}% — continue!`,
      contexto: "meta_ativa",
      metaRelacionada: { id: meta.id, nome: meta.nome, progresso },
      dividaAlerta: null,
    };
  }

  const diasNoMes = 30;
  const projecao = (valorSugerido * diasNoMes).toFixed(0);

  return {
    valorSugerido,
    mensagem: `Hoje você pode guardar R$${valorSugerido} sem comprometer seu orçamento. Se mantiver esse ritmo, terá R$${projecao} ao final do mês.`,
    contexto: "normal",
    metaRelacionada: null,
    dividaAlerta: null,
  };
}

function calcularPrevisoes(
  totalAtual: number,
  mediaUltimos30: number
): PrevisaoItem[] {
  const media = mediaUltimos30 > 0 ? mediaUltimos30 : 5;
  return [
    { dias: 30, label: "30 dias", valor: totalAtual + media * 30 },
    { dias: 90, label: "3 meses", valor: totalAtual + media * 90 },
    { dias: 180, label: "6 meses", valor: totalAtual + media * 180 },
    { dias: 365, label: "1 ano", valor: totalAtual + media * 365 },
  ];
}

// ─── GET ──────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    const [cofrinhoRaw, perfil, dividas, metas, conquistasDb] =
      await Promise.all([
        prisma.cofrinho.findFirst({
          where: { userId },
          include: {
            depositos: { orderBy: { createdAt: "desc" } },
          },
        }),
        prisma.perfilFinanceiro.findUnique({ where: { userId } }),
        prisma.divida.findMany({
          where: { userId, paga: false },
          orderBy: { vencimento: "asc" },
        }),
        prisma.meta.findMany({
          where: { userId, status: "ATIVA" },
          orderBy: { createdAt: "asc" },
        }),
        prisma.conquista.findMany({ where: { userId } }),
      ]);

    const cofrinho = cofrinhoRaw
      ? {
          ...cofrinhoRaw,
          createdAt: cofrinhoRaw.createdAt.toISOString(),
          updatedAt: cofrinhoRaw.updatedAt.toISOString(),
          depositos: cofrinhoRaw.depositos.map((d) => ({
            ...d,
            createdAt: d.createdAt.toISOString(),
          })),
        }
      : null;

    const salario = perfil?.salario ?? 0;

    // total despesas não pagas no mês corrente
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const totalDespesas = dividas
      .filter((d) => new Date(d.vencimento) >= inicioMes)
      .reduce((s, d) => s + d.valor, 0);

    const dividasAtrasadas = dividas.filter(
      (d) => new Date(d.vencimento) < agora
    );

    const metasAtivas = metas.map((m) => ({
      id: m.id,
      nome: m.nome,
      valorAtual: m.valorAtual,
      valorTotal: m.valorTotal,
    }));

    const streak = calcularStreak(cofrinhoRaw?.depositos ?? []);
    const conquistas = calcularConquistas(
      cofrinhoRaw?.valorAtual ?? 0,
      streak,
      conquistasDb
    );
    const missao = calcularMissao(
      salario,
      totalDespesas,
      dividasAtrasadas.map((d) => ({ nome: d.nome })),
      metasAtivas
    );

    // média diária nos últimos 30 dias
    const limite30 = new Date(Date.now() - 30 * 86400000);
    const depositos30 = (cofrinhoRaw?.depositos ?? []).filter(
      (d) => d.createdAt >= limite30
    );
    const mediaUltimos30 =
      depositos30.length > 0
        ? depositos30.reduce((s, d) => s + d.valor, 0) / 30
        : missao.valorSugerido;

    const previsoes = calcularPrevisoes(
      cofrinhoRaw?.valorAtual ?? 0,
      mediaUltimos30
    );

    return NextResponse.json({
      cofrinho,
      missao,
      streak,
      conquistas,
      previsoes,
    });
  } catch (err) {
    console.error("[GET /api/cofrinho]", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const valor = Number(body.valor);
    const descricao: string | undefined = body.descricao;

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    // upsert cofrinho
    let cofrinho = await prisma.cofrinho.findFirst({ where: { userId } });

    if (!cofrinho) {
      cofrinho = await prisma.cofrinho.create({
        data: { userId, nome: "Meu Cofrinho", valorAtual: 0 },
      });
    }

    // depósito + atualiza valorAtual em transação
    const [, updated] = await prisma.$transaction([
      prisma.depositoCofrinho.create({
        data: {
          cofrinhoId: cofrinho.id,
          valor,
          descricao: descricao ?? null,
        },
      }),
      prisma.cofrinho.update({
        where: { id: cofrinho.id },
        data: { valorAtual: { increment: valor } },
        include: { depositos: { orderBy: { createdAt: "desc" } } },
      }),
    ]);

    // verificar e gravar conquistas novas
    const novasConquistas: { titulo: string; descricao: string; emoji: string }[] =
      [];

    const conquistasExistentes = await prisma.conquista.findMany({
      where: { userId },
      select: { titulo: true },
    });
    const titulosExistentes = new Set(conquistasExistentes.map((c) => c.titulo));

    if (updated.valorAtual >= 1 && !titulosExistentes.has("Primeira Economia")) {
      novasConquistas.push({
        titulo: "Primeira Economia",
        descricao: "Registrou seu primeiro depósito no cofrinho",
        emoji: "🌱",
      });
    }
    if (updated.valorAtual >= 100 && !titulosExistentes.has("Primeiros R$100")) {
      novasConquistas.push({
        titulo: "Primeiros R$100",
        descricao: "Acumulou R$100 no cofrinho",
        emoji: "💯",
      });
    }
    if (updated.valorAtual >= 500 && !titulosExistentes.has("Primeiros R$500")) {
      novasConquistas.push({
        titulo: "Primeiros R$500",
        descricao: "Acumulou R$500 — consistência que gera resultado",
        emoji: "💎",
      });
    }
    if (updated.valorAtual >= 1000 && !titulosExistentes.has("Primeiros R$1000")) {
      novasConquistas.push({
        titulo: "Primeiros R$1000",
        descricao: "Quatro dígitos de hábito financeiro sólido",
        emoji: "🚀",
      });
    }

    if (novasConquistas.length > 0) {
      await prisma.conquista.createMany({
        data: novasConquistas.map((c) => ({ ...c, userId })),
      });
    }

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      depositos: updated.depositos.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[POST /api/cofrinho]", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}