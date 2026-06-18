"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useFinn } from "./useFinn";
import FinnChat from "./FinnChat";

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
            className="fixed inset-0 bg-black/70 z-[999]"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 250,
            }}
            className="fixed inset-0 z-[1000] bg-[#0a0a0f] flex flex-col"
          >
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-5">
              <div>
                <h2 className="font-bold text-white">
                  Finn
                </h2>

                <p className="text-xs text-zinc-400">
                  Seu copiloto financeiro
                </p>
              </div>

              <button onClick={close}>
                <X className="text-white" />
              </button>
            </div>

            <div className="flex-1">
              <FinnChat />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}