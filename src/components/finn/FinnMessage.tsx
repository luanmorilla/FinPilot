"use client";

import type { FinnMessage as FinnMessageType } from "./types";

interface Props {
  message: FinnMessageType;
}

export default function FinnMessage({
  message,
}: Props) {
  const isFinn = message.role === "assistant";

  return (
    <div
      className={`flex ${
        isFinn ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${
          isFinn
            ? "bg-zinc-800 text-white"
            : "bg-purple-600 text-white"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}