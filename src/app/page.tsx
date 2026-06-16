import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function HomePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const perfil = await prisma.perfilFinanceiro.findUnique({
    where: { userId: session.user.id },
  })

  if (!perfil) {
    redirect("/onboarding")
  }

  redirect("/dashboard")
}