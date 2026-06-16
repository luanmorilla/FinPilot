// src/app/(auth)/layout.tsx
// Layout compartilhado das páginas de login e registro

export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        {children}
      </main>
    )
  }