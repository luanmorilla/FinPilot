// src/app/api/cofrinho/_lib-retirada.ts

// ─── Classificação de urgência do motivo de retirada ───────────────────────

export type NivelUrgencia = "emergencia" | "importante" | "duvidoso" | "nao_urgente";

export interface AvaliacaoRetirada {
  nivel: NivelUrgencia;
  liberaDireto: boolean; // se true, não precisa de confirmação extra
  mensagemFinn: string;
}

// Termos que indicam emergência real — saúde, segurança, necessidade básica
const TERMOS_EMERGENCIA = [
  "hospital", "emergencia", "emergência", "urgente", "urgencia", "urgência",
  "remedio", "remédio", "medicamento", "saude", "saúde", "cirurgia",
  "acidente", "internado", "internacao", "internação", "ambulancia", "ambulância",
  "doente", "doenca", "doença", "morreu", "falecimento", "funeral",
  "despejo", "despejado", "sem comida", "sem luz", "sem agua", "sem água",
  "roubo", "roubaram", "furto", "assalto", "demitido", "perdi o emprego",
  "veterinario", "veterinário", "pet doente",
]

// Termos que indicam algo importante mas não necessariamente emergência
const TERMOS_IMPORTANTE = [
  "aluguel", "conta atrasada", "multa", "divida", "dívida", "cobranca", "cobrança",
  "boleto", "vencido", "vencendo", "atraso", "juros", "negativado", "negativada",
  "escola", "faculdade", "material escolar", "documento", "conserto",
]

// Termos que sinalizam desejo/consumo (gatilho pro Finn tentar convencer a não retirar)
const TERMOS_NAO_URGENTE = [
  "roupa", "tenis", "tênis", "celular", "iphone", "jogo", "game",
  "festa", "balada", "viagem", "passeio", "presente", "comprar",
  "promocao", "promoção", "desconto", "oferta", "quero", "queria",
  "vontade", "capricho", "lazer", "diversao", "diversão", "bebida",
  "cigarro", "vape", "delivery", "ifood", "restaurante", "bar",
]

function contemAlgum(texto: string, termos: string[]): string | null {
  const lower = texto.toLowerCase()
  return termos.find((t) => lower.includes(t)) ?? null
}

export function avaliarMotivoRetirada(motivo: string, valor: number): AvaliacaoRetirada {
  const motivoLimpo = motivo.trim()

  if (!motivoLimpo) {
    return {
      nivel: "duvidoso",
      liberaDireto: false,
      mensagemFinn:
        "Antes de retirar, me conta rapidinho o motivo? Assim consigo te ajudar a decidir se vale a pena tirar do cofrinho ou se existe outra saída.",
    }
  }

  const matchEmergencia = contemAlgum(motivoLimpo, TERMOS_EMERGENCIA)
  if (matchEmergencia) {
    return {
      nivel: "emergencia",
      liberaDireto: true,
      mensagemFinn:
        "Entendi, isso é uma emergência real. Já liberei a retirada — cuide do que precisa primeiro, o cofrinho a gente reconstrói depois. 💜",
    }
  }

  const matchImportante = contemAlgum(motivoLimpo, TERMOS_IMPORTANTE)
  if (matchImportante) {
    return {
      nivel: "importante",
      liberaDireto: true,
      mensagemFinn:
        "Faz sentido, é um compromisso importante. Vou liberar a retirada — só lembra de voltar a guardar assim que a poeira baixar, combinado?",
    }
  }

  const matchNaoUrgente = contemAlgum(motivoLimpo, TERMOS_NAO_URGENTE)
  if (matchNaoUrgente) {
    return {
      nivel: "nao_urgente",
      liberaDireto: false,
      mensagemFinn:
        `Entendo a vontade, mas isso parece mais um desejo do que uma necessidade. Você já guardou ${formatBRLLocal(valor)} com esforço — vale considerar esperar uns dias antes de decidir? Se depois disso ainda fizer sentido, eu libero sem problema.`,
    }
  }

  // motivo informado mas não bateu em nenhuma lista — fica no meio do caminho
  return {
    nivel: "duvidoso",
    liberaDireto: false,
    mensagemFinn:
      "Não tenho certeza se isso é algo urgente. Pode me dar mais detalhes? Se for algo que realmente não pode esperar, é só confirmar e eu libero a retirada.",
  }
}

function formatBRLLocal(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}