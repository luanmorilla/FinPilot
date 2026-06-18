import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  Prioridade,
  TipoTransacao,
  type Divida,
  type Meta,
  type Cofrinho,
  type Transacao,
  type Conquista,
  type PerfilFinanceiro,
} from "@prisma/client";

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface Contexto {
  dividas: Divida[];
  metas: Meta[];
  cofrinhos: Cofrinho[];
  transacoes: Transacao[];
  conquistas: Conquista[];
  perfil: PerfilFinanceiro | null;
  primeiroNome: string;
}

// Cada intenção é uma função que retorna string (bateu) ou null (não bateu).
// O motor executa TODAS e concatena as que retornaram algo.
type Intencao = (msg: string, ctx: DadosDerivados, ultimoAssunto?: string) => string | null;

// Dados pré-calculados passados para todas as intenções
interface DadosDerivados {
  raw: Contexto;
  salario: number;
  saudacaoNome: string;
  pendentes: Divida[];
  vencidas: Divida[];
  venceSemana: Divida[];
  totalPendente: number;
  dividasOrdenadas: Divida[];
  proxima: Divida | undefined;
  totalGuardado: number;
  totalMetas: number;
  metasAtivas: Meta[];
  metasAtrasadas: Meta[];
  receitas30: number;
  despesas30: number;
  saldo30: number;
  transacoes30: Transacao[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function containsAny(msg: string, ...termos: string[]): boolean {
  return termos.some((t) => msg.includes(normalize(t)));
}

function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

function diasRestantes(data: Date): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(data);
  alvo.setHours(0, 0, 0, 0);
  return Math.ceil((alvo.getTime() - hoje.getTime()) / 86_400_000);
}

function percentual(atual: number, total: number): string {
  if (total <= 0) return "0%";
  return `${((atual / total) * 100).toFixed(1)}%`;
}

function labelPrazo(dias: number): string {
  if (dias < 0)
    return `venceu há ${Math.abs(dias)} dia${Math.abs(dias) > 1 ? "s" : ""}`;
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  return `vence em ${dias} dias`;
}

function pesoPrioridade(p: Prioridade): number {
  return p === Prioridade.ALTA ? 0 : p === Prioridade.MEDIA ? 1 : 2;
}

// ─── Sinônimos ────────────────────────────────────────────────────────────────

const SINONIMOS_DIVIDA = [
  "divida", "dívida", "devendo", "debito", "débito", "boleto",
  "parcela", "prestacao", "prestação", "endividado", "quitar", "devo",
  "contas a pagar",
];

// "conta" sozinha é ambígua (pode ser conta bancária), então só entra
// em conjunto com outros sinais — tratado nas intenções individualmente.

const SINONIMOS_META = [
  "meta", "objetivo", "sonho", "planejamento", "planejar",
  "economizando para", "juntar para", "guardar para",
];

const SINONIMOS_COFRINHO = [
  "cofrinho", "guardar dinheiro", "economizar", "poupança", "poupanca",
  "guardar", "economizando",
];

// "reserva" é tratada separadamente pois tem intenção própria (emergência)

const SINONIMOS_GASTO = [
  "gastando", "gastos", "despesa", "despesas", "onde estou gastando",
  "onde gasto", "meus gastos", "quanto gastei",
];

const SINONIMOS_SALDO = [
  "saldo", "sobrou", "quanto tenho", "quanto sobrou", "disponivel",
  "disponível", "dinheiro disponivel",
];

const SINONIMOS_SAUDE = [
  "saude financeira", "saúde financeira", "score financeiro",
  "como estou financeiramente", "minha situacao financeira",
];

const SINONIMOS_ANALISE = [
  "analisar", "analise", "análise", "resumo financeiro",
  "diagnostico financeiro", "diagnóstico financeiro",
  "minha situacao", "resumo",
];

const SINONIMOS_PLANO = [
  "plano financeiro", "plano de 30", "me organize", "como melhorar",
  "como organizar", "organizar financas", "organizar finanças",
];

// ─── Pré-cálculo de dados derivados ──────────────────────────────────────────

function derivar(ctx: Contexto): DadosDerivados {
  const { dividas, metas, cofrinhos, transacoes, perfil, primeiroNome } = ctx;
  const salario = perfil?.salario ?? 0;
  const saudacaoNome = primeiroNome ? `, ${primeiroNome}` : "";

  const pendentes = dividas.filter((d) => !d.paga);
  const vencidas = pendentes.filter((d) => diasRestantes(d.vencimento) < 0);
  const venceSemana = pendentes.filter((d) => {
    const dd = diasRestantes(d.vencimento);
    return dd >= 0 && dd <= 7;
  });
  const totalPendente = pendentes.reduce((a, d) => a + d.valor, 0);

  const dividasOrdenadas = [...pendentes].sort((a, b) => {
    const da = diasRestantes(a.vencimento);
    const db = diasRestantes(b.vencimento);
    if (da !== db) return da - db;
    return pesoPrioridade(a.prioridade) - pesoPrioridade(b.prioridade);
  });
  const proxima = dividasOrdenadas[0];

  const totalGuardado = cofrinhos.reduce((a, c) => a + c.valorAtual, 0);
  const totalMetas = metas.reduce((a, m) => a + m.valorAtual, 0);

  const metasAtivas = metas.filter((m) => m.status === "ATIVA");
  const metasAtrasadas = metasAtivas.filter(
    (m) => m.prazo && diasRestantes(m.prazo) < 0
  );

  const agora = new Date();
  const ha30Dias = new Date(agora.getTime() - 30 * 86_400_000);
  const transacoes30 = transacoes.filter((t) => t.data >= ha30Dias);
  const receitas30 = transacoes30
    .filter((t) => t.tipo === TipoTransacao.RECEITA)
    .reduce((a, t) => a + t.valor, 0);
  const despesas30 = transacoes30
    .filter((t) => t.tipo === TipoTransacao.DESPESA)
    .reduce((a, t) => a + t.valor, 0);
  const saldo30 = receitas30 - despesas30;

  return {
    raw: ctx,
    salario,
    saudacaoNome,
    pendentes,
    vencidas,
    venceSemana,
    totalPendente,
    dividasOrdenadas,
    proxima,
    totalGuardado,
    totalMetas,
    metasAtivas,
    metasAtrasadas,
    receitas30,
    despesas30,
    saldo30,
    transacoes30,
  };
}

// ─── Intenções individuais ────────────────────────────────────────────────────
// Cada função recebe (msg normalizada, dados derivados) e retorna string | null.
// Retornar null significa "não sou responsável por essa mensagem".
// Retornar string significa "aqui está minha parte da resposta".
// O motor executa TODAS e concatena as que retornaram algo — assim uma única
// mensagem pode acionar múltiplas intenções ao mesmo tempo.

// ── [I1] Saudação ─────────────────────────────────────────────────────────────
// Exclusiva: se for saudação pura, não combina com nada mais.
const intencaoSaudacao: Intencao = (msg, d) => {
  const eSaudacao =
    containsAny(msg, "bom dia", "boa tarde", "boa noite") ||
    /^(oi|ola|opa|eae|e ai|salve|hey|hi)\b/.test(msg);
  if (!eSaudacao) return null;

  const nivel = d.raw.perfil?.nivelFinanceiro ?? "BRONZE";
  return (
    `Oi${d.saudacaoNome}! 👋 Sou o Finn, seu copiloto financeiro.\n` +
    `Nível atual: **${nivel}** com **${d.raw.perfil?.pontos ?? 0} pontos**.\n\n` +
    `Posso te ajudar com dívidas, metas, cofrinho, análise de gastos ou um diagnóstico completo. O que você quer ver?`
  );
};

// ── [I2] Despedida ────────────────────────────────────────────────────────────
const intencaoDespedida: Intencao = (msg) => {
  if (!containsAny(msg, "obrigad", "valeu", "tchau", "ate mais", "ate logo", "flw", "falou"))
    return null;
  return "De nada! Tô por aqui sempre que precisar. 💜";
};

// ── [I3] Identidade ───────────────────────────────────────────────────────────
const intencaoIdentidade: Intencao = (msg) => {
  if (
    !containsAny(
      msg,
      "quem e voce", "quem e vc", "quem e o finn",
      "o que voce faz", "o que vc faz",
      "como voce funciona", "como vc funciona",
      "me ajuda em que"
    )
  )
    return null;

  return (
    "Eu sou o **Finn**, seu assistente financeiro pessoal. 🤖\n\n" +
    "Consigo te ajudar com:\n" +
    "• Prioridade de pagamento de dívidas\n" +
    "• Progresso e acompanhamento de metas\n" +
    "• Análise de gastos por categoria\n" +
    "• Cofrinho e reserva de emergência\n" +
    "• Score de saúde financeira\n" +
    "• Plano personalizado para os próximos 30 dias\n" +
    "• Diagnóstico completo da sua situação\n\n" +
    "Só perguntar!"
  );
};

// ── [I4] Conquistas ───────────────────────────────────────────────────────────
const intencaoConquistas: Intencao = (msg, d) => {
  if (!containsAny(msg, "conquista", "medalha", "badge")) return null;

  const { conquistas } = d.raw;
  if (conquistas.length === 0)
    return "Você ainda não tem conquistas desbloqueadas. Continue usando o app e elas vão aparecer! 🏆";

  const lista = conquistas
    .slice(0, 5)
    .map((c) => `${c.emoji} **${c.titulo}** — ${c.descricao}`)
    .join("\n");

  return (
    `Você tem **${conquistas.length} conquista${conquistas.length > 1 ? "s" : ""}** desbloqueada${conquistas.length > 1 ? "s" : ""}! 🏆\n\n${lista}` +
    (conquistas.length > 5 ? `\n\n…e mais ${conquistas.length - 5}.` : "")
  );
};

// ── [I5] Dívida específica pelo nome ─────────────────────────────────────────
const intencaoDividaEspecifica: Intencao = (msg, d) => {
  const citada = d.raw.dividas.find(
    (div) =>
      msg.includes(normalize(div.nome)) &&
      containsAny(msg, ...SINONIMOS_DIVIDA, "quanto", "valor", "venc", "status", "esta")
  );
  if (!citada) return null;

  if (citada.paga) return `A dívida **"${citada.nome}"** já está paga. ✅`;

  const dias = diasRestantes(citada.vencimento);
  return (
    `**"${citada.nome}"**\n` +
    `• Categoria: ${citada.categoria}\n` +
    `• Valor: ${formatBRL(citada.valor)}\n` +
    `• Prazo: ${labelPrazo(dias)}\n` +
    `• Prioridade: ${citada.prioridade}\n` +
    `• Recorrente: ${citada.recorrente ? "Sim" : "Não"}`
  );
};

// ── [I6] Dívidas vencidas ─────────────────────────────────────────────────────
const intencaoDividasVencidas: Intencao = (msg, d) => {
  if (!containsAny(msg, "atrasad", "vencid", "em atraso")) return null;

  const { vencidas } = d;
  if (vencidas.length === 0)
    return "Boa notícia: você não tem nenhuma dívida vencida. ✅";

  const lista = vencidas
    .map((div) => `• ${div.nome} — ${formatBRL(div.valor)} (${labelPrazo(diasRestantes(div.vencimento))})`)
    .join("\n");

  return (
    `Você tem **${vencidas.length} dívida${vencidas.length > 1 ? "s" : ""} vencida${vencidas.length > 1 ? "s" : ""}**:\n\n${lista}\n\n` +
    `⚠️ Resolva essa${vencidas.length > 1 ? "s" : ""} antes das demais para evitar juros.`
  );
};

// ── [I7] Próximos vencimentos ─────────────────────────────────────────────────
const intencaoProximosVencimentos: Intencao = (msg, d) => {
  if (
    !containsAny(
      msg,
      "essa semana", "proximos dias", "proximos vencimentos",
      "proximo vencimento", "o que vence logo", "vence em breve"
    )
  )
    return null;

  const { venceSemana } = d;
  if (venceSemana.length === 0)
    return "Nenhuma dívida vence nos próximos 7 dias. Tranquilo por agora. 🙂";

  const lista = venceSemana
    .map((div) => `• ${div.nome} — ${formatBRL(div.valor)} (${labelPrazo(diasRestantes(div.vencimento))})`)
    .join("\n");

  return `Nos próximos 7 dias vencem:\n\n${lista}`;
};

// ── [I8] Prioridade de pagamento ──────────────────────────────────────────────
const intencaoPrioridade: Intencao = (msg, d) => {
  if (
    !containsAny(
      msg,
      "prioridade", "pagar primeiro", "qual divida pagar",
      "devo pagar qual", "por onde comeco", "qual quitar",
      "divida mais urgente", "qual e a mais urgente"
    )
  )
    return null;

  const { proxima, dividasOrdenadas } = d;
  if (!proxima) return "Você não tem dívidas pendentes — pode focar 100% em metas e reserva. 🎉";

  const top3 = dividasOrdenadas.slice(0, 3);
  const lista = top3
    .map(
      (div, i) =>
        `${i + 1}. **${div.nome}** — ${formatBRL(div.valor)} (${labelPrazo(diasRestantes(div.vencimento))}, prioridade ${div.prioridade})`
    )
    .join("\n");

  return (
    `Sua ordem de pagamento recomendada:\n\n${lista}\n\n` +
    `Comece pela **"${proxima.nome}"** — ela combina vencimento próximo e prioridade ${proxima.prioridade.toLowerCase()}.`
  );
};

// ── [I9] Total de dívidas ─────────────────────────────────────────────────────
const intencaoDividasTotal: Intencao = (msg, d) => {
  const temDivida = containsAny(msg, ...SINONIMOS_DIVIDA);
  const temPergunta = containsAny(
    msg,
    "quanto eu devo", "quanto devo", "total de divida",
    "minhas dividas", "todas as dividas", "estou endividado",
    "tenho divida", "quanto falta quitar"
  );

  // Só ativa se há sinal explícito de dívida E não é uma pergunta já tratada por I5/I6/I7/I8
  if (
    !temPergunta &&
    !(
      temDivida &&
      !containsAny(msg, "atrasad", "vencid", "prioridade", "pagar primeiro",
        "essa semana", "proximos dias")
    )
  )
    return null;

  const { pendentes, vencidas, totalPendente, proxima } = d;

  if (pendentes.length === 0)
    return "Você não tem dívidas pendentes registradas. Parabéns! 🎉";

  const pctTxt =
    d.salario > 0
      ? ` Isso compromete **${((totalPendente / d.salario) * 100).toFixed(0)}%** da sua renda mensal.`
      : "";

  const altaPrioridade = pendentes.filter((div) => div.prioridade === Prioridade.ALTA);

  return (
    `Você tem **${pendentes.length} dívida${pendentes.length > 1 ? "s" : ""} pendente${pendentes.length > 1 ? "s" : ""}**, totalizando **${formatBRL(totalPendente)}**.${pctTxt}` +
    (vencidas.length > 0 ? `\n\n⚠️ ${vencidas.length} já ${vencidas.length > 1 ? "estão vencidas" : "está vencida"}.` : "") +
    (altaPrioridade.length > 0 ? `\n🔴 ${altaPrioridade.length} de prioridade ALTA.` : "") +
    (proxima
      ? `\n\nPróxima a vencer: **"${proxima.nome}"** (${labelPrazo(diasRestantes(proxima.vencimento))}).`
      : "")
  );
};

// ── [I10] Meta específica pelo nome ──────────────────────────────────────────
const intencaoMetaEspecifica: Intencao = (msg, d) => {
  const citada = d.raw.metas.find(
    (m) =>
      msg.includes(normalize(m.nome)) &&
      containsAny(msg, ...SINONIMOS_META, "como esta", "progresso", "quanto falta", "status")
  );
  if (!citada) return null;

  const pct = percentual(citada.valorAtual, citada.valorTotal);
  const falta = citada.valorTotal - citada.valorAtual;
  const dias = citada.prazo ? diasRestantes(citada.prazo) : null;

  return (
    `**${citada.emoji ?? "🎯"} "${citada.nome}"**\n` +
    `• Progresso: ${formatBRL(citada.valorAtual)} de ${formatBRL(citada.valorTotal)} (${pct})\n` +
    `• Falta: ${formatBRL(falta)}\n` +
    `• Status: ${citada.status}\n` +
    `• Prioridade: ${citada.prioridade}\n` +
    (dias !== null ? `• Prazo: ${labelPrazo(dias)}\n` : "")
  );
};

// ── [I11] Meta mais próxima ───────────────────────────────────────────────────
const intencaoMetaMaisProxima: Intencao = (msg, d) => {
  if (
    !containsAny(
      msg,
      "meta mais perto", "qual meta esta mais perto",
      "qual vou concluir primeiro", "meta mais proxima"
    )
  )
    return null;

  const { metasAtivas } = d;
  if (metasAtivas.length === 0) return "Você não tem metas ativas cadastradas.";

  const ordenadas = [...metasAtivas].sort((a, b) => {
    const pctA = a.valorTotal > 0 ? a.valorAtual / a.valorTotal : 0;
    const pctB = b.valorTotal > 0 ? b.valorAtual / b.valorTotal : 0;
    return pctB - pctA;
  });
  const mais = ordenadas[0];

  return `A meta mais próxima de conclusão é **${mais.emoji ?? "🎯"} "${mais.nome}"**, com ${percentual(mais.valorAtual, mais.valorTotal)} concluído (${formatBRL(mais.valorAtual)} de ${formatBRL(mais.valorTotal)}).`;
};

// ── [I12] Metas atrasadas ─────────────────────────────────────────────────────
const intencaoMetasAtrasadas: Intencao = (msg, d) => {
  if (!containsAny(msg, "metas atrasadas", "meta atrasada", "metas vencidas"))
    return null;

  const { metasAtrasadas } = d;
  if (metasAtrasadas.length === 0)
    return "Nenhuma das suas metas está com prazo vencido. 👍";

  const lista = metasAtrasadas
    .map(
      (m) =>
        `• ${m.emoji ?? "🎯"} **${m.nome}** — ${percentual(m.valorAtual, m.valorTotal)} concluído (${labelPrazo(diasRestantes(m.prazo!))})`
    )
    .join("\n");

  return `Você tem **${metasAtrasadas.length} meta${metasAtrasadas.length > 1 ? "s" : ""} com prazo vencido**:\n\n${lista}`;
};

// ── [I13] Metas (geral) ───────────────────────────────────────────────────────
const intencaoMetas: Intencao = (msg, d) => {
  if (!containsAny(msg, ...SINONIMOS_META)) return null;

  // I10/I11/I12 são mais específicas — se baterem, esta pode complementar ou ser omitida.
  // Para evitar duplicação, só ativa se não citou nome específico.
  const citouNome = d.raw.metas.some((m) => msg.includes(normalize(m.nome)));
  if (citouNome) return null;

  const { metas } = d.raw;
  const { metasAtivas, totalMetas } = d;

  if (metas.length === 0)
    return "Você ainda não tem metas cadastradas. Criar uma meta clara é o primeiro passo para realizar um sonho! Que tal começar agora?";

  const lista = metasAtivas.slice(0, 5).map((m) => {
    const pct = percentual(m.valorAtual, m.valorTotal);
    const dias = m.prazo ? ` — ${labelPrazo(diasRestantes(m.prazo))}` : "";
    return `• ${m.emoji ?? "🎯"} **${m.nome}** — ${pct}${dias}`;
  });

  return (
    `Você tem **${metas.length} meta${metas.length > 1 ? "s" : ""}** (${metasAtivas.length} ativa${metasAtivas.length > 1 ? "s" : ""}), com **${formatBRL(totalMetas)}** acumulados.\n\n${lista.join("\n")}` +
    (metasAtivas.length > 5
      ? `\n\n…e mais ${metasAtivas.length - 5} meta${metasAtivas.length - 5 > 1 ? "s" : ""}.`
      : "")
  );
};

// ── [I14] Quanto guardar ──────────────────────────────────────────────────────
const intencaoQuantoGuardar: Intencao = (msg, d, ultimoAssunto) => {
  const perguntaExplicita = containsAny(
    msg,
    "quanto devo guardar", "quanto guardar",
    "quanto economizar", "quanto devo economizar",
    "quanto poupar", "quanto devo poupar"
  );
  const followUp =
    ultimoAssunto === "cofrinho" &&
    containsAny(msg, "quanto", "valor", "recomenda", "indica", "sugere");

  if (!perguntaExplicita && !followUp) return null;

  const { salario } = d;
  if (salario <= 0)
    return "Para te dar uma recomendação precisa, cadastra seu salário no perfil. 😊";

  return (
    `Com base no seu salário de **${formatBRL(salario)}**:\n\n` +
    `• **Mínimo (10%):** ${formatBRL(salario * 0.1)}/mês\n` +
    `• **Recomendado (15%):** ${formatBRL(salario * 0.15)}/mês\n` +
    `• **Ideal (20%):** ${formatBRL(salario * 0.2)}/mês\n\n` +
    `Comece pelo mínimo e aumente gradualmente. Constância vale mais que quantidade. 💪`
  );
};

// ── [I15] Reserva de emergência ───────────────────────────────────────────────
const intencaoReservaEmergencia: Intencao = (msg, d) => {
  if (
    !containsAny(
      msg,
      "reserva de emergencia", "reserva emergencia",
      "fundo de emergencia", "emergencia"
    )
  )
    return null;

  const { salario, totalGuardado } = d;
  if (salario <= 0)
    return "Cadastra seu salário no perfil para eu calcular sua reserva de emergência ideal. 😊";

  const meta6m = salario * 6;
  const falta = Math.max(0, meta6m - totalGuardado);
  const pct = percentual(totalGuardado, meta6m);

  return (
    `**Reserva de emergência ideal:** ${formatBRL(meta6m)} (6 meses de salário).\n\n` +
    `• Guardado: ${formatBRL(totalGuardado)} (${pct})\n` +
    `• Falta: ${formatBRL(falta)}\n\n` +
    (falta <= 0
      ? "🎉 Você já atingiu sua reserva de emergência! Excelente!"
      : `💡 Guardando ${formatBRL(salario * 0.1)}/mês, você atinge a meta em aprox. **${Math.ceil(falta / (salario * 0.1))} meses**.`)
  );
};

// ── [I16] Cofrinho (geral) ────────────────────────────────────────────────────
const intencaoCofrinho: Intencao = (msg, d) => {
  if (!containsAny(msg, ...SINONIMOS_COFRINHO)) return null;

  // Se já tratado por I14 ou I15, evita duplicação parcial
  const jaFoiQuantoGuardar = containsAny(
    msg,
    "quanto devo guardar", "quanto guardar", "quanto economizar",
    "quanto devo economizar", "quanto poupar"
  );
  if (jaFoiQuantoGuardar) return null;

  const { cofrinhos } = d.raw;
  const { totalGuardado, salario } = d;

  const cofrinhoInfo =
    cofrinhos.length > 0
      ? cofrinhos
          .map((c) => {
            const pctCofrinho =
              c.valorMeta && c.valorMeta > 0
                ? ` (${percentual(c.valorAtual, c.valorMeta)} da meta de ${formatBRL(c.valorMeta)})`
                : "";
            return `• **${c.nome}**: ${formatBRL(c.valorAtual)}${pctCofrinho}`;
          })
          .join("\n")
      : "Nenhum cofrinho cadastrado ainda.";

  const sugestao =
    salario > 0
      ? `\n\n💡 Recomendo guardar pelo menos **${formatBRL(salario * 0.1)}** (10% da renda) por mês.`
      : "";

  return `🐷 **Seu cofrinho:**\n\n${cofrinhoInfo}\n\n**Total guardado: ${formatBRL(totalGuardado)}**${sugestao}`;
};

// ── [I17] Categorias de gasto ─────────────────────────────────────────────────
const intencaoCategoriasGasto: Intencao = (msg, d) => {
  if (
    !containsAny(
      msg,
      "onde gasto mais", "maior gasto", "categoria que mais gasto",
      "categoria de gasto", "por categoria", "gasto por categoria"
    )
  )
    return null;

  const { transacoes30 } = d;
  const despesas = transacoes30.filter(
    (t) => t.tipo === TipoTransacao.DESPESA && t.categoria
  );

  if (despesas.length === 0)
    return "Não encontrei despesas categorizadas nos últimos 30 dias.";

  const porCategoria: Record<string, number> = {};
  for (const t of despesas) {
    const cat = t.categoria ?? "Sem categoria";
    porCategoria[cat] = (porCategoria[cat] ?? 0) + t.valor;
  }

  const ordenadas = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
  const lista = ordenadas
    .slice(0, 5)
    .map(([cat, val]) => `• **${cat}**: ${formatBRL(val)} (${percentual(val, d.despesas30)})`)
    .join("\n");

  return `Seus maiores gastos por categoria (últimos 30 dias):\n\n${lista}\n\nTotal de despesas: **${formatBRL(d.despesas30)}**`;
};

// ── [I18] Análise de gastos ───────────────────────────────────────────────────
const intencaoGastos: Intencao = (msg, d) => {
  if (!containsAny(msg, ...SINONIMOS_GASTO)) return null;

  const { receitas30, despesas30, saldo30, salario } = d;

  if (d.transacoes30.length === 0)
    return "Não encontrei transações nos últimos 30 dias para analisar.";

  const pctSalario =
    salario > 0
      ? ` Isso representa **${((despesas30 / salario) * 100).toFixed(0)}%** da sua renda.`
      : "";

  let avaliacao = "";
  if (salario > 0) {
    const ratio = despesas30 / salario;
    if (ratio > 0.9)
      avaliacao =
        "\n\n🚨 Suas despesas estão muito próximas (ou acima) da sua renda. Ação urgente necessária.";
    else if (ratio > 0.7)
      avaliacao =
        "\n\n⚠️ Você está comprometendo mais de 70% da renda com despesas. Hora de revisar.";
    else
      avaliacao =
        "\n\n✅ Seus gastos estão dentro de um nível saudável. Continue monitorando.";
  }

  return (
    `Seus últimos 30 dias:\n\n` +
    `• 💰 Receitas: **${formatBRL(receitas30)}**\n` +
    `• 💸 Despesas: **${formatBRL(despesas30)}**${pctSalario}\n` +
    `• 📊 Saldo: **${formatBRL(saldo30)}**` +
    avaliacao
  );
};

// ── [I19] Saldo ───────────────────────────────────────────────────────────────
const intencaoSaldo: Intencao = (msg, d) => {
  if (!containsAny(msg, ...SINONIMOS_SALDO)) return null;

  const { receitas30, despesas30, saldo30, totalGuardado } = d;

  return (
    `Seu saldo (últimos 30 dias):\n\n` +
    `• 💰 Receitas: **${formatBRL(receitas30)}**\n` +
    `• 💸 Despesas: **${formatBRL(despesas30)}**\n` +
    `• 📊 Resultado: **${formatBRL(saldo30)}** ${saldo30 >= 0 ? "✅" : "⚠️"}\n` +
    `• 🐷 Guardado no cofrinho: **${formatBRL(totalGuardado)}**`
  );
};

// ── [I20] Saúde financeira ────────────────────────────────────────────────────
const intencaoSaudeFinanceira: Intencao = (msg, d) => {
  if (!containsAny(msg, ...SINONIMOS_SAUDE)) return null;

  const { vencidas, salario, totalPendente, totalGuardado, metasAtivas } = d;

  let score = 100;
  const fatores: string[] = [];

  if (vencidas.length > 0) {
    const pen = Math.min(30, vencidas.length * 10);
    score -= pen;
    fatores.push(
      `-${pen} pts: ${vencidas.length} dívida${vencidas.length > 1 ? "s" : ""} vencida${vencidas.length > 1 ? "s" : ""}`
    );
  }

  if (salario > 0 && totalPendente > 0) {
    const ratio = totalPendente / salario;
    if (ratio > 0.8) {
      score -= 25;
      fatores.push("-25 pts: dívidas acima de 80% da renda");
    } else if (ratio > 0.5) {
      score -= 15;
      fatores.push("-15 pts: dívidas entre 50-80% da renda");
    } else if (ratio > 0.3) {
      score -= 5;
      fatores.push("-5 pts: dívidas entre 30-50% da renda");
    }
  }

  if (salario > 0) {
    const reservaIdeal = salario * 6;
    if (totalGuardado < reservaIdeal * 0.25) {
      score -= 15;
      fatores.push("-15 pts: reserva de emergência insuficiente");
    } else if (totalGuardado < reservaIdeal * 0.5) {
      score -= 7;
      fatores.push("-7 pts: reserva de emergência parcial");
    }
  }

  if (metasAtivas.length > 0) {
    const bonus = Math.min(10, metasAtivas.length * 3);
    score = Math.min(100, score + bonus);
    fatores.push(
      `+${bonus} pts: ${metasAtivas.length} meta${metasAtivas.length > 1 ? "s" : ""} ativa${metasAtivas.length > 1 ? "s" : ""}`
    );
  }

  score = Math.max(0, Math.min(100, score));
  const emoji = score >= 80 ? "🟢" : score >= 60 ? "🟡" : score >= 40 ? "🟠" : "🔴";
  const nivel =
    score >= 80 ? "Excelente" : score >= 60 ? "Bom" : score >= 40 ? "Atenção" : "Crítico";

  return (
    `${emoji} **Saúde Financeira: ${score}/100 — ${nivel}**\n\n` +
    (fatores.length > 0
      ? `Fatores:\n${fatores.map((f) => `• ${f}`).join("\n")}\n\n`
      : "") +
    (score >= 80
      ? "Você está no caminho certo! Continue mantendo esse ritmo. 🚀"
      : score >= 60
      ? "Boa base, mas há espaço para melhorar. Foque em quitar as pendências."
      : score >= 40
      ? "Situação merece atenção. Recomendo priorizar dívidas vencidas e construir reserva."
      : "Situação crítica. Recomendo um plano de ação imediato — quer ver um plano de 30 dias?")
  );
};

// ── [I21] Análise completa ────────────────────────────────────────────────────
const intencaoAnalise: Intencao = (msg, d) => {
  if (!containsAny(msg, ...SINONIMOS_ANALISE)) return null;

  const {
    pendentes, vencidas, totalPendente, metasAtivas, metasAtrasadas,
    totalMetas, totalGuardado, receitas30, despesas30, saldo30,
    salario, saudacaoNome, proxima,
  } = d;

  const linhas = [
    `📊 **Diagnóstico Financeiro${saudacaoNome}**\n`,
    `**Dívidas:**`,
    `• Pendentes: ${pendentes.length} — ${formatBRL(totalPendente)}`,
    vencidas.length > 0 ? `• ⚠️ Vencidas: ${vencidas.length}` : `• ✅ Nenhuma vencida`,
    salario > 0
      ? `• Comprometimento: ${((totalPendente / salario) * 100).toFixed(0)}% da renda`
      : "",
    `\n**Metas:**`,
    `• Ativas: ${metasAtivas.length} — ${formatBRL(totalMetas)} acumulados`,
    metasAtrasadas.length > 0 ? `• ⚠️ Com prazo vencido: ${metasAtrasadas.length}` : "",
    `\n**Cofrinho:**`,
    `• Guardado: ${formatBRL(totalGuardado)}`,
    salario > 0 ? `• Reserva ideal (6 meses): ${formatBRL(salario * 6)}` : "",
    `\n**Últimos 30 dias:**`,
    `• Receitas: ${formatBRL(receitas30)} | Despesas: ${formatBRL(despesas30)} | Saldo: ${formatBRL(saldo30)}`,
    `\n**Recomendação:**`,
    vencidas.length > 0
      ? `⚠️ Priorize as ${vencidas.length} dívida${vencidas.length > 1 ? "s" : ""} vencida${vencidas.length > 1 ? "s" : ""} imediatamente.`
      : proxima
      ? `👉 Próxima ação: pagar "${proxima.nome}" (${labelPrazo(diasRestantes(proxima.vencimento))}).`
      : `👏 Sem dívidas urgentes! Foque em metas e reserva de emergência.`,
  ]
    .filter(Boolean)
    .join("\n");

  return linhas;
};

// ── [I22] Plano de 30 dias ────────────────────────────────────────────────────
const intencaoPlano: Intencao = (msg, d) => {
  if (!containsAny(msg, ...SINONIMOS_PLANO)) return null;

  const { vencidas, proxima, metasAtivas, salario, saudacaoNome } = d;
  const passos: string[] = [];

  if (vencidas.length > 0)
    passos.push(
      `🚨 **Urgente:** Resolver ${vencidas.length} dívida${vencidas.length > 1 ? "s" : ""} vencida${vencidas.length > 1 ? "s" : ""} (${formatBRL(vencidas.reduce((a, div) => a + div.valor, 0))}).`
    );

  if (proxima)
    passos.push(
      `📅 Separar **${formatBRL(proxima.valor)}** para "${proxima.nome}", que ${labelPrazo(diasRestantes(proxima.vencimento))}.`
    );

  passos.push(
    salario > 0
      ? `🐷 Guardar **${formatBRL(salario * 0.025)}/semana** no cofrinho (≈10% do salário mensal).`
      : "🐷 Definir um valor fixo para guardar toda semana no cofrinho, mesmo que pequeno."
  );

  if (metasAtivas.length > 0) {
    const topMeta = [...metasAtivas].sort(
      (a, b) => pesoPrioridade(a.prioridade) - pesoPrioridade(b.prioridade)
    )[0];
    passos.push(
      `🎯 Fazer ao menos um aporte na meta "${topMeta.nome}" (${percentual(topMeta.valorAtual, topMeta.valorTotal)} concluída).`
    );
  }

  passos.push("📊 No fim do mês, revisar receitas, despesas e ajustar o que for necessário.");

  return (
    `**Plano para os próximos 30 dias${saudacaoNome}:**\n\n` +
    passos.map((p, i) => `${i + 1}. ${p}`).join("\n")
  );
};

// ── [I23] Follow-up por memória curta ─────────────────────────────────────────
const intencaoFollowUp: Intencao = (msg, d, ultimoAssunto) => {
  if (!ultimoAssunto || msg.split(" ").length > 5) return null;
  if (!containsAny(msg, "mais", "detalhe", "lista", "todas", "continua", "e mais"))
    return null;

  const { pendentes, metasAtivas, totalGuardado, salario } = d;

  if (ultimoAssunto === "cofrinho") {
    const sugestao =
      salario > 0
        ? `\n\nRecomendo guardar entre **${formatBRL(salario * 0.1)}** (10%) e **${formatBRL(salario * 0.2)}** (20%) por mês.`
        : "";
    return `Você tem **${formatBRL(totalGuardado)}** guardados no cofrinho.${sugestao}`;
  }

  if (ultimoAssunto === "dividas") {
    if (pendentes.length === 0) return "Você não tem dívidas pendentes. 🎉";
    const lista = pendentes
      .slice(0, 8)
      .map((div) => `• **${div.nome}** — ${formatBRL(div.valor)} (${labelPrazo(diasRestantes(div.vencimento))})`)
      .join("\n");
    return `Suas dívidas pendentes:\n\n${lista}`;
  }

  if (ultimoAssunto === "metas") {
    if (metasAtivas.length === 0) return "Você não tem metas ativas.";
    const lista = metasAtivas
      .map(
        (m) =>
          `• ${m.emoji ?? "🎯"} **${m.nome}** — ${percentual(m.valorAtual, m.valorTotal)} (${formatBRL(m.valorAtual)} de ${formatBRL(m.valorTotal)})`
      )
      .join("\n");
    return `Suas metas ativas:\n\n${lista}`;
  }

  return null;
};

// ─── Registro de intenções ────────────────────────────────────────────────────
// A ordem importa apenas para saudação/despedida (exclusivas).
// As demais são compostas: todas que baterem serão incluídas na resposta.

const INTENCOES_EXCLUSIVAS: Intencao[] = [
  intencaoSaudacao,
  intencaoDespedida,
  intencaoIdentidade,
];

const INTENCOES_COMPOSTAS: Intencao[] = [
  intencaoConquistas,
  intencaoDividaEspecifica,
  intencaoDividasVencidas,
  intencaoProximosVencimentos,
  intencaoPrioridade,
  intencaoDividasTotal,
  intencaoMetaEspecifica,
  intencaoMetaMaisProxima,
  intencaoMetasAtrasadas,
  intencaoMetas,
  intencaoReservaEmergencia,
  intencaoQuantoGuardar,
  intencaoCofrinho,
  intencaoCategoriasGasto,
  intencaoGastos,
  intencaoSaldo,
  intencaoSaudeFinanceira,
  intencaoAnalise,
  intencaoPlano,
  intencaoFollowUp,
];

// ─── Motor de intenções ───────────────────────────────────────────────────────

function gerarResposta(
  msgOriginal: string,
  ctx: Contexto,
  ultimoAssunto?: string
): string {
  const msg = normalize(msgOriginal);
  const dados = derivar(ctx);

  // Intenções exclusivas: primeira que bater encerra tudo
  for (const intencao of INTENCOES_EXCLUSIVAS) {
    const resultado = intencao(msg, dados, ultimoAssunto);
    if (resultado !== null) return resultado;
  }

  // Intenções compostas: TODAS que baterem são incluídas
  const blocos: string[] = [];
  for (const intencao of INTENCOES_COMPOSTAS) {
    const resultado = intencao(msg, dados, ultimoAssunto);
    if (resultado !== null) blocos.push(resultado);
  }

  if (blocos.length > 0) {
    // Separa cada bloco com uma linha em branco para legibilidade
    return blocos.join("\n\n---\n\n");
  }

  // Fallback com dados reais
  const { pendentes, metasAtivas, totalGuardado, totalPendente } = dados;
  const partes: string[] = [];
  if (pendentes.length > 0)
    partes.push(`${pendentes.length} dívida${pendentes.length > 1 ? "s" : ""} pendente${pendentes.length > 1 ? "s" : ""} (${formatBRL(totalPendente)})`);
  if (metasAtivas.length > 0)
    partes.push(`${metasAtivas.length} meta${metasAtivas.length > 1 ? "s" : ""} ativa${metasAtivas.length > 1 ? "s" : ""}`);
  if (totalGuardado > 0)
    partes.push(`${formatBRL(totalGuardado)} guardados no cofrinho`);

  const resumoCurto =
    partes.length > 0 ? ` Hoje você tem ${partes.join(", ")}.` : "";

  return `Não tenho certeza se entendi, mas posso te ajudar com dívidas, metas, cofrinho, gastos ou um diagnóstico completo.${resumoCurto}\n\nO que você quer ver?`;
}

// ─── Rota principal ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const message: string = (body.message ?? "").slice(0, 500);
    const ultimoAssunto: string | undefined = body.ultimoAssunto;

    if (!message.trim()) {
      return NextResponse.json(
        { message: "Pode repetir? Não recebi sua mensagem." },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const [dividas, metas, cofrinhos, transacoes, conquistas, perfil] =
      await Promise.all([
        prisma.divida.findMany({
          where: { userId },
          orderBy: { vencimento: "asc" },
        }),
        prisma.meta.findMany({
          where: { userId },
          orderBy: { prioridade: "asc" },
        }),
        prisma.cofrinho.findMany({ where: { userId } }),
        prisma.transacao.findMany({
          where: { userId },
          orderBy: { data: "desc" },
          take: 200,
        }),
        prisma.conquista.findMany({
          where: { userId },
          orderBy: { conquistadaEm: "desc" },
        }),
        prisma.perfilFinanceiro.findUnique({ where: { userId } }),
      ]);

    // Detecta assunto dominante para memória curta no próximo turno
    const msgN = normalize(message);
    let novoAssunto: string | undefined;
    const temDivida = SINONIMOS_DIVIDA.some((t) => msgN.includes(t));
    const temMeta = SINONIMOS_META.some((t) => msgN.includes(t));
    const temCofrinho = SINONIMOS_COFRINHO.some((t) => msgN.includes(t));
    const temGasto = SINONIMOS_GASTO.some((t) => msgN.includes(t));

    // Se apenas um assunto presente, define; se múltiplos, deixa undefined
    const assuntosPresentes = [temDivida, temMeta, temCofrinho, temGasto].filter(Boolean).length;
    if (assuntosPresentes === 1) {
      if (temDivida) novoAssunto = "dividas";
      else if (temMeta) novoAssunto = "metas";
      else if (temCofrinho) novoAssunto = "cofrinho";
      else if (temGasto) novoAssunto = "gastos";
    }

    const resposta = gerarResposta(
      message,
      {
        dividas,
        metas,
        cofrinhos,
        transacoes,
        conquistas,
        perfil,
        primeiroNome: session.user.name?.split(" ")[0] ?? "",
      },
      ultimoAssunto
    );

    return NextResponse.json({
      message: resposta,
      ...(novoAssunto ? { assunto: novoAssunto } : {}),
    });
  } catch (error) {
    console.error("[finn/route]", error);
    return NextResponse.json(
      {
        message:
          "Não consegui analisar suas finanças agora. Tente novamente em instantes.",
      },
      { status: 500 }
    );
  }
}