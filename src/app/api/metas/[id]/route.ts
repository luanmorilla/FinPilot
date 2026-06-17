import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { StatusMeta } from "@prisma/client"
import { serializeMeta, toCategoriaMeta, toPrioridade, toStatusMeta, calcularPrevisao } from "../_lib"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()
    const { name, description, category, priority, targetAmount, currentAmount, targetDate, status } = body

    const existing = await prisma.meta.findFirst({
      where: { id, userId: session.user.id },
      include: { depositos: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 })
    }

    const targetNum = targetAmount !== undefined ? Number(targetAmount) : existing.valorTotal
    const currentNum = currentAmount !== undefined ? Number(currentAmount) : existing.valorAtual

    let novoStatus = status ? toStatusMeta(status) : existing.status
    if (currentNum >= targetNum && novoStatus !== StatusMeta.PAUSADA) {
      novoStatus = StatusMeta.CONCLUIDA
    } else if (novoStatus === StatusMeta.CONCLUIDA && currentNum < targetNum) {
      novoStatus = StatusMeta.ATIVA
    }

    const atualizada = await prisma.meta.update({
      where: { id },
      data: {
        nome: name?.trim() ?? existing.nome,
        descricao: description !== undefined ? description || null : existing.descricao,
        categoria: category ? toCategoriaMeta(category) : existing.categoria,
        prioridade: priority ? toPrioridade(priority) : existing.prioridade,
        valorTotal: targetNum,
        valorAtual: currentNum,
        prazo: targetDate !== undefined ? (targetDate ? new Date(targetDate) : null) : existing.prazo,
        status: novoStatus,
        concluida: novoStatus === StatusMeta.CONCLUIDA,
        dataPrevista: calcularPrevisao(
          { valorAtual: currentNum, valorTotal: targetNum, createdAt: existing.createdAt },
          existing.depositos
        ),
      },
      include: { depositos: true },
    })

    return NextResponse.json(serializeMeta(atualizada))
  } catch (err) {
    console.error("[PUT /api/metas/:id]", err)
    return NextResponse.json({ error: "Erro interno ao atualizar meta" }, { status: 500 })
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await context.params

    await prisma.meta.deleteMany({
      where: { id, userId: session.user.id },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[DELETE /api/metas/:id]", err)
    return NextResponse.json({ error: "Erro interno ao excluir meta" }, { status: 500 })
  }
}