import { getAssetExpirySignal } from "@/lib/expiry-intelligence";
import type { AssetRiskProfile } from "@/lib/operational-risk";
import { RiskBadge } from "./dashboard-intelligence";

export function AssetRiskPanel({ profile }: { profile: AssetRiskProfile }) {
  const expiry = getAssetExpirySignal(profile.asset);

  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Operational risk
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950">
            {profile.score.toLowerCase()} risk / {profile.points} points
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Expiry, monitoring, ownership, metadata, and vault posture for this
            asset.
          </p>
        </div>
        <RiskBadge score={profile.score} />
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <RiskMetric label="Expiry" value={expiry.state} />
        <RiskMetric label="Runtime" value={profile.runtimeStatus} />
        <RiskMetric label="Warnings" value={profile.signals.length.toString()} />
      </dl>

      <div className="mt-4 space-y-2">
        {profile.signals.length > 0 ? (
          profile.signals.map((signal) => (
            <div
              key={signal.id}
              className="rounded-xl border border-zinc-200/80 bg-white/70 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zinc-950">
                  {signal.label}
                </p>
                <span className="text-xs font-medium text-zinc-500">
                  {signal.severity}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {signal.detail}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 p-4">
            <p className="text-sm font-medium text-zinc-800">
              No operational warnings
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              This asset has sufficient metadata and no current risk signal.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function RiskMetric({ label, value }: { label: string; value: string }) {
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
