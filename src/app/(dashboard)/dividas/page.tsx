import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DividasClient from "./DividasClient";

export default async function DividasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dividas = await prisma.divida.findMany({
    where: { userId: session.user.id },
    orderBy: { vencimento: "asc" },
  });

  return (
    <DividasClient
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