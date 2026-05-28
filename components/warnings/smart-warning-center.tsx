import Link from "next/link";
import type { OperationalAttentionLevel } from "@/lib/attention-engine";
import { getRecommendationsForSignals } from "@/lib/operational-recommendations";
import type { OperationalSignal } from "@/lib/operational-signals";

export function SmartWarningCenter({ signals }: { signals: OperationalSignal[] }) {
  const critical = signals.filter(
    (signal) => signal.attentionLevel === "CRITICAL_ATTENTION",
  );
  const high = signals.filter(
    (signal) => signal.attentionLevel === "HIGH_ATTENTION",
  );
  const review = signals.filter(
    (signal) => signal.attentionLevel === "NEEDS_REVIEW",
  );
  const recommendations = getRecommendationsForSignals(signals).slice(0, 4);

  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Infrastructure Attention Center
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
            {critical.length > 0
              ? `${critical.length} critical operational signals`
              : high.length > 0
                ? `${high.length} high attention signals`
                : "No critical attention required"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Rule-based operational warnings, anomalies, monitoring gaps, expiry
            pressure, and governance recommendations.
          </p>
        </div>
        <AttentionBadge
          level={
            critical.length > 0
              ? "CRITICAL_ATTENTION"
              : high.length > 0
                ? "HIGH_ATTENTION"
                : review.length > 0
                  ? "NEEDS_REVIEW"
                  : "NORMAL"
          }
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SignalMetric label="Critical attention" value={critical.length} tone="critical" />
        <SignalMetric label="High attention" value={high.length} tone="warning" />
        <SignalMetric label="Needs review" value={review.length} tone="default" />
        <SignalMetric label="Total signals" value={signals.length} tone="default" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
          <h3 className="text-sm font-semibold text-zinc-950">
            Critical Operational Signals
          </h3>
          <div className="mt-3 space-y-2">
            {signals.slice(0, 6).length > 0 ? (
              signals.slice(0, 6).map((signal) => (
                <SignalRow key={signal.id} signal={signal} />
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-zinc-300/80 bg-white/70 p-3 text-sm text-zinc-500">
                No smart warning signals are active.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
          <h3 className="text-sm font-semibold text-zinc-950">
            Operational Recommendations
          </h3>
          <div className="mt-3 space-y-2">
            {recommendations.length > 0 ? (
              recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="rounded-xl border border-zinc-200/80 bg-white/80 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-zinc-950">
                      {recommendation.title}
                    </p>
                    <span className="text-xs font-medium text-zinc-500">
                      {recommendation.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {recommendation.detail}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-zinc-300/80 bg-white/70 p-3 text-sm text-zinc-500">
                No recommendations right now.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AttentionBadge({ level }: { level: OperationalAttentionLevel }) {
  const classes: Record<OperationalAttentionLevel, string> = {
    NORMAL: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    NEEDS_REVIEW: "bg-sky-50 text-sky-700 ring-sky-200",
    HIGH_ATTENTION: "bg-amber-50 text-amber-800 ring-amber-200",
    CRITICAL_ATTENTION: "bg-rose-950 text-white ring-rose-950",
  };

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset ${classes[level]}`}
    >
      {level.replace("_", " ")}
    </span>
  );
}

function SignalMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
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

function SignalRow({ signal }: { signal: OperationalSignal }) {
  const body = (
    <div className="rounded-xl border border-zinc-200/80 bg-white/80 p-3 transition hover:border-zinc-300 hover:bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-950">
            {signal.title}
          </p>
          <p className="mt-1 truncate text-xs text-zinc-500">
            {signal.category} / {signal.evidence}
          </p>
        </div>
        <AttentionBadge level={signal.attentionLevel} />
      </div>
    </div>
  );

  return signal.assetId ? (
    <Link href={`/assets/${signal.assetId}`}>{body}</Link>
  ) : (
    body
  );
}
