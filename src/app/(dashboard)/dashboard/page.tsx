import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardHeader from "@/components/layout/DashboardHeader";
import SaudoCard from "@/components/dashboard/SaudoCard";
import SaldoRealCard from "@/components/dashboard/SaldoRealCard";
import ResumoCards from "@/components/dashboard/ResumoCards";
import FluxoChart from "@/components/dashboard/FluxoChart";
import ProximosVencimentos from "@/components/dashboard/ProximosVencimentos";

// ─── helpers ────────────────────────────────────────────────────────────────

function calcularSaudeFinanceira(percentual: number) {
  if (percentual < 50) return "otima" as const;
  if (percentual < 70) return "boa" as const;
  if (percentual < 90) return "atencao" as const;
  return "critica" as const;
}

function gerarMensagemJarvis(
  firstName: string,
  saude: "otima" | "boa" | "atencao" | "critica",
  dividasVencendo: number,
  saldoReal: number,
  temDividas: boolean,
  temMetas: boolean,
  temCofrinho: boolean
): { mensagem: string; detalhe?: string } {

  if (!temDividas && !temMetas && !temCofrinho) {
    return {
      mensagem: `${firstName}, que bom ter você aqui! Vamos começar organizando suas finanças.`,
      detalhe: "Cadastre suas dívidas, metas e cofrinho para eu te ajudar melhor.",
    }
  }

  if (saude === "critica") {
    return {
      mensagem: `${firstName}, preciso da sua atenção. Seus gastos estão comprometendo quase toda a sua renda.`,
      detalhe: "Vamos revisar suas dívidas e cortar o que for possível juntos.",
    }
  }
  if (saude === "atencao") {
    if (dividasVencendo > 0) {
      return {
        mensagem: `${firstName}, você tem ${dividasVencendo} conta${dividasVencendo > 1 ? "s" : ""} vencendo em breve. Melhor se preparar!`,
        detalhe: "Seu saldo ainda aguenta, mas vamos ficar de olho.",
      }
    }
    return {
      mensagem: `${firstName}, suas finanças estão controladas mas há espaço para melhorar.`,
    }
  }
  if (saude === "boa") {
    return {
      mensagem: `${firstName}, você está indo bem! Suas contas estão organizadas. 💪`,
      detalhe: "Continue assim e logo você alcança a saúde financeira ideal.",
    }
  }
  return {
    mensagem: `${firstName}, suas finanças estão ótimas! Continue no caminho certo. 🚀`,
  }
}

function getUltimosSeisMeses(): string[] {
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const agora = new Date();
  const resultado = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    resultado.push(meses[d.getMonth()]);
  }
  return resultado;
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [perfil, dividas, metas, cofrinho, transacoes, alertas] =
    await Promise.all([
      prisma.perfilFinanceiro.findUnique({ where: { userId } }),
      prisma.divida.findMany({
        where: { userId, paga: false },
        orderBy: { vencimento: "asc" },
      }),
      prisma.meta.findMany({
        where: { userId, concluida: false },
      }),
      prisma.cofrinho.findFirst({ where: { userId } }),
      prisma.transacao.findMany({
        where: {
          userId,
          data: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
        orderBy: { data: "asc" },
      }),
      prisma.alerta.findMany({
        where: { userId, lido: false },
        take: 20,
      }),
    ]);

  const receita = perfil?.salario ?? 0;
  const totalDividas = dividas.reduce((acc, d) => acc + d.valor, 0);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em7Dias = new Date();
  em7Dias.setDate(hoje.getDate() + 7);

  const dividasVencendoEmBreve = dividas.filter((d) => {
    const venc = new Date(d.vencimento);
    venc.setHours(0, 0, 0, 0);
    return venc >= hoje && venc <= em7Dias;
  }).length;

  const totalCofrinhoValor = cofrinho?.valorAtual ?? 0;
  const metaCofrinhoMensal = cofrinho?.valorMeta ?? 0;

  const metasPorcentagemMedia =
    metas.length > 0
      ? metas.reduce((acc, m) => {
          const pct = m.valorTotal > 0 ? (m.valorAtual / m.valorTotal) * 100 : 0;
          return acc + pct;
        }, 0) / metas.length
      : 0;

  const totalComprometido = totalDividas + totalCofrinhoValor;
  const saldoDisponivel = receita - totalComprometido;
  const percentualComprometido =
    receita > 0 ? (totalComprometido / receita) * 100 : 0;

  const saude = calcularSaudeFinanceira(percentualComprometido);
  const firstName = (session.user.name ?? "").split(" ")[0] || "você";

  const { mensagem, detalhe } = gerarMensagemJarvis(
    firstName,
    saude,
    dividasVencendoEmBreve,
    saldoDisponivel,
    dividas.length > 0,
    metas.length > 0,
    cofrinho !== null
  );

  const mesesLabels = getUltimosSeisMeses();
  const agora = new Date();
  const dadosFluxo = mesesLabels.map((mes, i) => {
    const mesIdx = (agora.getMonth() - (5 - i) + 12) % 12;
    const anoRef =
      agora.getFullYear() - (agora.getMonth() - (5 - i) < 0 ? 1 : 0);

    const transacoesMes = transacoes.filter((t) => {
      const d = new Date(t.data);
      return d.getMonth() === mesIdx && d.getFullYear() === anoRef;
    });

    const receitaMes = transacoesMes
      .filter((t) => t.tipo === "RECEITA")
      .reduce((acc, t) => acc + t.valor, 0);

    const gastoMes = transacoesMes
      .filter((t) => t.tipo === "DESPESA")
      .reduce((acc, t) => acc + t.valor, 0);

    return {
      mes,
      receita: receitaMes || (i === 5 ? receita : 0),
      gasto: gastoMes,
    };
  });

  const proximosVencimentos = dividas.map((d) => ({
    id: d.id,
    nome: d.nome,
    valor: d.valor,
    dataVencimento: d.vencimento,
    categoria: String(d.categoria ?? "Outros"),
  }));

  return (
    <div className="flex flex-col pb-6">
      <DashboardHeader
        alertasNaoLidos={alertas.length}
        userName={session.user.name ?? undefined}
        userImage={session.user.image ?? undefined}
      />

      <SaudoCard
        saudeFinanceira={saude}
        mensagem={mensagem}
        detalhe={detalhe}
      />

      <SaldoRealCard
        saldoDisponivel={saldoDisponivel}
        receita={receita}
        totalComprometido={totalComprometido}
      />

      <ResumoCards
        totalDividas={totalDividas}
        dividasVencendoEmBreve={dividasVencendoEmBreve}
        totalMetas={metas.length}
        metasPorcentagemMedia={metasPorcentagemMedia}
        totalCofrinho={totalCofrinhoValor}
        metaCofrinhoMensal={metaCofrinhoMensal}
      />

      <FluxoChart dados={dadosFluxo} />

      <ProximosVencimentos vencimentos={proximosVencimentos} />
    </div>
  );
}