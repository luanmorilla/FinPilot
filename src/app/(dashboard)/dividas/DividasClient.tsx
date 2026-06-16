"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, CreditCard, Trash2, X, Loader2,
  RefreshCw, CheckCircle2, AlertCircle,
  Sparkles, TrendingDown, ChevronDown
} from "lucide-react"
import Image from "next/image"

interface Divida {
  id: string
  nome: string
  valor: number
  vencimento: string
  paga: boolean
  categoria: string
  recorrente: boolean
}

interface DividasClientProps {
  dividas: Divida[]
  salario: number
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function numPorExtenso(v: number): string {
  if (!v || v === 0) return ""
  if (v < 1000) return `${v.toFixed(2).replace(".", ",")} reais`
  if (v < 1000000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(".", ",")} mil reais`
  return `${(v / 1000000).toFixed(1).replace(".", ",")} milhão de reais`
}

function getDiasRestantes(data: string) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const venc = new Date(data); venc.setHours(0, 0, 0, 0)
  return Math.ceil((venc.getTime() - hoje.getTime()) / 86400000)
}

function getUrgencia(dias: number) {
  if (dias < 0) return { label: "Vencida", cor: "text-red-400", bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.18)", accent: "#ef4444", dot: "bg-red-500" }
  if (dias === 0) return { label: "Hoje!", cor: "text-orange-400", bg: "rgba(249,115,22,0.07)", border: "rgba(249,115,22,0.18)", accent: "#f97316", dot: "bg-orange-500 animate-pulse" }
  if (dias <= 3) return { label: `${dias}d`, cor: "text-amber-400", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.15)", accent: "#f59e0b", dot: "bg-amber-400" }
  if (dias <= 7) return { label: `${dias}d`, cor: "text-yellow-400", bg: "rgba(234,179,8,0.05)", border: "rgba(234,179,8,0.12)", accent: "#eab308", dot: "bg-yellow-400" }
  return { label: `${dias}d`, cor: "text-zinc-400", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.07)", accent: "#71717a", dot: "bg-zinc-600" }
}

const SUGGESTIONS: Record<string, { categoria: string; recorrente: boolean; diaVenc?: number; chip: string }> = {
  nubank:       { categoria: "Cartão",      recorrente: true,  diaVenc: 10, chip: "💳 Cartão · Vence dia 10" },
  inter:        { categoria: "Cartão",      recorrente: true,  diaVenc: 5,  chip: "💳 Cartão · Vence dia 5" },
  itau:         { categoria: "Cartão",      recorrente: true,  diaVenc: 20, chip: "💳 Cartão · Vence dia 20" },
  bradesco:     { categoria: "Cartão",      recorrente: true,  diaVenc: 15, chip: "💳 Cartão · Vence dia 15" },
  aluguel:      { categoria: "Moradia",     recorrente: true,  diaVenc: 5,  chip: "🏠 Moradia · Recorrente" },
  condominio:   { categoria: "Moradia",     recorrente: true,  chip: "🏠 Condomínio · Mensal" },
  agua:         { categoria: "Moradia",     recorrente: true,  chip: "💧 Conta fixa · Mensal" },
  luz:          { categoria: "Moradia",     recorrente: true,  chip: "⚡ Conta fixa · Mensal" },
  energia:      { categoria: "Moradia",     recorrente: true,  chip: "⚡ Conta fixa · Mensal" },
  internet:     { categoria: "Assinatura",  recorrente: true,  chip: "🌐 Assinatura · Mensal" },
  netflix:      { categoria: "Assinatura",  recorrente: true,  chip: "📺 Streaming · Mensal" },
  spotify:      { categoria: "Assinatura",  recorrente: true,  chip: "🎵 Streaming · Mensal" },
  academia:     { categoria: "Saúde",       recorrente: true,  chip: "💪 Saúde · Mensal" },
  gasolina:     { categoria: "Transporte",  recorrente: false, chip: "⛽ Transporte" },
  uber:         { categoria: "Transporte",  recorrente: false, chip: "🚗 Transporte" },
  mercado:      { categoria: "Alimentação", recorrente: false, chip: "🛒 Alimentação" },
  supermercado: { categoria: "Alimentação", recorrente: false, chip: "🛒 Alimentação" },
  farmacia:     { categoria: "Saúde",       recorrente: false, chip: "💊 Saúde" },
  escola:       { categoria: "Educação",    recorrente: true,  chip: "📚 Educação · Mensal" },
  faculdade:    { categoria: "Educação",    recorrente: true,  chip: "📚 Educação · Mensal" },
}

function getSugestao(nome: string) {
  const lower = nome.toLowerCase()
  for (const [key, val] of Object.entries(SUGGESTIONS)) {
    if (lower.includes(key)) return val
  }
  return null
}

const CATEGORIAS = [
  { label: "Cartão",      emoji: "💳" },
  { label: "Moradia",     emoji: "🏠" },
  { label: "Transporte",  emoji: "🚗" },
  { label: "Alimentação", emoji: "🍽️" },
  { label: "Saúde",       emoji: "💊" },
  { label: "Educação",    emoji: "📚" },
  { label: "Assinatura",  emoji: "📱" },
  { label: "Lazer",       emoji: "🎮" },
  { label: "Outros",      emoji: "📦" },
]

function getDataRelativa(offsetDias: number) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDias)
  return d.toISOString().split("T")[0]
}

function labelDataRelativa(offsetDias: number) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDias)
  const dia = d.getDate()
  const mes = d.toLocaleDateString("pt-BR", { month: "short" })
  if (offsetDias === 0) return { top: "Hoje", bot: `${dia} ${mes}` }
  if (offsetDias === 1) return { top: "Amanhã", bot: `${dia} ${mes}` }
  return { top: `${offsetDias} dias`, bot: `${dia} ${mes}` }
}

export default function DividasClient({ dividas: inicial, salario }: DividasClientProps) {
  const [dividas, setDividas] = useState(inicial)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [filtro, setFiltro] = useState<"todas" | "pendentes" | "pagas">("pendentes")
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [sugestaoAplicada, setSugestaoAplicada] = useState(false)

  const [form, setForm] = useState({
    nome: "",
    valor: "",
    vencimento: "",
    categoria: "Outros",
    recorrente: false,
  })

  const valorInputRef = useRef<HTMLInputElement>(null)

  const totalPendente = dividas.filter(d => !d.paga).reduce((a, d) => a + d.valor, 0)
  const totalPago     = dividas.filter(d =>  d.paga).reduce((a, d) => a + d.valor, 0)
  const qtdPendente   = dividas.filter(d => !d.paga).length

  const dividasFiltradas = dividas.filter(d => {
    if (filtro === "pendentes") return !d.paga
    if (filtro === "pagas")    return  d.paga
    return true
  })

  const valorNum      = parseFloat(form.valor.replace(/\./g, "").replace(",", ".")) || 0
  const totalComNova  = totalPendente + valorNum
  const pctUso        = salario > 0 ? Math.min((totalComNova / salario) * 100, 100) : 0
  const saldoPrevisto = salario - totalComNova
  const barColor      = pctUso > 80 ? "#ef4444" : pctUso > 50 ? "#f59e0b" : "#a855f7"

  const sugestao = getSugestao(form.nome)

  function aplicarSugestao() {
    if (!sugestao) return
    setForm(p => ({
      ...p,
      categoria: sugestao.categoria,
      recorrente: sugestao.recorrente,
      vencimento: sugestao.diaVenc
        ? (() => {
            const d = new Date()
            d.setDate(sugestao.diaVenc!)
            if (d < new Date()) d.setMonth(d.getMonth() + 1)
            return d.toISOString().split("T")[0]
          })()
        : p.vencimento,
    }))
    setSugestaoAplicada(true)
  }

  function handleNomeChange(nome: string) {
    setForm(p => ({ ...p, nome }))
    setSugestaoAplicada(false)
  }

  function formatarValor(raw: string) {
    const nums = raw.replace(/\D/g, "")
    if (!nums) return ""
    const n = parseFloat(nums) / 100
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  }

  const handleSubmit = async () => {
    if (!form.nome || !form.valor || !form.vencimento) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/dividas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          valor: parseFloat(form.valor.replace(/\./g, "").replace(",", ".")),
          vencimento: form.vencimento,
          categoria: form.categoria,
          recorrente: form.recorrente,
        }),
      })
      if (res.ok) {
        const nova = await res.json()
        setDividas(prev => [...prev, nova])
        setForm({ nome: "", valor: "", vencimento: "", categoria: "Outros", recorrente: false })
        setSugestaoAplicada(false)
        setShowModal(false)
      }
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handlePagar = async (id: string) => {
    try {
      await fetch(`/api/dividas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paga: true }) })
      setDividas(prev => prev.map(d => d.id === id ? { ...d, paga: true } : d))
    } catch (e) { console.error(e) }
  }

  const handleDeletar = async (id: string) => {
    try {
      await fetch(`/api/dividas/${id}`, { method: "DELETE" })
      setDividas(prev => prev.filter(d => d.id !== id))
    } catch (e) { console.error(e) }
  }

  const isFormValid = form.nome.trim() && form.valor && form.vencimento

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0c0c14", paddingBottom: 100 }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#a855f7" }}>Controle</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">Dívidas</h1>
          </div>
          {qtdPendente > 0 && (
            <div className="mt-1 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)", color: "#c084fc" }}>
              {qtdPendente} pendente{qtdPendente > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Resumo */}
      <div className="mx-4 grid grid-cols-2 gap-3 mb-5">
        {[
          { label: "Pendente", value: totalPendente, count: dividas.filter(d=>!d.paga).length, rgb: "239,68,68",  hex: "#ef4444" },
          { label: "Pago",     value: totalPago,     count: dividas.filter(d=> d.paga).length, rgb: "34,197,94",  hex: "#22c55e" },
        ].map(c => (
          <div key={c.label} className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: `rgba(${c.rgb},0.07)`, border: `1px solid rgba(${c.rgb},0.15)` }}>
            <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full opacity-10"
              style={{ background: `radial-gradient(circle, ${c.hex}, transparent)` }} />
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: c.hex }}>{c.label}</p>
            <p className="text-lg font-bold text-white leading-tight">{formatBRL(c.value)}</p>
            <p className="text-[10px] mt-1" style={{ color: c.hex + "99" }}>{c.count} dívida{c.count !== 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="mx-4 flex gap-1.5 mb-5 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {(["todas", "pendentes", "pagas"] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all capitalize"
            style={filtro === f
              ? { background: f === "pagas" ? "rgba(34,197,94,0.15)" : f === "pendentes" ? "rgba(239,68,68,0.15)" : "rgba(168,85,247,0.15)", color: f === "pagas" ? "#4ade80" : f === "pendentes" ? "#f87171" : "#c084fc" }
              : { color: "#52525b" }}>
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="mx-4 space-y-3">
        <AnimatePresence>
          {dividasFiltradas.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-16 rounded-3xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
              <CreditCard size={36} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 font-semibold text-sm">Nenhuma dívida aqui</p>
              <p className="text-zinc-600 text-xs mt-1">Toque em + para adicionar</p>
            </motion.div>
          ) : dividasFiltradas.map((d, i) => {
            const dias = getDiasRestantes(d.vencimento)
            const urg  = getUrgencia(dias)
            const catEmoji = CATEGORIAS.find(c => c.label === d.categoria)?.emoji ?? "📦"
            return (
              <motion.div key={d.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 28 }}>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: d.paga ? "rgba(255,255,255,0.03)" : urg.bg, border: `1px solid ${d.paga ? "rgba(255,255,255,0.06)" : urg.border}` }}>
                  {!d.paga && <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${urg.accent}, transparent)` }} />}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                        style={{ background: "rgba(255,255,255,0.05)" }}>
                        {d.paga ? "✓" : catEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm font-semibold truncate ${d.paga ? "line-through text-zinc-500" : "text-white"}`}>{d.nome}</p>
                          {d.recorrente && <RefreshCw size={9} className="text-zinc-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-zinc-600">{d.categoria}</span>
                          <span className="text-[10px] text-zinc-700">·</span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(d.vencimento).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${d.paga ? "text-emerald-400" : "text-white"}`}>{formatBRL(d.valor)}</p>
                        {d.paga
                          ? <span className="text-[10px] font-semibold text-emerald-500">Pago ✓</span>
                          : <span className={`text-[10px] font-bold ${urg.cor}`}>{urg.label}</span>}
                      </div>
                    </div>
                    {!d.paga && (
                      <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <button onClick={() => handlePagar(d.id)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                          <CheckCircle2 size={12} /> Marcar como pago
                        </button>
                        <button onClick={() => handleDeletar(d.id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl flex items-center justify-center z-40"
        style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 8px 32px rgba(168,85,247,0.45)" }}>
        <Plus size={22} className="text-white" strokeWidth={2.5} />
      </motion.button>

      {/* ══ MODAL ══ */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>

            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="w-full flex flex-col"
              style={{
                background: "linear-gradient(180deg, #13131f 0%, #0f0f1a 100%)",
                border: "1px solid rgba(168,85,247,0.15)",
                borderBottom: "none",
                borderRadius: "24px 24px 0 0",
                maxHeight: "calc(100vh - 80px)",
              }}>

              {/* handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-zinc-700" />
              </div>

              {/* Header */}
              <div className="px-5 pt-3 pb-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Nova Dívida</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Vamos registrar para você ter controle total.</p>
                  </div>
                  <button onClick={() => setShowModal(false)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <X size={16} className="text-zinc-400" />
                  </button>
                </div>

                {/* Finn */}
                <div className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(124,58,237,0.06))", border: "1px solid rgba(168,85,247,0.2)" }}>
                  <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: "rgba(168,85,247,0.15)" }}>
                    <Image src="/images/finn-corpo.png" alt="Finn" width={44} height={44} className="object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Oi! Eu sou o Finn 👋</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Preencha os dados que eu te ajudo a categorizar e organizar tudo direitinho.</p>
                  </div>
                  <Sparkles size={16} className="text-purple-400 shrink-0" />
                </div>
              </div>

              {/* Scroll */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6" style={{ overscrollBehavior: "contain" }}>

                {/* 1 Nome */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "rgba(168,85,247,0.3)", border: "1px solid rgba(168,85,247,0.4)" }}>1</div>
                    <p className="text-sm font-semibold text-white">Para quem você deve?</p>
                  </div>
                  <div className="relative">
                    <CreditCard size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      value={form.nome}
                      onChange={e => handleNomeChange(e.target.value)}
                      placeholder="Ex: Nubank, Aluguel..."
                      className="w-full pl-10 pr-10 py-3.5 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.25)" }}
                    />
                    {form.nome && (
                      <button onClick={() => { setForm(p=>({...p,nome:""})); setSugestaoAplicada(false) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {sugestao && !sugestaoAplicada && (
                      <motion.button
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        onClick={aplicarSugestao}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all"
                        style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc" }}>
                        <Sparkles size={11} />
                        {sugestao.chip} — aplicar?
                      </motion.button>
                    )}
                    {sugestaoAplicada && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mt-2 text-xs text-purple-400 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Sugestão aplicada!
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2 Valor */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "rgba(168,85,247,0.3)", border: "1px solid rgba(168,85,247,0.4)" }}>2</div>
                    <p className="text-sm font-semibold text-white">Qual o valor?</p>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.2)" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 text-xl font-bold shrink-0">R$</span>
                      <input
                        ref={valorInputRef}
                        value={form.valor}
                        onChange={e => setForm(p => ({ ...p, valor: formatarValor(e.target.value) }))}
                        placeholder="0,00"
                        inputMode="numeric"
                        className="flex-1 bg-transparent outline-none text-white font-bold placeholder:text-zinc-700"
                        style={{ fontSize: form.valor.length > 8 ? "28px" : "36px", lineHeight: 1 }}
                      />
                    </div>
                    {valorNum > 0 && (
                      <p className="text-xs text-zinc-500 mt-2 capitalize">{numPorExtenso(valorNum)}</p>
                    )}
                    <div className="mt-3 pt-3 grid grid-cols-4 gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      {[100, 250, 500, 1000].map(v => (
                        <button key={v}
                          onClick={() => setForm(p => ({ ...p, valor: v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) }))}
                          className="py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all"
                          style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "#c084fc" }}>
                          {v >= 1000 ? "1k" : v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3+4 Vencimento + Categoria */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: "rgba(168,85,247,0.3)", border: "1px solid rgba(168,85,247,0.4)" }}>3</div>
                      <p className="text-sm font-semibold text-white">Quando vence?</p>
                    </div>
                    <div className="space-y-2">
                      {[0, 1, 7, 15].map(offset => {
                        const val = getDataRelativa(offset)
                        const lbl = labelDataRelativa(offset)
                        const sel = form.vencimento === val && !showCustomDate
                        return (
                          <button key={offset}
                            onClick={() => { setForm(p=>({...p, vencimento: val})); setShowCustomDate(false) }}
                            className="w-full py-2.5 px-3 rounded-xl flex flex-col items-start active:scale-95 transition-all"
                            style={sel
                              ? { background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)" }
                              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <span className={`text-xs font-bold ${sel ? "text-purple-300" : "text-white"}`}>{lbl.top}</span>
                            <span className="text-[10px] text-zinc-500">{lbl.bot}</span>
                          </button>
                        )
                      })}
                      <button onClick={() => setShowCustomDate(v => !v)}
                        className="w-full py-2.5 px-3 rounded-xl flex items-center justify-between active:scale-95 transition-all"
                        style={showCustomDate
                          ? { background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)" }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <span className="text-xs font-bold text-white">Personalizar</span>
                        <ChevronDown size={12} className="text-zinc-500" />
                      </button>
                      <AnimatePresence>
                        {showCustomDate && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                            <input type="date" value={form.vencimento}
                              onChange={e => setForm(p => ({ ...p, vencimento: e.target.value }))}
                              className="w-full py-2.5 px-3 rounded-xl text-xs text-white outline-none"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.3)", colorScheme: "dark" }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: "rgba(168,85,247,0.3)", border: "1px solid rgba(168,85,247,0.4)" }}>4</div>
                      <p className="text-sm font-semibold text-white">Categoria</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {CATEGORIAS.map(c => {
                        const sel = form.categoria === c.label
                        return (
                          <button key={c.label} onClick={() => setForm(p=>({...p, categoria: c.label}))}
                            className="py-2.5 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-all"
                            style={sel
                              ? { background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)" }
                              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <span className="text-lg">{c.emoji}</span>
                            <span className={`text-[9px] font-semibold ${sel ? "text-purple-300" : "text-zinc-500"}`}>{c.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 5 Recorrência */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "rgba(168,85,247,0.3)", border: "1px solid rgba(168,85,247,0.4)" }}>5</div>
                    <p className="text-sm font-semibold text-white">Recorrência</p>
                    <span className="text-xs text-zinc-500">Essa dívida se repete?</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Não",    sub: "Única vez", val: false },
                      { label: "Mensal", sub: "Todo mês",  val: true  },
                    ].map(opt => {
                      const sel = form.recorrente === opt.val
                      return (
                        <button key={opt.label} onClick={() => setForm(p=>({...p, recorrente: opt.val}))}
                          className="py-3 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-all"
                          style={sel
                            ? { background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)" }
                            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <span className={`text-sm font-bold ${sel ? "text-purple-300" : "text-white"}`}>{opt.label}</span>
                          <span className={`text-[10px] ${sel ? "text-purple-400" : "text-zinc-500"}`}>{opt.sub}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Impacto */}
                {salario > 0 && valorNum > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-4"
                    style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown size={14} className="text-purple-400" />
                      <p className="text-sm font-semibold text-white">Impacto no orçamento</p>
                    </div>
                    <div className="w-full h-2 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pctUso}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${barColor}, ${barColor}99)` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <div>
                        <p className="text-zinc-500">Gastos previstos</p>
                        <p className="font-bold mt-0.5" style={{ color: barColor }}>{formatBRL(totalComNova)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-zinc-500">Seu salário</p>
                        <p className="font-bold text-zinc-300 mt-0.5">{formatBRL(salario)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500">Saldo previsto</p>
                        <p className={`font-bold mt-0.5 ${saldoPrevisto >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatBRL(saldoPrevisto)}</p>
                      </div>
                    </div>
                    {pctUso > 80 && (
                      <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <AlertCircle size={12} className="text-red-400 shrink-0" />
                        <p className="text-xs text-red-400">Suas dívidas estão consumindo mais de 80% do seu salário.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="h-2" />
              </div>

              {/* Botão fixo */}
              <div className="shrink-0 px-5 pt-3 pb-10"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,15,26,0.98)" }}>
                <p className="text-center text-[10px] text-zinc-600 mb-3">🔒 Seus dados são 100% seguros</p>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={isLoading || !isFormValid}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  style={{
                    background: isFormValid && !isLoading ? "linear-gradient(135deg, #a855f7, #7c3aed)" : "rgba(255,255,255,0.08)",
                    boxShadow: isFormValid && !isLoading ? "0 6px 24px rgba(168,85,247,0.4)" : "none",
                  }}>
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} strokeWidth={2.5} /> Adicionar Dívida</>}
                </motion.button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}