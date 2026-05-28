import Link from "next/link";
import type { ExpirySignal } from "@/lib/expiry-intelligence";
import type { AssetRiskProfile } from "@/lib/operational-risk";

type DashboardIntelligenceProps = {
  expirySignals: ExpirySignal[];
  riskProfiles: AssetRiskProfile[];
};

export function DashboardIntelligence({
  expirySignals,
  riskProfiles,
}: DashboardIntelligenceProps) {
  const expiringSoon = expirySignals.filter(
    (signal) => signal.state === "WARNING" || signal.state === "CRITICAL",
  );
  const expired = expirySignals.filter((signal) => signal.state === "EXPIRED");
  const criticalRisks = riskProfiles.filter(
    (profile) => profile.score === "CRITICAL" || profile.score === "HIGH",
  );
  const unhealthy = riskProfiles.filter(
    (profile) =>
      profile.runtimeStatus === "OFFLINE" || profile.runtimeStatus === "DEGRADED",
  );
  const missingOwnership = riskProfiles.filter((profile) =>
    profile.signals.some((signal) => signal.id === "missing-owner"),
  );
  const monitoringGaps = riskProfiles.filter((profile) =>
    profile.signals.some((signal) => signal.id === "monitoring-gap"),
  );

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <IntelligenceCard
        label="Expiring soon"
        value={expiringSoon.length}
        tone={expiringSoon.length > 0 ? "warning" : "healthy"}
        href="/assets?status=RENEW_SOON"
      />
      <IntelligenceCard
        label="Expired"
        value={expired.length}
        tone={expired.length > 0 ? "critical" : "healthy"}
        href="/assets?status=EXPIRED"
      />
      <IntelligenceCard
        label="Critical risks"
        value={criticalRisks.length}
        tone={criticalRisks.length > 0 ? "critical" : "healthy"}
        href="#risk-center"
      />
      <IntelligenceCard
        label="Unhealthy assets"
        value={unhealthy.length}
        tone={unhealthy.length > 0 ? "danger" : "healthy"}
        href="#monitoring"
      />
      <IntelligenceCard
        label="Monitoring gaps"
        value={monitoringGaps.length + missingOwnership.length}
        tone={monitoringGaps.length + missingOwnership.length > 0 ? "warning" : "healthy"}
        href="#risk-center"
      />
    </section>
  );
}

export function RiskCenter({ profiles }: { profiles: AssetRiskProfile[] }) {
  const topProfiles = profiles
    .filter((profile) => profile.signals.length > 0)
    .slice(0, 5);

  return (
    <section id="risk-center" className="premium-panel scroll-mt-24 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">
            Critical Infrastructure Risks
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Governance, expiry, monitoring, and metadata blind spots.
          </p>
        </div>
        <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
          {topProfiles.length} tracked
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {topProfiles.length > 0 ? (
          topProfiles.map((profile) => (
            <RiskRow key={profile.asset.id} profile={profile} />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 p-4">
            <p className="text-sm font-medium text-zinc-800">No risk signals</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Assets have sufficient ownership, metadata, expiry posture, and
              runtime signals.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function IntelligenceCard({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: number;
  tone: "healthy" | "warning" | "danger" | "critical";
  href: string;
}) {
  const classes = {
    healthy: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-red-700",
    critical: "text-rose-950",
  };

  return (
    <Link
      href={href}
      className="rounded-2xl border border-zinc-200/80 bg-white/75 p-4 shadow-sm shadow-zinc-950/[0.03] transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-zinc-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${classes[tone]}`}>
        {value}
      </p>
    </Link>
  );
}

function RiskRow({ profile }: { profile: AssetRiskProfile }) {
  const primary = profile.signals[0];

  return (
    <Link
      href={`/assets/${profile.asset.id}`}
      className="block rounded-xl border border-zinc-200/80 bg-white/70 p-3 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-950">
            {profile.asset.name}
          </p>
          <p className="mt-1 truncate text-xs text-zinc-500">
            {primary?.label ?? "Risk signal"} / {primary?.detail ?? "Review asset"}
          </p>
        </div>
        <RiskBadge score={profile.score} />
      </div>
    </Link>
  );
}

export function RiskBadge({ score }: { score: AssetRiskProfile["score"] }) {
  const classes = {
    LOW: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    MEDIUM: "bg-amber-50 text-amber-800 ring-amber-200",
    HIGH: "bg-red-50 text-red-700 ring-red-200",
    CRITICAL: "bg-rose-950 text-white ring-rose-950",
  };

  return (
    <span
      className={`rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${classes[score]}`}
    >
      {score}
    </span>
  );
}
