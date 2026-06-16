"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, CreditCard, Trash2, X, Loader2, Calendar, DollarSign, Tag, RefreshCw, AlertCircle, CheckCircle2, Clock } from "lucide-react"

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
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function getDiasRestantes(data: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const venc = new Date(data)
  venc.setHours(0, 0, 0, 0)
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function getUrgencia(dias: number) {
  if (dias < 0) return {
    label: "Vencida",
    sublabel: `${Math.abs(dias)}d atrás`,
    cor: "text-red-400",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.18)",
    accent: "#ef4444",
    dot: "bg-red-500",
    icon: AlertCircle,
  }
  if (dias === 0) return {
    label: "Vence hoje",
    sublabel: "Urgente",
    cor: "text-orange-400",
    bg: "rgba(249,115,22,0.07)",
    border: "rgba(249,115,22,0.18)",
    accent: "#f97316",
    dot: "bg-orange-500 animate-pulse",
    icon: AlertCircle,
  }
  if (dias <= 3) return {
    label: `${dias}d`,
    sublabel: "Em breve",
    cor: "text-amber-400",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.15)",
    accent: "#f59e0b",
    dot: "bg-amber-400",
    icon: Clock,
  }
  if (dias <= 7) return {
    label: `${dias}d`,
    sublabel: "Esta semana",
    cor: "text-yellow-400",
    bg: "rgba(234,179,8,0.05)",
    border: "rgba(234,179,8,0.12)",
    accent: "#eab308",
    dot: "bg-yellow-400",
    icon: Clock,
  }
  return {
    label: `${dias}d`,
    sublabel: "No prazo",
    cor: "text-zinc-400",
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.07)",
    accent: "#71717a",
    dot: "bg-zinc-600",
    icon: Clock,
  }
}

const categorias = [
  { label: "Moradia", emoji: "🏠" },
  { label: "Transporte", emoji: "🚗" },
  { label: "Alimentação", emoji: "🍽️" },
  { label: "Saúde", emoji: "💊" },
  { label: "Educação", emoji: "📚" },
  { label: "Lazer", emoji: "🎮" },
  { label: "Assinatura", emoji: "📱" },
  { label: "Cartão", emoji: "💳" },
  { label: "Outros", emoji: "📦" },
]

export default function DividasClient({ dividas: inicial }: DividasClientProps) {
  const [dividas, setDividas] = useState(inicial)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [filtro, setFiltro] = useState<"todas" | "pendentes" | "pagas">("pendentes")

  const [form, setForm] = useState({
    nome: "",
    valor: "",
    vencimento: "",
    categoria: "Outros",
    recorrente: false,
  })

  const totalPendente = dividas.filter(d => !d.paga).reduce((acc, d) => acc + d.valor, 0)
  const totalPago = dividas.filter(d => d.paga).reduce((acc, d) => acc + d.valor, 0)
  const qtdPendente = dividas.filter(d => !d.paga).length

  const dividasFiltradas = dividas.filter(d => {
    if (filtro === "pendentes") return !d.paga
    if (filtro === "pagas") return d.paga
    return true
  })

  const handleSubmit = async () => {
    if (!form.nome || !form.valor || !form.vencimento) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/dividas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          valor: parseFloat(form.valor.replace(",", ".")),
          vencimento: form.vencimento,
          categoria: form.categoria,
          recorrente: form.recorrente,
        }),
      })
      if (res.ok) {
        const nova = await res.json()
        setDividas(prev => [...prev, nova])
        setForm({ nome: "", valor: "", vencimento: "", categoria: "Outros", recorrente: false })
        setShowModal(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
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
    <div className="flex flex-col min-h-screen bg-[#0a0a0f]" style={{ paddingBottom: "100px" }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold text-red-400 uppercase tracking-widest mb-1">Controle</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">Dívidas</h1>
          </div>
          {qtdPendente > 0 && (
            <div className="mt-1 px-3 py-1 rounded-full text-xs font-semibold text-red-300"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {qtdPendente} pendente{qtdPendente > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="mx-4 grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #ef4444, transparent)" }} />
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Pendente</p>
          <p className="text-lg font-bold text-white leading-tight">{formatBRL(totalPendente)}</p>
          <p className="text-[10px] text-red-400/60 mt-1">{dividas.filter(d => !d.paga).length} dívidas</p>
        </div>
        <div className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #22c55e, transparent)" }} />
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Pago</p>
          <p className="text-lg font-bold text-white leading-tight">{formatBRL(totalPago)}</p>
          <p className="text-[10px] text-emerald-400/60 mt-1">{dividas.filter(d => d.paga).length} dívidas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mx-4 flex gap-2 mb-5 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {(["todas", "pendentes", "pagas"] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all capitalize"
            style={filtro === f
              ? { background: f === "pagas" ? "rgba(34,197,94,0.15)" : f === "pendentes" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.1)", color: f === "pagas" ? "#4ade80" : f === "pendentes" ? "#f87171" : "#fff" }
              : { color: "#52525b" }
            }>
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
          ) : (
            dividasFiltradas.map((d, i) => {
              const dias = getDiasRestantes(d.vencimento)
              const urg = getUrgencia(dias)
              const catEmoji = categorias.find(c => c.label === d.categoria)?.emoji ?? "📦"
              return (
                <motion.div key={d.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 28 }}>
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: d.paga ? "rgba(255,255,255,0.03)" : urg.bg, border: `1px solid ${d.paga ? "rgba(255,255,255,0.06)" : urg.border}` }}>

                    {/* Linha de acento superior */}
                    {!d.paga && (
                      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${urg.accent}, transparent)` }} />
                    )}

                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Emoji categoria */}
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                          style={{ background: "rgba(255,255,255,0.05)" }}>
                          {d.paga ? "✓" : catEmoji}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-semibold truncate ${d.paga ? "line-through text-zinc-500" : "text-white"}`}>
                              {d.nome}
                            </p>
                            {d.recorrente && (
                              <RefreshCw size={9} className="text-zinc-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-zinc-600">{d.categoria}</span>
                            <span className="text-[10px] text-zinc-700">·</span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(d.vencimento).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold ${d.paga ? "text-emerald-400" : "text-white"}`}>
                            {formatBRL(d.valor)}
                          </p>
                          {d.paga ? (
                            <span className="text-[10px] font-semibold text-emerald-500">Pago ✓</span>
                          ) : (
                            <span className={`text-[10px] font-bold ${urg.cor}`}>{urg.label}</span>
                          )}
                        </div>
                      </div>

                      {!d.paga && (
                        <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <button onClick={() => handlePagar(d.id)}
                            className="flex-1 py-2 rounded-xl text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                            <CheckCircle2 size={12} />
                            Marcar como pago
                          </button>
                          <button onClick={() => handleDeletar(d.id)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                            <Trash2 size={13} className="text-red-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl flex items-center justify-center z-40"
        style={{
          background: "linear-gradient(135deg, #ef4444, #b91c1c)",
          boxShadow: "0 8px 32px rgba(239,68,68,0.45), 0 2px 8px rgba(0,0,0,0.4)"
        }}
      >
        <Plus size={22} className="text-white" strokeWidth={2.5} />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="w-full flex flex-col"
              style={{
                background: "linear-gradient(180deg, #14141f 0%, #0f0f18 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderBottom: "none",
                borderRadius: "24px 24px 0 0",
                maxHeight: "92vh",
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-zinc-700" />
              </div>

              {/* Header fixo */}
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Nova</p>
                  <h2 className="text-lg font-bold text-white tracking-tight">Adicionar dívida</h2>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <X size={16} className="text-zinc-400" />
                </button>
              </div>

              {/* Conteúdo com scroll */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4" style={{ overscrollBehavior: "contain" }}>

                {/* Nome */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Nome</label>
                  <div className="relative">
                    <CreditCard size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      value={form.nome}
                      onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                      placeholder="Ex: Cartão Nubank"
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onFocus={e => e.target.style.borderColor = "rgba(239,68,68,0.4)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                    />
                  </div>
                </div>

                {/* Valor */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Valor</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">R$</span>
                    <input
                      value={form.valor}
                      onChange={e => setForm(p => ({ ...p, valor: e.target.value }))}
                      placeholder="0,00"
                      type="number"
                      inputMode="decimal"
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onFocus={e => e.target.style.borderColor = "rgba(239,68,68,0.4)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                    />
                  </div>
                </div>

                {/* Vencimento */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Vencimento</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      value={form.vencimento}
                      onChange={e => setForm(p => ({ ...p, vencimento: e.target.value }))}
                      type="date"
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
                      onFocus={e => e.target.style.borderColor = "rgba(239,68,68,0.4)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                    />
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Categoria</label>
                  <div className="grid grid-cols-3 gap-2">
                    {categorias.map(c => (
                      <button key={c.label}
                        onClick={() => setForm(p => ({ ...p, categoria: c.label }))}
                        className="py-2.5 px-2 rounded-xl text-xs font-semibold transition-all active:scale-95 flex flex-col items-center gap-1"
                        style={form.categoria === c.label
                          ? { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#71717a" }
                        }>
                        <span className="text-base">{c.emoji}</span>
                        <span className="text-[10px]">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recorrente */}
                <div className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.05)" }}>
                      <RefreshCw size={14} className={form.recorrente ? "text-red-400" : "text-zinc-500"} />
                    </div>
                    <div>
                      <p className="text-sm text-white font-semibold">Recorrente</p>
                      <p className="text-xs text-zinc-500">Repete todo mês</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setForm(p => ({ ...p, recorrente: !p.recorrente }))}
                    className="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
                    style={{ background: form.recorrente ? "#ef4444" : "rgba(255,255,255,0.1)" }}>
                    <motion.div
                      animate={{ x: form.recorrente ? 24 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="w-5 h-5 rounded-full bg-white absolute top-0.5"
                      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
                    />
                  </button>
                </div>

                {/* Espaço extra no final para o botão fixo não cortar */}
                <div className="h-2" />
              </div>

              {/* Botão fixo no fundo */}
              <div className="flex-shrink-0 px-5 pt-3 pb-8"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,15,24,0.98)" }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={isLoading || !isFormValid}
                  className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-40"
                  style={{
                    background: isFormValid && !isLoading
                      ? "linear-gradient(135deg, #ef4444, #b91c1c)"
                      : "rgba(255,255,255,0.08)",
                    boxShadow: isFormValid && !isLoading ? "0 4px 20px rgba(239,68,68,0.35)" : "none"
                  }}
                >
                  {isLoading
                    ? <Loader2 size={18} className="animate-spin mx-auto" />
                    : "Salvar dívida"
                  }
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}