import { AppShell } from "@/components/app-shell";

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="mb-6">
        <div className="h-9 w-48 animate-pulse rounded-xl bg-zinc-200/80" />
        <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded-lg bg-zinc-200/70" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <SkeletonPanel className="h-56" />
        <SkeletonPanel className="h-56" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SkeletonPanel className="h-72" />
          <SkeletonPanel className="h-80" />
        </div>
        <div className="space-y-6">
          <SkeletonPanel className="h-64" />
          <SkeletonPanel className="h-44" />
          <SkeletonPanel className="h-64" />
        </div>
      </div>
    </AppShell>
  );
}

function SkeletonPanel({ className }: { className: string }) {
  return (
    <div className={`premium-panel rounded-2xl p-5 ${className}`}>
      <div className="h-4 w-28 animate-pulse rounded-lg bg-zinc-200/80" />
      <div className="mt-4 space-y-3">
        <div className="h-4 w-full animate-pulse rounded-lg bg-zinc-200/60" />
        <div className="h-4 w-2/3 animate-pulse rounded-lg bg-zinc-200/60" />
      </div>
    </div>
  );
}
