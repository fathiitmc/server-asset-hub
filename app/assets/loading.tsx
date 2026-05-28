import { AppShell } from "@/components/app-shell";

export default function AssetsLoading() {
  return (
    <AppShell>
      <div className="mb-6">
        <div className="h-9 w-36 animate-pulse rounded-xl bg-zinc-200/80" />
        <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded-lg bg-zinc-200/70" />
      </div>
      <div className="premium-panel mb-4 grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_180px_180px_auto]">
        <div className="h-10 animate-pulse rounded-xl bg-zinc-200/70" />
        <div className="h-10 animate-pulse rounded-xl bg-zinc-200/70" />
        <div className="h-10 animate-pulse rounded-xl bg-zinc-200/70" />
        <div className="h-10 animate-pulse rounded-xl bg-zinc-200/70" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-4 gap-4 border-b border-zinc-100 p-4 last:border-b-0"
          >
            <div className="h-4 animate-pulse rounded-lg bg-zinc-200/70" />
            <div className="h-4 animate-pulse rounded-lg bg-zinc-200/60" />
            <div className="h-4 animate-pulse rounded-lg bg-zinc-200/60" />
            <div className="h-4 animate-pulse rounded-lg bg-zinc-200/60" />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
