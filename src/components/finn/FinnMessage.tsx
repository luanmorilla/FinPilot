"use client";

import type { FinnMessage as FinnMessageType } from "./types";
import Image from "next/image";

function renderMarkdown(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "---") return <hr key={i} className="border-white/10 my-2" />;
    if (line.startsWith("• ") || line.startsWith("- ")) {
      return (
        <span key={i} className="flex gap-2 items-start block mb-1">
          <span className="text-purple-400 mt-0.5">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </span>
      );
    }
    return <span key={i} className="block mb-0.5">{renderInline(line)}</span>;
  });
}

function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>
      : part
  );
}

export default function FinnMessage({ message }: { message: FinnMessageType }) {
  const isFinn = message.role === "assistant";

  return (
    <div className={`flex gap-2.5 ${isFinn ? "justify-start" : "justify-end"}`}>
      {isFinn && (
        <div
          className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
          style={{ background: "linear-gradient(135deg,#7C4DFF,#3B82F6)" }}
        >
          <Image src="/images/finn-cabeca.png" alt="Finn" width={18} height={18} className="object-contain" />
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
          isFinn
            ? "rounded-tl-sm text-zinc-200"
            : "rounded-tr-sm text-white"
        }`}
        style={
          isFinn
            ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
            : { background: "linear-gradient(135deg,#7C4DFF,#3B82F6)" }
        }
      >
        {isFinn ? renderMarkdown(message.content) : message.content}
      </div>
    </div>
  );
}