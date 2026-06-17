import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { StatusMeta } from "@prisma/client"
import { serializeMeta, toCategoriaMeta, toPrioridade } from "./_lib"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const metas = await prisma.meta.findMany({
      where: { userId: session.user.id },
      include: { depositos: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(metas.map(serializeMeta))
  } catch (err) {
    console.error("[GET /api/metas]", err)
    return NextResponse.json({ error: "Erro interno ao buscar metas" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, category, priority, targetAmount, currentAmount, targetDate } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nome da meta é obrigatório" }, { status: 400 })
    }
    const targetNum = Number(targetAmount)
    if (isNaN(targetNum) || targetNum <= 0) {
      return NextResponse.json({ error: "Valor objetivo inválido" }, { status: 400 })
    }
    const currentNum = Number(currentAmount) || 0

    const meta = await prisma.meta.create({
      data: {
        userId: session.user.id,
        nome: name.trim(),
        descricao: description || null,
        categoria: toCategoriaMeta(category),
        prioridade: toPrioridade(priority),
        valorTotal: targetNum,
        valorAtual: currentNum,
        prazo: targetDate ? new Date(targetDate) : null,
        status: StatusMeta.ATIVA,
      },
      include: { depositos: true },
    })

    return NextResponse.json(serializeMeta(meta), { status: 201 })
  } catch (err) {
    console.error("[POST /api/metas]", err)
    return NextResponse.json({ error: "Erro interno ao criar meta" }, { status: 500 })
  }
}