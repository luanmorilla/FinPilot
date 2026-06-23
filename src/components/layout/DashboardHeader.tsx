"use client"

import { motion } from "framer-motion"
import { Bell, Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

interface DashboardHeaderProps {
  alertasNaoLidos?: number
  userName?: string
  userImage?: string
}

export default function DashboardHeader({
  alertasNaoLidos = 0,
  userName,
  userImage,
}: DashboardHeaderProps) {
  const firstName = userName ? userName.split(" ")[0] : "você"
  const initials = firstName.slice(0, 2).toUpperCase()
  const [date, setDate] = useState("")

  useEffect(() => {
    setDate(
      new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    )
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between px-5 pt-14 pb-4"
    >
      <div>
        <h1 className="text-2xl font-bold text-white leading-tight">
          Olá, {firstName} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-0.5 capitalize">{date}</p>
      </div>

      <div className="flex items-center gap-2.5">
        <Link href="/consultor">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Search size={17} className="text-slate-400" />
          </motion.div>
        </Link>

        <Link href="/alertas">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="relative w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Bell size={17} className="text-slate-400" />
            {alertasNaoLidos > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg,#6D5DFD,#3B82F6)" }}
              >
                {alertasNaoLidos > 9 ? "9+" : alertasNaoLidos}
              </span>
            )}
          </motion.div>
        </Link>

        <Link href="/perfil">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-sm text-white shadow-lg"
            style={{
              background: userImage
                ? "transparent"
                : "linear-gradient(135deg,#7C4DFF,#3B82F6)",
              boxShadow: "0 4px 16px rgba(124,77,255,0.3)",
            }}
          >
            {userImage ? (
              <Image
                src={userImage}
                alt={firstName}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              initials
            )}
          </motion.div>
        </Link>
      </div>
    </motion.header>
  )
}