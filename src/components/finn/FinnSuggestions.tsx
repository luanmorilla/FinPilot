"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onSelect: (prompt: string) => void;
}

const suggestions = [
  "Qual dívida devo pagar primeiro?",
  "Como guardar mais dinheiro?",
  "Como atingir minhas metas mais rápido?",
  "Analise minha situação financeira",
  "Monte um plano de 30 dias",
  "Estou gastando demais?",
];

export default function FinnSuggestions({ onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
        style={{
          background: open ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.05)",
          border: open ? "1px solid rgba(168,85,247,0.35)" : "1px solid rgba(255,255,255,0.08)",
          color: open ? "#c084fc" : "rgba(255,255,255,0.4)",
        }}
      >
        <Sparkles size={10} />
        Sugestões
        {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => { onSelect(item); setOpen(false); }}
                  className="px-3 py-2 rounded-xl text-xs text-zinc-300 transition-all active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}