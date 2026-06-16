import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const dividas = await prisma.divida.findMany({
    where: { userId: session.user.id },
    orderBy: { vencimento: "asc" },
  })

  return NextResponse.json(dividas)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const { nome, valor, vencimento, categoria, recorrente } = body

  if (!nome || !valor || !vencimento) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  const divida = await prisma.divida.create({
    data: {
      userId: session.user.id,
      nome,
      valor: parseFloat(valor),
      vencimento: new Date(vencimento),
      categoria: categoria ?? "Outros",
      recorrente: recorrente ?? false,
      paga: false,
    },
  })

  return NextResponse.json({
    ...divida,
    vencimento: divida.vencimento.toISOString(),
    categoria: String(divida.categoria ?? "Outros"),
  })
}