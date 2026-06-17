import { CategoriaMeta, Prioridade, StatusMeta } from "@prisma/client"

// ─── Prioridade (PT) ↔ Priority (EN) ────────────────────────────────────────
const PRIORITY_TO_PT: Record<string, Prioridade> = {
  HIGH: Prioridade.ALTA,
  MEDIUM: Prioridade.MEDIA,
  LOW: Prioridade.BAIXA,
}
const PRIORITY_TO_EN: Record<Prioridade, string> = {
  ALTA: "HIGH",
  MEDIA: "MEDIUM",
  BAIXA: "LOW",
}

export function toPrioridade(raw: string | undefined): Prioridade {
  if (!raw) return Prioridade.MEDIA
  if (Object.values(Prioridade).includes(raw as Prioridade)) return raw as Prioridade
  return PRIORITY_TO_PT[raw] ?? Prioridade.MEDIA
}

export function toPriorityEn(p: Prioridade): string {
  return PRIORITY_TO_EN[p] ?? "MEDIUM"
}

// ─── StatusMeta (PT) ↔ GoalStatus (EN) ──────────────────────────────────────
const STATUS_TO_PT: Record<string, StatusMeta> = {
  ACTIVE: StatusMeta.ATIVA,
  COMPLETED: StatusMeta.CONCLUIDA,
  PAUSED: StatusMeta.PAUSADA,
}
const STATUS_TO_EN: Record<StatusMeta, string> = {
  ATIVA: "ACTIVE",
  CONCLUIDA: "COMPLETED",
  PAUSADA: "PAUSED",
}

export function toStatusMeta(raw: string | undefined): StatusMeta {
  if (!raw) return StatusMeta.ATIVA
  if (Object.values(StatusMeta).includes(raw as StatusMeta)) return raw as StatusMeta
  return STATUS_TO_PT[raw] ?? StatusMeta.ATIVA
}

export function toStatusEn(s: StatusMeta): string {
  return STATUS_TO_EN[s] ?? "ACTIVE"
}

// ─── Categoria: os valores já são idênticos nos dois lados ──────────────────
export function toCategoriaMeta(raw: string | undefined): CategoriaMeta {
  if (raw && Object.values(CategoriaMeta).includes(raw as CategoriaMeta)) {
    return raw as CategoriaMeta
  }
  return CategoriaMeta.OUTROS
}

// ─── Serialização Meta (Prisma) → Goal (frontend) ───────────────────────────
type MetaWithDepositos = {
  id: string
  userId: string
  nome: string
  descricao: string | null
  categoria: CategoriaMeta
  prioridade: Prioridade
  valorTotal: number
  valorAtual: number
  prazo: Date | null
  dataPrevista: Date | null
  status: StatusMeta
  createdAt: Date
  updatedAt: Date
  depositos?: { id: string; metaId: string; valor: number; nota: string | null; createdAt: Date }[]
}

export function serializeMeta(meta: MetaWithDepositos) {
  return {
    id: meta.id,
    userId: meta.userId,
    name: meta.nome,
    description: meta.descricao,
    category: meta.categoria,
    priority: toPriorityEn(meta.prioridade),
    targetAmount: meta.valorTotal,
    currentAmount: meta.valorAtual,
    targetDate: meta.prazo ? meta.prazo.toISOString() : null,
    predictedDate: meta.dataPrevista ? meta.dataPrevista.toISOString() : null,
    status: toStatusEn(meta.status),
    createdAt: meta.createdAt.toISOString(),
    updatedAt: meta.updatedAt.toISOString(),
    contributions: (meta.depositos ?? [])
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((d) => ({
        id: d.id,
        goalId: d.metaId,
        amount: d.valor,
        note: d.nota,
        createdAt: d.createdAt.toISOString(),
      })),
  }
}

// ─── Previsão inteligente de conclusão ──────────────────────────────────────
// Baseado na média diária de aportes desde a criação da meta, projetada
// para o valor restante.
export function calcularPrevisao(
  meta: { valorAtual: number; valorTotal: number; createdAt: Date },
  depositos: { valor: number; createdAt: Date }[]
): Date | null {
  const restante = meta.valorTotal - meta.valorAtual
  if (restante <= 0) return null
  if (depositos.length === 0) return null

  const totalAportado = depositos.reduce((s, d) => s + d.valor, 0)
  if (totalAportado <= 0) return null

  const diasDesdeCriacao = Math.max((Date.now() - meta.createdAt.getTime()) / 86400000, 1)
  const mediaPorDia = totalAportado / diasDesdeCriacao
  if (mediaPorDia <= 0) return null

  const diasNecessarios = restante / mediaPorDia
  if (!isFinite(diasNecessarios) || diasNecessarios <= 0) return null

  const previsao = new Date()
  previsao.setDate(previsao.getDate() + Math.ceil(diasNecessarios))
  return previsao
}