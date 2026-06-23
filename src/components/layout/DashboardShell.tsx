"use client"

import React from "react"
import BottomNav from "./BottomNav"

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}