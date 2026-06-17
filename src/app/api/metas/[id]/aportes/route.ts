import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { StatusMeta } from "@prisma/client"
import { serializeMeta, calcularPrevisao } from "../../_lib"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()
    const { amount, note } = body

    const amountNum = Number(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Valor do aporte inválido" }, { status: 400 })
    }

    const meta = await prisma.meta.findFirst({
      where: { id, userId: session.user.id },
      include: { depositos: true },
    })
    if (!meta) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 })
    }

    await prisma.depositoMeta.create({
      data: { metaId: id, valor: amountNum, nota: note || null },
    })

    const novoValorAtual = meta.valorAtual + amountNum
    const novoStatus = novoValorAtual >= meta.valorTotal ? StatusMeta.CONCLUIDA : meta.status
    const todosDepositos = [...meta.depositos, { valor: amountNum, createdAt: new Date() }]

    const atualizada = await prisma.meta.update({
      where: { id },
      data: {
        valorAtual: novoValorAtual,
        status: novoStatus,
        concluida: novoStatus === StatusMeta.CONCLUIDA,
        dataPrevista: calcularPrevisao(
          { valorAtual: novoValorAtual, valorTotal: meta.valorTotal, createdAt: meta.createdAt },
          todosDepositos
        ),
      },
      include: { depositos: true },
    })

    return NextResponse.json(serializeMeta(atualizada), { status: 201 })
  } catch (err) {
    console.error("[POST /api/metas/:id/aportes]", err)
    return NextResponse.json({ error: "Erro interno ao registrar aporte" }, { status: 500 })
  }
}