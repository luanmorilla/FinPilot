import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { TipoTransacao } from "@prisma/client"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    const userId = session.user.id

    const perfil = await prisma.perfilFinanceiro.findUnique({ where: { userId } })
    const salario = perfil?.salario ?? 0

    const tresMesesAtras = new Date()
    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3)

    const despesas = await prisma.transacao.findMany({
      where: { userId, tipo: TipoTransacao.DESPESA, data: { gte: tresMesesAtras } },
      select: { valor: true },
    })
    const despesaMediaMensal = despesas.length > 0
      ? despesas.reduce((s, d) => s + d.valor, 0) / 3
      : 0

    const dividasRecorrentes = await prisma.divida.findMany({
      where: { userId, recorrente: true, paga: false },
      select: { valor: true },
    })
    const dividaMensal = dividasRecorrentes.reduce((s, d) => s + d.valor, 0)

    const sobraMensal = Math.max(salario - despesaMediaMensal - dividaMensal, 0)

    return NextResponse.json({ salario, despesaMediaMensal, dividaMensal, sobraMensal })
  } catch (err) {
    console.error("[GET /api/metas/situacao-financeira]", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}