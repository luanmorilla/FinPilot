"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, CreditCard, Target, PiggyBank } from "lucide-react"
import Image from "next/image"
import { useFinn } from "@/components/finn/useFinn"
import FinnModal from "@/components/finn/FinnModal"
import FinnProvider from "@/components/finn/FinnProvider"

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/dividas", label: "Dívidas", icon: CreditCard },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/cofrinho", label: "Cofrinho", icon: PiggyBank },
]

function FinnButton() {
  const { open, isOpen } = useFinn()

  return (
    <button onClick={open} className="flex flex-col items-center">
      <motion.div
        whileTap={{ scale: 0.88 }}
        animate={{ y: isOpen ? 0 : [0, -4, 0] }}
        transition={{ duration: 2.5, repeat: isOpen ? 0 : Infinity, ease: "easeInOut" }}
        className="relative -mt-10 flex items-center justify-center"
        style={{
          width: 68,
          height: 68,
          borderRadius: 34,
          background: "linear-gradient(135deg, #7C4DFF, #3B82F6)",
          boxShadow: isOpen
            ? "0 0 0 3px rgba(124,77,255,0.5), 0 6px 28px rgba(124,77,255,0.7)"
            : "0 6px 24px rgba(124,77,255,0.55)",
          border: "3px solid rgba(255,255,255,0.12)",
        }}
      >
        <Image
          src="/images/finn-cabeca.png"
          alt="Finn"
          width={52}
          height={52}
          className="object-contain"
        />
      </motion.div>
      <span className="text-[9px] text-purple-400 font-semibold mt-1.5">Finn</span>
    </button>
  )
}

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <FinnProvider>
      <FinnModal />
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div
          style={{
            background: "rgba(10,10,20,0.92)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-around px-2 pt-2 pb-6">
            {navItems.slice(0, 2).map((item) => <NavItem key={item.href} item={item} pathname={pathname} />)}
            <FinnButton />
            {navItems.slice(2).map((item) => <NavItem key={item.href} item={item} pathname={pathname} />)}
          </div>
        </div>
      </div>
    </FinnProvider>
  )
}

function NavItem({ item, pathname }: { item: typeof navItems[0]; pathname: string }) {
  const isActive = pathname === item.href
  const Icon = item.icon

  return (
    <Link href={item.href} className="flex flex-col items-center gap-1 py-1 px-3">
      <motion.div whileTap={{ scale: 0.82 }}>
        <Icon size={20} className={isActive ? "text-purple-400" : "text-zinc-500"} />
      </motion.div>
      <span className={`text-[9px] font-medium ${isActive ? "text-purple-400" : "text-zinc-500"}`}>
        {item.label}
      </span>
      {isActive && (
        <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-purple-400" />
      )}
    </Link>
  )
}