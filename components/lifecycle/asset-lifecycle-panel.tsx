import type { LifecycleProfile } from "@/lib/lifecycle-intelligence";
import { LifecycleStageBadge } from "./infrastructure-memory-center";

export function AssetLifecyclePanel({
  profile,
}: {
  profile: LifecycleProfile;
}) {
  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Lifecycle intelligence
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950">
            {profile.stage.toLowerCase()} / {profile.maturity.toLowerCase()} maturity
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Operational age, runtime stability history, maturity, and lifecycle
            continuity risk for this asset.
          </p>
        </div>
        <LifecycleStageBadge stage={profile.stage} />
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LifecycleMetric label="Operational age" value={`${profile.ageDays} days`} />
        <LifecycleMetric label="Last updated" value={`${profile.daysSinceUpdate} days ago`} />
        <LifecycleMetric label="Runtime history" value={profile.runtimeStability} />
        <LifecycleMetric label="Monitoring maturity" value={profile.monitoringMaturity} />
      </dl>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <LifecycleMetric label="Events" value={profile.eventCount.toString()} />
        <LifecycleMetric label="Alert events" value={profile.alertEventCount.toString()} />
        <LifecycleMetric label="Degradation events" value={profile.degradationEventCount.toString()} />
      </div>

      <div className="mt-4 space-y-2">
        {profile.lifecycleRisks.length > 0 ? (
          profile.lifecycleRisks.map((risk) => (
            <div
              key={risk}
              className="rounded-xl border border-zinc-200/80 bg-white/70 p-3"
            >
              <p className="text-sm font-medium text-zinc-950">{risk}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Lifecycle intelligence flagged this as an operational
                continuity signal.
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 p-4">
            <p className="text-sm font-medium text-zinc-800">
              No lifecycle risk detected
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Historical posture does not currently show chronic operational
              risk.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function LifecycleMetric({ label, value }: { label: string; value: string }) {
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
