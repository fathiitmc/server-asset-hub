import Link from "next/link";
import type { RuntimeIntelligenceProfile } from "@/lib/runtime-intelligence";
import { formatRuntimeMetric } from "@/lib/runtime-intelligence";

export function RuntimeHealthCenter({
  profiles,
}: {
  profiles: RuntimeIntelligenceProfile[];
}) {
  const offline = profiles.filter((profile) => profile.healthScore === "OFFLINE");
  const degraded = profiles.filter(
    (profile) =>
      profile.healthScore === "DEGRADED" ||
      profile.healthScore === "UNSTABLE" ||
      profile.healthScore === "CRITICAL",
  );
  const slowest = profiles
    .filter((profile) => profile.averageResponseTime !== null)
    .sort((a, b) => (b.averageResponseTime ?? 0) - (a.averageResponseTime ?? 0))
    .slice(0, 4);
  const averageResponseTimes = profiles
    .map((profile) => profile.averageResponseTime)
    .filter((value): value is number => typeof value === "number");
  const averageResponseTime =
    averageResponseTimes.length > 0
      ? Math.round(
          averageResponseTimes.reduce((sum, value) => sum + value, 0) /
            averageResponseTimes.length,
        )
      : null;
  const checks = profiles.reduce((sum, profile) => sum + profile.checkCount, 0);
  const healthy = profiles.filter((profile) => profile.healthScore === "HEALTHY");

  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Infrastructure Health Center
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
            {offline.length > 0
              ? `${offline.length} assets offline`
              : degraded.length > 0
                ? `${degraded.length} assets need runtime attention`
                : "Runtime posture stable"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Runtime scoring from recent health checks, response times, and
            instability patterns.
          </p>
        </div>
        <span className="rounded-lg bg-zinc-950 px-2.5 py-1.5 text-xs font-medium text-white">
          {healthy.length}/{profiles.length} healthy
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RuntimeMetric label="Offline" value={offline.length.toString()} tone="critical" />
        <RuntimeMetric label="Degraded" value={degraded.length.toString()} tone="warning" />
        <RuntimeMetric
          label="Avg response"
          value={formatRuntimeMetric(averageResponseTime)}
          tone="default"
        />
        <RuntimeMetric label="Checks analyzed" value={checks.toString()} tone="default" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <RuntimeList
          title="Degraded Infrastructure"
          profiles={degraded.slice(0, 5)}
          empty="No degraded infrastructure detected."
        />
        <RuntimeList
          title="Slowest Assets"
          profiles={slowest}
          empty="No response time data yet."
          showResponse
        />
      </div>
    </section>
  );
}

function RuntimeMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "warning" | "critical";
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

function RuntimeList({
  title,
  profiles,
  empty,
  showResponse = false,
}: {
  title: string;
  profiles: RuntimeIntelligenceProfile[];
  empty: string;
  showResponse?: boolean;
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
                  {showResponse
                    ? formatRuntimeMetric(profile.averageResponseTime)
                    : `${profile.healthScore} / ${profile.trend}`}
                </p>
              </div>
              <RuntimeScoreBadge score={profile.healthScore} />
            </Link>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300/80 bg-white/70 p-3 text-sm text-zinc-500">
            {empty}
          </p>
        )}
      </div>
    </div>
  );
}

export function RuntimeScoreBadge({
  score,
}: {
  score: RuntimeIntelligenceProfile["healthScore"];
}) {
  const classes = {
    HEALTHY: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    DEGRADED: "bg-amber-50 text-amber-800 ring-amber-200",
    UNSTABLE: "bg-orange-50 text-orange-700 ring-orange-200",
    CRITICAL: "bg-red-50 text-red-700 ring-red-200",
    OFFLINE: "bg-rose-950 text-white ring-rose-950",
  };

  return (
    <span
      className={`rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${classes[score]}`}
    >
      {score}
    </span>
  );
}
