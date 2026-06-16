import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CategoriaDivida, Prioridade } from "@prisma/client"
import { NextResponse } from "next/server"

// ─── Mapa label UI → enum Prisma ────────────────────────────────────────────
const CATEGORIA_MAP: Record<string, CategoriaDivida> = {
  "Moradia":     CategoriaDivida.MORADIA,
  "Alimentação": CategoriaDivida.ALIMENTACAO,
  "Transporte":  CategoriaDivida.TRANSPORTE,
  "Saúde":       CategoriaDivida.SAUDE,
  "Educação":    CategoriaDivida.EDUCACAO,
  "Lazer":       CategoriaDivida.LAZER,
  "Cartão":      CategoriaDivida.CARTAO_CREDITO,
  "Assinatura":  CategoriaDivida.SERVICOS,
  "Outros":      CategoriaDivida.OUTROS,
}

// Mapa reverso: enum Prisma → label UI (para serializar a resposta)
const CATEGORIA_LABEL: Record<CategoriaDivida, string> = {
  MORADIA:        "Moradia",
  ALIMENTACAO:    "Alimentação",
  TRANSPORTE:     "Transporte",
  SAUDE:          "Saúde",
  EDUCACAO:       "Educação",
  LAZER:          "Lazer",
  CARTAO_CREDITO: "Cartão",
  SERVICOS:       "Assinatura",
  OUTROS:         "Outros",
  EMPRESTIMO:     "Outros",
}

function toCategoria(raw: string | undefined): CategoriaDivida {
  if (!raw) return CategoriaDivida.OUTROS
  // já veio como enum (ex: vindo do banco numa edição futura)
  if (Object.values(CategoriaDivida).includes(raw as CategoriaDivida)) {
    return raw as CategoriaDivida
  }
  return CATEGORIA_MAP[raw] ?? CategoriaDivida.OUTROS
}

function serializeDivida(d: {
  id: string
  nome: string
  valor: number
  vencimento: Date
  paga: boolean
  categoria: CategoriaDivida
  recorrente: boolean
  prioridade: Prioridade
  observacao: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
}) {
  return {
    ...d,
    vencimento: d.vencimento.toISOString(),
    categoria: CATEGORIA_LABEL[d.categoria] ?? "Outros",
  }
}

// ─── GET /api/dividas ────────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const dividas = await prisma.divida.findMany({
      where: { userId: session.user.id },
      orderBy: [{ paga: "asc" }, { vencimento: "asc" }],
    })

    return NextResponse.json(dividas.map(serializeDivida))
  } catch (err) {
    console.error("[GET /api/dividas]", err)
    return NextResponse.json({ error: "Erro interno ao buscar dívidas" }, { status: 500 })
  }
}

// ─── POST /api/dividas ───────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { nome, valor, vencimento, categoria, recorrente, prioridade, observacao } = body

    // Validação
    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }
    const valorNum = typeof valor === "number" ? valor : parseFloat(String(valor).replace(/\./g, "").replace(",", "."))
    if (isNaN(valorNum) || valorNum <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 })
    }
    if (!vencimento) {
      return NextResponse.json({ error: "Vencimento é obrigatório" }, { status: 400 })
    }
    const vencimentoDate = new Date(vencimento)
    if (isNaN(vencimentoDate.getTime())) {
      return NextResponse.json({ error: "Data de vencimento inválida" }, { status: 400 })
    }

    const prioridadeEnum: Prioridade =
      prioridade && Object.values(Prioridade).includes(prioridade)
        ? prioridade
        : Prioridade.MEDIA

    const divida = await prisma.divida.create({
      data: {
        userId:     session.user.id,
        nome:       nome.trim(),
        valor:      valorNum,
        vencimento: vencimentoDate,
        categoria:  toCategoria(categoria),
        recorrente: Boolean(recorrente),
        prioridade: prioridadeEnum,
        observacao: observacao ?? null,
        paga:       false,
      },
    })

    return NextResponse.json(serializeDivida(divida), { status: 201 })
  } catch (err) {
    console.error("[POST /api/dividas]", err)
    return NextResponse.json({ error: "Erro interno ao criar dívida" }, { status: 500 })
  }
}