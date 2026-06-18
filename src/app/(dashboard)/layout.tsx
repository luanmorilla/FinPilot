import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import BottomNav from "@/components/layout/BottomNav";

import FinnProvider from "@/components/finn/FinnProvider";
import FinnModal from "@/components/finn/FinnModal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <FinnProvider>
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Ambient background glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        {/* Main content */}
        <main className="relative z-10 pb-24 min-h-screen">
          {children}
        </main>

        <BottomNav />

        <FinnModal />
      </div>
    </FinnProvider>
  );
}