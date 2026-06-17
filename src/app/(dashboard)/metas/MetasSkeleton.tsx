"use client";
// src/app/(dashboard)/metas/MetasSkeleton.tsx

export function MetasSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-32 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-3 w-48 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
          <div className="h-10 w-32 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
          ))}
        </div>

        <div className="h-20 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />

        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-20 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}