"use client";

import type { FinnMessage as FinnMessageType } from "./types";

interface Props {
  message: FinnMessageType;
}

function renderMarkdown(text: string): React.ReactNode {
  // Quebra em linhas e processa cada uma
  return text.split("\n").map((line, i) => {
    // Linha separadora
    if (line.trim() === "---") {
      return <hr key={i} className="border-white/10 my-2" />;
    }

    // Processa bold (**texto**) dentro da linha
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return (
      <span key={i} className="block">
        {parts}
        {i < text.split("\n").length - 1 ? null : null}
      </span>
    );
  });
}

export default function FinnMessage({ message }: Props) {
  const isFinn = message.role === "assistant";

  return (
    <div className={`flex ${isFinn ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
          isFinn ? "bg-zinc-800 text-white" : "bg-purple-600 text-white"
        }`}
      >
        {isFinn ? renderMarkdown(message.content) : message.content}
      </div>
    </div>
  );
}