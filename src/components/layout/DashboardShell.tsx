"use client";

import FinnProvider from "@/components/finn/FinnProvider";
import FinnModal from "@/components/finn/FinnModal";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FinnProvider>
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0a0a0f",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
            zIndex: 0,
          }}
        >
          <div style={{
            position: "absolute", top: -160, left: -160,
            width: 384, height: 384, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)",
            filter: "blur(40px)",
          }} />
          <div style={{
            position: "absolute", top: "50%", right: -160,
            width: 320, height: 320, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)",
            filter: "blur(40px)",
          }} />
          <div style={{
            position: "absolute", bottom: -80, left: "33%",
            width: 288, height: 288, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)",
            filter: "blur(40px)",
          }} />
        </div>

        <main style={{ position: "relative", zIndex: 10, paddingBottom: 96, minHeight: "100vh" }}>
          {children}
        </main>

        <BottomNav />
        <FinnModal />
      </div>
    </FinnProvider>
  );
}