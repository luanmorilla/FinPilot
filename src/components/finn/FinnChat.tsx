"use client";

import { useState, useRef, useEffect } from "react";
import FinnMessage from "./FinnMessage";
import FinnSuggestions from "./FinnSuggestions";
import FinnTyping from "./FinnTyping";
import { useFinn } from "./useFinn";

export default function FinnChat() {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, addMessage, isTyping, setTyping } = useFinn();

  // Auto-scroll sempre que chegar mensagem nova ou o Finn começar a digitar
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;

    addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    });

    setInput("");
    setTyping(true);

    try {
      const response = await fetch("/api/finn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        createdAt: new Date().toISOString(),
      });
    } catch {
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Não consegui responder agora. Tente novamente.",
        createdAt: new Date().toISOString(),
      });
    }

    setTyping(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <FinnMessage key={message.id} message={message} />
        ))}
        {isTyping && <FinnTyping />}
        {/* Âncora invisível para o scroll */}
        <div ref={bottomRef} />
      </div>

      {/* Input fixo no fundo */}
      <div className="shrink-0 border-t border-white/10 p-4 space-y-3">
        <FinnSuggestions onSelect={sendMessage} />
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Pergunte ao Finn..."
            className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
          />
          <button
            onClick={() => sendMessage(input)}
            className="px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}