"use client";

import FinnChat from "@/components/finn/FinnChat";

export default function ConsultorPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">

        <div className="border-b border-white/10 p-5">
          <h1 className="text-2xl font-bold">
            Finn
          </h1>

          <p className="text-zinc-400 text-sm mt-1">
            Seu copiloto financeiro inteligente
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <FinnChat />
        </div>

      </div>
    </div>
  );
}