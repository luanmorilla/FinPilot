// src/app/api/user/onboarding/route.ts
// Salva os dados do onboarding no banco

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { onboardingSchema } from "@/lib/validations"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = onboardingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { salario, frequenciaPagamento, diaFixo, diasPagamento } = parsed.data

    const perfil = await prisma.perfilFinanceiro.upsert({
      where: { userId: session.user.id },
      update: {
        salario,
        frequenciaPagamento,
        diaFixo,
        diasPagamento: diasPagamento ?? [],
        onboardingCompleto: true,
      },
      create: {
        userId: session.user.id,
        salario,
        frequenciaPagamento,
        diaFixo,
        diasPagamento: diasPagamento ?? [],
        onboardingCompleto: true,
      },
    })

    return NextResponse.json({ perfil }, { status: 200 })
  } catch (error) {
    console.error("[ONBOARDING_ERROR]", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}