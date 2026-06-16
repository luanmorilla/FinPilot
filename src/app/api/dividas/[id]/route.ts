import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()

  const divida = await prisma.divida.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: body,
  })

  return NextResponse.json(divida)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  await prisma.divida.deleteMany({
    where: { id: params.id, userId: session.user.id },
  })

  return NextResponse.json({ ok: true })
}