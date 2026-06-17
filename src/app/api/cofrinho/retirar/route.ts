// src/app/api/cofrinho/retirar/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { avaliarMotivoRetirada } from "../_lib-retirada";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const valor = Number(body.valor);
    const motivo: string = typeof body.motivo === "string" ? body.motivo : "";
    const confirmado: boolean = body.confirmado === true;

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const cofrinho = await prisma.cofrinho.findFirst({ where: { userId } });
    if (!cofrinho) {
      return NextResponse.json({ error: "Cofrinho não encontrado" }, { status: 404 });
    }

    if (valor > cofrinho.valorAtual) {
      return NextResponse.json(
        { error: "Valor maior que o total guardado" },
        { status: 400 }
      );
    }

    const avaliacao = avaliarMotivoRetirada(motivo, valor);

    // Se não libera direto e ainda não foi confirmado pelo usuário,
    // retorna só a avaliação do Finn — sem mexer no saldo ainda.
    if (!avaliacao.liberaDireto && !confirmado) {
      return NextResponse.json({
        liberado: false,
        avaliacao,
      });
    }

    // Libera a retirada: decrementa valorAtual e registra no histórico
    // como um depósito de valor negativo (mantém o histórico unificado).
    const [, updated] = await prisma.$transaction([
      prisma.depositoCofrinho.create({
        data: {
          cofrinhoId: cofrinho.id,
          valor: -valor,
          descricao: motivo ? `Retirada: ${motivo}` : "Retirada",
        },
      }),
      prisma.cofrinho.update({
        where: { id: cofrinho.id },
        data: { valorAtual: { decrement: valor } },
        include: { depositos: { orderBy: { createdAt: "desc" } } },
      }),
    ]);

    return NextResponse.json({
      liberado: true,
      avaliacao,
      cofrinho: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        depositos: updated.depositos.map((d) => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    console.error("[POST /api/cofrinho/retirar]", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}