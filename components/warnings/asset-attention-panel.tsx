import { AttentionBadge } from "@/components/warnings/smart-warning-center";
import { classifyAttentionLevel } from "@/lib/attention-engine";
import { getRecommendationsForSignals } from "@/lib/operational-recommendations";
import type { OperationalSignal } from "@/lib/operational-signals";
import type { AssetRiskProfile } from "@/lib/operational-risk";
import type { RuntimeIntelligenceProfile } from "@/lib/runtime-intelligence";

export function AssetAttentionPanel({
  signals,
  riskProfile,
  runtimeProfile,
}: {
  signals: OperationalSignal[];
  riskProfile: AssetRiskProfile;
  runtimeProfile: RuntimeIntelligenceProfile;
}) {
  const attentionLevel = classifyAttentionLevel({
    riskScore: riskProfile.score,
    expiryState: riskProfile.expiryState,
    runtimeProfile,
    signalCount: signals.length,
  });
  const recommendations = getRecommendationsForSignals(signals);

  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Operational attention
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950">
            {attentionLevel.toLowerCase().replace("_", " ")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Warning summary, attention level, and recommended operational review
            actions for this asset.
          </p>
        </div>
        <AttentionBadge level={attentionLevel} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <AttentionMetric label="Signals" value={signals.length.toString()} />
        <AttentionMetric label="Risk" value={riskProfile.score} />
        <AttentionMetric label="Runtime" value={runtimeProfile.healthScore} />
      </div>

      <div className="mt-4 space-y-2">
        {signals.length > 0 ? (
          signals.map((signal) => (
            <div
              key={signal.id}
              className="rounded-xl border border-zinc-200/80 bg-white/70 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zinc-950">
                  {signal.title}
                </p>
                <span className="text-xs font-medium text-zinc-500">
                  {signal.category}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {signal.description}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 p-4">
            <p className="text-sm font-medium text-zinc-800">
              No active attention signals
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              This asset has no current smart warning rules firing.
            </p>
          </div>
        )}
      </div>

      {recommendations.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4">
          <h3 className="text-sm font-semibold text-zinc-950">
            Recommendations
          </h3>
          <div className="mt-3 space-y-2">
            {recommendations.map((recommendation) => (
              <div key={recommendation.id}>
                <p className="text-sm font-medium text-zinc-800">
                  {recommendation.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  {recommendation.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AttentionMetric({ label, value }: { label: string; value: string }) {
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
