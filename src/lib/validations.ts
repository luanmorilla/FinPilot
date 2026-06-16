// src/lib/validations.ts
// Schemas de validação Zod para todo o sistema

import { z } from "zod"

// ─── AUTH ───
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
})

// ─── ONBOARDING ───
export const onboardingSchema = z.object({
  salario: z.number().min(1, "Informe seu salário"),
  frequenciaPagamento: z.enum([
    "MENSAL",
    "QUINZENAL",
    "SEMANAL",
    "DUAS_VEZES_MES",
    "PERSONALIZADO",
  ]),
  diaFixo: z.number().min(1).max(31).optional(),
  diasPagamento: z.array(z.number()).optional(),
})

// ─── DÍVIDAS ───
export const dividaSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  valor: z.number().min(0.01, "Valor deve ser maior que zero"),
  vencimento: z.string().min(1, "Data obrigatória"),
  recorrente: z.boolean().default(false),
  categoria: z.enum([
    "MORADIA",
    "ALIMENTACAO",
    "TRANSPORTE",
    "SAUDE",
    "EDUCACAO",
    "LAZER",
    "CARTAO_CREDITO",
    "EMPRESTIMO",
    "SERVICOS",
    "OUTROS",
  ]),
  prioridade: z.enum(["ALTA", "MEDIA", "BAIXA"]).default("MEDIA"),
  observacao: z.string().optional(),
})

// ─── METAS ───
export const metaSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  descricao: z.string().optional(),
  valorTotal: z.number().min(1, "Valor deve ser maior que zero"),
  prazo: z.string().optional(),
  emoji: z.string().optional(),
})

// ─── COFRINHO ───
export const depositoSchema = z.object({
  valor: z.number().min(0.01, "Valor deve ser maior que zero"),
  descricao: z.string().optional(),
})

// ─── TIPOS ───
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type OnboardingInput = z.infer<typeof onboardingSchema>
export type DividaInput = z.infer<typeof dividaSchema>
export type MetaInput = z.infer<typeof metaSchema>
export type DepositoInput = z.infer<typeof depositoSchema>