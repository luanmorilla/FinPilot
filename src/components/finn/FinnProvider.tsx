"use client";

import { useEffect } from "react";
import { useFinn } from "./useFinn";

export default function FinnProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { messages, addMessage } = useFinn();

  useEffect(() => {
    if (messages.length > 0) return;

    addMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Olá 👋 Eu sou o Finn, seu copiloto financeiro. Posso ajudar você a organizar dívidas, atingir metas, criar hábitos financeiros e guardar mais dinheiro.",
      createdAt: new Date().toISOString(),
    });
  }, [messages.length, addMessage]);

  return <>{children}</>;
}