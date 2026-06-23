"use client";

import { useState, useRef, useEffect } from "react";
import FinnMessage from "./FinnMessage";
import FinnSuggestions from "./FinnSuggestions";
import FinnTyping from "./FinnTyping";
import { useFinn } from "./useFinn";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FinnChat() {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, addMessage, isTyping, setTyping } = useFinn();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage(text: string) {
    if (!text.trim() || isTyping) return;

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
        content: "Não consegui responder agora. Tente novamente! 🙏",
        createdAt: new Date().toISOString(),
      });
    }

    setTyping(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FinnMessage message={message} />
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && <FinnTyping />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="shrink-0 px-4 pb-4 pt-3 space-y-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <FinnSuggestions onSelect={sendMessage} />
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Pergunte ao Finn..."
            disabled={isTyping}
            className="flex-1 rounded-2xl px-4 py-3 text-sm text-white outline-none disabled:opacity-50 transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-40 transition-all"
            style={{
              background: input.trim() && !isTyping
                ? "linear-gradient(135deg,#7C4DFF,#3B82F6)"
                : "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Send size={15} className="text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}