"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  onSelect: (prompt: string) => void;
}

const suggestions = [
  "Qual dívida devo pagar primeiro?",
  "Como guardar mais dinheiro?",
  "Como atingir minhas metas mais rápido?",
  "Analise minha situação financeira",
  "Monte um plano financeiro de 30 dias",
  "Estou gastando demais?",
];

export default function FinnSuggestions({ onSelect }: Props) {
  const [open, setOpen] = useState(false);

  function handleSelect(item: string) {
    onSelect(item);
    setOpen(false); // fecha ao escolher
  }

  return (
    <div>
      {/* Botão toggle — sempre visível */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
        style={{
          background: open ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.06)",
          border: open ? "1px solid rgba(168,85,247,0.35)" : "1px solid rgba(255,255,255,0.08)",
          color: open ? "#c084fc" : "rgba(255,255,255,0.45)",
        }}
      >
        <Sparkles size={11} />
        Sugestões
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {/* Lista — só aparece quando aberto */}
      {open && (
        <div className="flex flex-wrap gap-2 mt-2">
          {suggestions.map((item) => (
            <button
              key={item}
              onClick={() => handleSelect(item)}
              className="px-3 py-2 rounded-xl text-xs text-white transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}