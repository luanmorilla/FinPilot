"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, CreditCard, ChevronRight, Trash2, X, Loader2, Calendar, DollarSign, Tag, RefreshCw } from "lucide-react"

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
  if (dias < 0) return { label: "Vencida!", cor: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-400" }
  if (dias === 0) return { label: "Hoje!", cor: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-400 animate-pulse" }
  if (dias <= 3) return { label: `${dias}d`, cor: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400" }
  if (dias <= 7) return { label: `${dias}d`, cor: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", dot: "bg-yellow-400" }
  return { label: `${dias}d`, cor: "text-zinc-400", bg: "bg-zinc-800/50", border: "border-white/5", dot: "bg-zinc-600" }
}

const categorias = ["Moradia", "Transporte", "Alimentação", "Saúde", "Educação", "Lazer", "Assinatura", "Cartão", "Outros"]

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

  return (
    <div className="flex flex-col min-h-screen pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-white">Dívidas</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Controle seus compromissos financeiros</p>
      </div>

      {/* Resumo */}
      <div className="mx-4 grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-1">Pendente</p>
          <p className="text-xl font-bold text-white">{formatBRL(totalPendente)}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-1">Pago</p>
          <p className="text-xl font-bold text-white">{formatBRL(totalPago)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mx-4 flex gap-2 mb-4">
        {(["todas", "pendentes", "pagas"] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize ${filtro === f ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="mx-4 space-y-2.5">
        <AnimatePresence>
          {dividasFiltradas.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <CreditCard size={40} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">Nenhuma dívida aqui</p>
              <p className="text-zinc-600 text-sm mt-1">Toque no + para adicionar</p>
            </motion.div>
          ) : (
            dividasFiltradas.map((d, i) => {
              const dias = getDiasRestantes(d.vencimento)
              const urg = getUrgencia(dias)
              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.05 }}>
                  <div className={`rounded-2xl p-4 ${urg.bg} border ${urg.border}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${d.paga ? "bg-emerald-400" : urg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${d.paga ? "line-through text-zinc-500" : "text-white"}`}>{d.nome}</p>
                          {d.recorrente && <RefreshCw size={10} className="text-zinc-500 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-500">{d.categoria}</span>
                          <span className="text-[10px] text-zinc-600">•</span>
                          <span className={`text-[10px] font-medium ${d.paga ? "text-emerald-400" : urg.cor}`}>
                            {d.paga ? "Pago" : urg.label}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-white">{formatBRL(d.valor)}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {new Date(d.vencimento).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    {!d.paga && (
                      <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <button onClick={() => handlePagar(d.id)}
                          className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 transition-all"
                          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                          ✓ Marcar como pago
                        </button>
                        <button onClick={() => handleDeletar(d.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Botão adicionar */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl z-40"
        style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 8px 24px rgba(239,68,68,0.4)" }}
      >
        <Plus size={24} className="text-white" />
      </motion.button>

      {/* Modal adicionar dívida */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-lg rounded-t-3xl p-6 pb-10"
              style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }}>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Nova dívida</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <X size={16} className="text-zinc-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Nome da dívida</label>
                  <div className="relative">
                    <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      value={form.nome}
                      onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                      placeholder="Ex: Cartão Nubank"
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                </div>

                {/* Valor */}
                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Valor</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      value={form.valor}
                      onChange={e => setForm(p => ({ ...p, valor: e.target.value }))}
                      placeholder="0,00"
                      type="number"
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                </div>

                {/* Vencimento */}
                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Data de vencimento</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      value={form.vencimento}
                      onChange={e => setForm(p => ({ ...p, vencimento: e.target.value }))}
                      type="date"
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
                    />
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Categoria</label>
                  <div className="relative">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <select
                      value={form.categoria}
                      onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white outline-none appearance-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {categorias.map(c => <option key={c} value={c} style={{ background: "#111118" }}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Recorrente */}
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="text-sm text-white font-medium">Recorrente</p>
                    <p className="text-xs text-zinc-500">Repete todo mês</p>
                  </div>
                  <button
                    onClick={() => setForm(p => ({ ...p, recorrente: !p.recorrente }))}
                    className={`w-12 h-6 rounded-full transition-all relative ${form.recorrente ? "bg-emerald-500" : "bg-zinc-700"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${form.recorrente ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>

                {/* Botão salvar */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !form.nome || !form.valor || !form.vencimento}
                  className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
                  {isLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Salvar dívida"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}