"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, DollarSign, Calendar, CheckCircle, Loader2, ChevronRight } from "lucide-react"
import { onboardingSchema, type OnboardingInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const frequencias = [
  { value: "MENSAL", label: "Mensal", desc: "Recebo uma vez por mês", icon: "📅" },
  { value: "QUINZENAL", label: "Quinzenal", desc: "Recebo a cada 15 dias", icon: "🗓️" },
  { value: "SEMANAL", label: "Semanal", desc: "Recebo toda semana", icon: "📆" },
  { value: "DUAS_VEZES_MES", label: "2x por mês", desc: "Recebo em duas datas fixas", icon: "💰" },
  { value: "PERSONALIZADO", label: "Personalizado", desc: "Defino minhas próprias datas", icon: "⚙️" },
]

const diasSemana = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"]
const diasMes = Array.from({ length: 31 }, (_, i) => i + 1)

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFrequencia, setSelectedFrequencia] = useState("")
  const [selectedDias, setSelectedDias] = useState<number[]>([])
  const [selectedDiaSemana, setSelectedDiaSemana] = useState<number | null>(null)
  const [selectedDiaFixo, setSelectedDiaFixo] = useState<number | null>(null)

  const { setValue, watch, handleSubmit, formState: { errors } } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
  })

  const salario = watch("salario")

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const amount = parseFloat(numbers) / 100
    if (isNaN(amount)) return ""
    return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  }

  const toggleDia = (dia: number) => {
    const novo = selectedDias.includes(dia)
      ? selectedDias.filter(d => d !== dia)
      : [...selectedDias, dia].sort((a, b) => a - b)
    setSelectedDias(novo)
    setValue("diasPagamento", novo)
  }

  const podeAvancar = () => {
    if (!selectedFrequencia) return false
    if (selectedFrequencia === "MENSAL" && !selectedDiaFixo) return false
    if (selectedFrequencia === "SEMANAL" && selectedDiaSemana === null) return false
    if (selectedFrequencia === "QUINZENAL" && selectedDias.length !== 2) return false
    if (selectedFrequencia === "DUAS_VEZES_MES" && selectedDias.length !== 2) return false
    return true
  }

  const onSubmit = async (data: OnboardingInput) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setStep(4)
        setTimeout(() => router.push("/dashboard"), 2000)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1,2,3,4].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step >= s ? "bg-emerald-500 text-slate-950" : "bg-white/10 text-slate-500"}`}>
              {step > s ? "✓" : s}
            </div>
            {i < 3 && <div className={`w-8 h-0.5 transition-all duration-300 ${step > s ? "bg-emerald-500" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1 */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <TrendingUp className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Bem-vindo ao <span className="text-emerald-400">FinPilot</span></h1>
            <p className="text-slate-400 text-lg mb-2">Seu copiloto financeiro inteligente</p>
            <p className="text-slate-500 text-sm mb-10 max-w-sm mx-auto">Vamos configurar seu perfil. Leva menos de 2 minutos.</p>
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[{emoji:"🛡️",label:"Proteção"},{emoji:"🎯",label:"Metas"},{emoji:"📊",label:"Visão real"}].map(i => (
                <div key={i.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-2xl mb-2">{i.emoji}</div>
                  <p className="text-slate-400 text-xs">{i.label}</p>
                </div>
              ))}
            </div>
            <Button onClick={() => setStep(2)} className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-lg">
              Começar <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* STEP 2 — Salário */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Qual é o seu salário?</h2>
                  <p className="text-slate-400 text-sm">Valor líquido que você recebe</p>
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-slate-300 text-sm">Salário mensal líquido</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                  <Input
                    type="text"
                    placeholder="0,00"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-14 rounded-xl pl-10 text-xl font-semibold"
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      e.target.value = formatted
                      const numbers = e.target.value.replace(/\D/g, "")
                      setValue("salario", parseFloat(numbers) / 100)
                    }}
                  />
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-emerald-400 text-sm">💡 Seus dados são privados e criptografados.</p>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 border-white/10 text-slate-300 hover:bg-white/5 rounded-xl">Voltar</Button>
                <Button onClick={() => { if (salario && salario > 0) setStep(3) }} className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl">
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3 — Frequência + Dias */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Com que frequência você recebe?</h2>
                  <p className="text-slate-400 text-sm">Selecione e informe as datas</p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {frequencias.map((freq) => (
                  <button
                    key={freq.value}
                    type="button"
                    onClick={() => {
                      setSelectedFrequencia(freq.value)
                      setSelectedDias([])
                      setSelectedDiaSemana(null)
                      setSelectedDiaFixo(null)
                      setValue("frequenciaPagamento", freq.value as OnboardingInput["frequenciaPagamento"])
                      setValue("diasPagamento", [])
                      setValue("diaFixo", undefined)
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${selectedFrequencia === freq.value ? "bg-emerald-500/10 border-emerald-500/40" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                  >
                    <span className="text-xl">{freq.icon}</span>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${selectedFrequencia === freq.value ? "text-emerald-400" : "text-white"}`}>{freq.label}</p>
                      <p className="text-xs text-slate-400">{freq.desc}</p>
                    </div>
                    {selectedFrequencia === freq.value && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  </button>
                ))}
              </div>

              {/* MENSAL — escolher dia do mês */}
              <AnimatePresence>
                {selectedFrequencia === "MENSAL" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5">
                    <p className="text-slate-300 text-sm mb-3">Qual dia do mês você recebe?</p>
                    <div className="grid grid-cols-7 gap-2">
                      {diasMes.map(d => (
                        <button key={d} type="button" onClick={() => { setSelectedDiaFixo(d); setValue("diaFixo", d) }}
                          className={`h-9 rounded-lg text-sm font-medium transition-all ${selectedDiaFixo === d ? "bg-emerald-500 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* SEMANAL — escolher dia da semana */}
                {selectedFrequencia === "SEMANAL" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5">
                    <p className="text-slate-300 text-sm mb-3">Qual dia da semana você recebe?</p>
                    <div className="grid grid-cols-4 gap-2">
                      {diasSemana.map((d, i) => (
                        <button key={d} type="button" onClick={() => { setSelectedDiaSemana(i); setValue("diaFixo", i) }}
                          className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${selectedDiaSemana === i ? "bg-emerald-500 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* QUINZENAL / 2x por mês — escolher 2 dias */}
                {(selectedFrequencia === "QUINZENAL" || selectedFrequencia === "DUAS_VEZES_MES") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5">
                    <p className="text-slate-300 text-sm mb-1">Escolha os 2 dias do mês que você recebe:</p>
                    <p className="text-slate-500 text-xs mb-3">{selectedDias.length}/2 selecionados</p>
                    <div className="grid grid-cols-7 gap-2">
                      {diasMes.map(d => (
                        <button key={d} type="button"
                          onClick={() => { if (selectedDias.includes(d) || selectedDias.length < 2) toggleDia(d) }}
                          disabled={!selectedDias.includes(d) && selectedDias.length >= 2}
                          className={`h-9 rounded-lg text-sm font-medium transition-all ${selectedDias.includes(d) ? "bg-emerald-500 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30"}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* PERSONALIZADO */}
                {selectedFrequencia === "PERSONALIZADO" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5">
                    <p className="text-slate-300 text-sm mb-3">Selecione todos os dias que você recebe:</p>
                    <div className="grid grid-cols-7 gap-2">
                      {diasMes.map(d => (
                        <button key={d} type="button" onClick={() => toggleDia(d)}
                          className={`h-9 rounded-lg text-sm font-medium transition-all ${selectedDias.includes(d) ? "bg-emerald-500 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-12 border-white/10 text-slate-300 hover:bg-white/5 rounded-xl">Voltar</Button>
                <Button onClick={handleSubmit(onSubmit)} disabled={!podeAvancar() || isLoading} className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Finalizar <ChevronRight className="w-4 h-4 ml-1" /></>}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4 — Sucesso */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-3">Tudo pronto! 🎉</h2>
            <p className="text-slate-400 text-lg mb-2">Perfil configurado com sucesso</p>
            <p className="text-slate-500 text-sm">Redirecionando para o dashboard...</p>
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto mt-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}