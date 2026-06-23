"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
      <p className="text-red-400 text-sm font-medium">Algo deu errado</p>
      <p className="text-zinc-500 text-xs text-center">{error.message}</p>
      <button
        onClick={reset}
        className="text-xs text-emerald-400 border border-emerald-400/20 rounded-xl px-4 py-2"
      >
        Tentar novamente
      </button>
    </div>
  );
}