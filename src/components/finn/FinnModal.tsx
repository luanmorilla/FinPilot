"use client";

import { X, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useFinn } from "./useFinn";
import FinnChat from "./FinnChat";
import Image from "next/image";

export default function FinnModal() {
  const { isOpen, close } = useFinn();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/60 z-[999] backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed inset-x-0 top-0 z-[1000] flex flex-col"
            style={{
              bottom: 80,
              background: "linear-gradient(180deg, #0d0a1a 0%, #0a0a0f 100%)",
              borderTop: "1px solid rgba(124,77,255,0.2)",
            }}
          >
            {/* Header */}
            <div
              className="shrink-0 h-16 flex items-center justify-between px-5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#7C4DFF,#3B82F6)" }}
                >
                  <Image
                    src="/images/finn-cabeca.png"
                    alt="Finn"
                    width={26}
                    height={26}
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-bold text-white text-sm">Finn</h2>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-zinc-400">Copiloto financeiro inteligente</p>
                </div>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <X size={14} className="text-zinc-400" />
              </button>
            </div>

            {/* Chat */}
            <div className="flex-1 min-h-0">
              <FinnChat />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}