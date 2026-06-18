import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DividasClient from "./DividasClient";

export default async function DividasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [dividas, perfil] = await Promise.all([
    prisma.divida.findMany({
      where: { userId: session.user.id },
      orderBy: { vencimento: "asc" },
    }),
    prisma.perfilFinanceiro.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  return (
    <DividasClient
      salario={perfil?.salario ?? 0}
      dividas={dividas.map((d) => ({
        id: d.id,
        nome: d.nome,
        valor: d.valor,
        vencimento: d.vencimento.toISOString(),
        paga: d.paga,
        categoria: String(d.categoria ?? "Outros"),
        recorrente: d.recorrente,
      }))}
    />
  );
}