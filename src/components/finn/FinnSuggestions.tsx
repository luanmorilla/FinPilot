"use client";

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

export default function FinnSuggestions({
  onSelect,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((item) => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-white transition-all"
        >
          {item}
        </button>
      ))}
    </div>
  );
}