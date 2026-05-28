import Link from "next/link";
import type { InfrastructureMemorySummary } from "@/lib/infrastructure-memory";
import type { LifecycleProfile } from "@/lib/lifecycle-intelligence";
import type { LifecycleRiskSummary } from "@/lib/lifecycle-risk";
import type { OperationalHistoryProfile } from "@/lib/operational-history";

export function InfrastructureMemoryCenter({
  memory,
  risks,
  history,
}: {
  memory: InfrastructureMemorySummary;
  risks: LifecycleRiskSummary;
  history: OperationalHistoryProfile;
}) {
  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Infrastructure Memory Center
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
            {risks.chronicRisk.length} chronic risks / {history.totalEvents} events remembered
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Lifecycle posture, historical runtime behavior, operational aging,
            and infrastructure continuity signals.
          </p>
        </div>
        <span className="rounded-lg bg-zinc-950 px-2.5 py-1.5 text-xs font-medium text-white">
          lifecycle memory
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MemoryMetric label="Oldest assets" value={memory.oldestInfrastructure.length.toString()} />
        <MemoryMetric label="Unstable assets" value={risks.unstableAssets.length.toString()} tone="warning" />
        <MemoryMetric label="Legacy unmanaged" value={risks.legacyUnmanaged.length.toString()} tone="warning" />
        <MemoryMetric label="Critical history" value={history.criticalEvents.toString()} tone="critical" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <LifecycleList title="Operational Aging" profiles={memory.oldestInfrastructure} detail="age" />
        <LifecycleList title="Stability History" profiles={memory.mostUnstableAssets} detail="stability" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <LifecycleList title="Highest Alert Frequency" profiles={memory.highestAlertFrequency} detail="alerts" />
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
          <h3 className="text-sm font-semibold text-zinc-950">
            Lifecycle Maturity Distribution
          </h3>
          <div className="mt-3 space-y-3">
            {memory.stageDistribution.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-zinc-700">{item.label}</span>
                  <span className="text-zinc-500">{item.count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200/80">
                  <div
                    className="h-full rounded-full bg-zinc-950"
                    style={{
                      width: `${Math.max(
                        8,
                        Math.round(
                          (item.count /
                            Math.max(
                              1,
                              memory.stageDistribution.reduce(
                                (sum, value) => sum + value.count,
                                0,
                              ),
                            )) *
                            100,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MemoryMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "critical";
}) {
  const classes = {
    default: "text-zinc-950",
    warning: "text-amber-700",
    critical: "text-red-700",
  };

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-zinc-400">
        {label}
      </p>
      <p className={`mt-2 text-xl font-semibold ${classes[tone]}`}>{value}</p>
    </div>
  );
}

function LifecycleList({
  title,
  profiles,
  detail,
}: {
  title: string;
  profiles: LifecycleProfile[];
  detail: "age" | "stability" | "alerts";
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      <div className="mt-3 space-y-2">
        {profiles.length > 0 ? (
          profiles.map((profile) => (
            <Link
              key={profile.asset.id}
              href={`/assets/${profile.asset.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white/80 p-3 transition hover:border-zinc-300 hover:bg-white"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-950">
                  {profile.asset.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {detail === "age"
                    ? `${profile.ageDays} days old`
                    : detail === "stability"
                      ? `${profile.runtimeStability} / ${profile.degradationEventCount} degradation events`
                      : `${profile.alertEventCount} alert events`}
                </p>
              </div>
              <LifecycleStageBadge stage={profile.stage} />
            </Link>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300/80 bg-white/70 p-3 text-sm text-zinc-500">
            No lifecycle history yet.
          </p>
        )}
      </div>
    </div>
  );
}

export function LifecycleStageBadge({
  stage,
}: {
  stage: LifecycleProfile["stage"];
}) {
  const classes = {
    NEW: "bg-sky-50 text-sky-700 ring-sky-200",
    ACTIVE: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    STABLE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    DEGRADED: "bg-amber-50 text-amber-800 ring-amber-200",
    LEGACY: "bg-orange-50 text-orange-700 ring-orange-200",
    CRITICAL: "bg-rose-950 text-white ring-rose-950",
  };

  return (
    <span
      className={`rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${classes[stage]}`}
    >
      {stage}
    </span>
  );
}
