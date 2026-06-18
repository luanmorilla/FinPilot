"use client";

import { motion } from "framer-motion";

export default function FinnTyping() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <span className="text-xs text-zinc-400">
        Finn está digitando...
      </span>

      <div className="flex gap-1">
        {[0, 1, 2].map((dot) => (
          <motion.div
            key={dot}
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: dot * 0.15,
            }}
            className="w-2 h-2 rounded-full bg-purple-400"
          />
        ))}
      </div>
    </div>
  );
}