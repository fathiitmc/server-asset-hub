import {
  formatRuntimeMetric,
  type RuntimeIntelligenceProfile,
} from "@/lib/runtime-intelligence";
import { formatCheckedAt } from "@/src/lib/monitoring/health";
import { RuntimeScoreBadge } from "./runtime-health-center";

export function AssetRuntimePanel({
  profile,
}: {
  profile: RuntimeIntelligenceProfile;
}) {
  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Runtime intelligence
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950">
            {profile.healthScore.toLowerCase()} posture / {profile.trend.toLowerCase()} trend
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Health scoring from recent monitoring history, response times, and
            runtime stability.
          </p>
        </div>
        <RuntimeScoreBadge score={profile.healthScore} />
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RuntimeMetric label="Uptime" value={profile.uptimePercentage === null ? "No data" : `${profile.uptimePercentage}%`} />
        <RuntimeMetric label="Avg response" value={formatRuntimeMetric(profile.averageResponseTime)} />
        <RuntimeMetric label="Checks" value={profile.checkCount.toString()} />
        <RuntimeMetric label="Last checked" value={formatCheckedAt(profile.latestCheckedAt)} />
      </dl>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <RuntimeDetail label="Offline checks" value={profile.offlineCount.toString()} />
        <RuntimeDetail label="Degraded checks" value={profile.degradedCount.toString()} />
        <RuntimeDetail label="Consistency" value={profile.monitoringConsistency} />
      </div>
    </section>
  );
}

function RuntimeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-3">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-zinc-950">
        {value}
      </dd>
    </div>
  );
}

function RuntimeDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50/80 px-3 py-2">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-zinc-950">{value}</dd>
    </div>
  );
}
