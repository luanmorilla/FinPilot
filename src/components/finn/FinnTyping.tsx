"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function FinnTyping() {
  return (
    <div className="flex gap-2.5 items-end">
      <div
        className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#7C4DFF,#3B82F6)" }}
      >
        <Image src="/images/finn-cabeca.png" alt="Finn" width={18} height={18} className="object-contain" />
      </div>
      <div
        className="flex items-center gap-1.5 px-4 py-3 rounded-3xl rounded-tl-sm"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {[0, 1, 2].map((dot) => (
          <motion.div
            key={dot}
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: dot * 0.15 }}
            className="w-1.5 h-1.5 rounded-full bg-purple-400"
          />
        ))}
      </div>
    </div>
  );
}