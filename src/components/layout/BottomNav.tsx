"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, CreditCard, Target, PiggyBank } from "lucide-react"
import Image from "next/image"

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/dividas", label: "Dívidas", icon: CreditCard },
  { href: "/finn", label: "Finn", icon: null },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/cofrinho", label: "Cofrinho", icon: PiggyBank },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div
        className="mx-auto max-w-lg"
        style={{
          background: "rgba(10,10,20,0.85)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const isFinn = item.href === "/finn"

            if (isFinn) {
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative -mt-6 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #7C4DFF, #3B82F6)",
                      boxShadow: "0 4px 20px rgba(124,77,255,0.5)",
                    }}
                  >
                    <Image
                      src="/images/finn-icon.png"
                      alt="Finn"
                      width={32}
                      height={32}
                      className="object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none"
                      }}
                    />
                    <span className="text-white text-lg absolute" style={{ display: "none" }}>🤖</span>
                  </motion.div>
                  <span className="text-[9px] text-purple-400 font-semibold mt-1">Finn</span>
                </Link>
              )
            }

            const Icon = item.icon!
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 py-1 px-3">
                <motion.div whileTap={{ scale: 0.85 }}>
                  <Icon
                    size={20}
                    className={isActive ? "text-purple-400" : "text-zinc-500"}
                  />
                </motion.div>
                <span
                  className={`text-[9px] font-medium ${isActive ? "text-purple-400" : "text-zinc-500"}`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="w-1 h-1 rounded-full bg-purple-400"
                  />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}