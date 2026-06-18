"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  LayoutDashboard,
  CreditCard,
  Target,
  PiggyBank,
} from "lucide-react";

import { useFinn } from "@/components/finn/useFinn";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { href: "/dividas", icon: CreditCard, label: "Dívidas" },
  { href: "/consultor", icon: null, label: "Finn", isCenter: true },
  { href: "/metas", icon: Target, label: "Metas" },
  { href: "/cofrinho", icon: PiggyBank, label: "Cofrinho" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { open } = useFinn();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-3 mb-3 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href));

            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <button
                  key={item.href}
                  onClick={open}
                  className="relative -mt-8"
                >
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    className="relative flex flex-col items-center"
                  >
                    {/* Onda 1 */}
                    <motion.div
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.4, 0.7, 0.4],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 rounded-full bg-purple-500/40 blur-md"
                    />

                    {/* Onda 2 */}
                    <motion.div
                      animate={{
                        scale: [1, 1.25, 1],
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.3,
                      }}
                      className="absolute inset-0 rounded-full bg-blue-500/30 blur-lg"
                    />

                    {/* Botão Finn */}
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/40 border-2 border-white/10 overflow-hidden"
                    >
                      <Image
                        src="/images/finn-cabeca.png"
                        alt="Finn"
                        width={64}
                        height={64}
                        className="object-contain scale-125"
                        priority
                      />
                    </motion.div>

                    <span className="text-[10px] font-medium mt-1 text-purple-400">
                      Finn
                    </span>
                  </motion.div>
                </button>
              );
            }

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="flex flex-col items-center gap-1 px-3 py-1 min-w-[52px]"
                >
                  <div
                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-500/15"
                        : "bg-transparent"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-xl bg-emerald-500/15"
                        transition={{
                          type: "spring",
                          duration: 0.4,
                        }}
                      />
                    )}

                    {Icon && (
                      <Icon
                        size={20}
                        className={`relative z-10 transition-colors duration-200 ${
                          isActive
                            ? "text-emerald-400"
                            : "text-zinc-500"
                        }`}
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-medium transition-colors duration-200 ${
                      isActive
                        ? "text-emerald-400"
                        : "text-zinc-500"
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}