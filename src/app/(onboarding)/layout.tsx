// src/app/(onboarding)/layout.tsx

export default function OnboardingLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        {children}
      </main>
    )
  }