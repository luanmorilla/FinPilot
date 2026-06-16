import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(
  req: Request,
  context: RouteContext
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    )
  }

  const { id } = await context.params
  const body = await req.json()

  const divida = await prisma.divida.updateMany({
    where: {
      id,
      userId: session.user.id,
    },
    data: body,
  })

  return NextResponse.json(divida)
}

export async function DELETE(
  _: Request,
  context: RouteContext
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    )
  }

  const { id } = await context.params

  await prisma.divida.deleteMany({
    where: {
      id,
      userId: session.user.id,
    },
  })

  return NextResponse.json({ ok: true })
}