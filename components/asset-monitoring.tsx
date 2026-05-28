import { runAssetHealthCheckAction } from "@/app/assets/[id]/monitoring/actions";
import { HealthBadge } from "./health-badge";
import { SubmitButton } from "./submit-button";
import {
  formatCheckedAt,
  formatResponseTime,
  type AssetHealthSnapshot,
} from "@/src/lib/monitoring/health";

type AssetMonitoringProps = {
  assetId: string;
  latestStatus: AssetHealthSnapshot | null;
  recentChecks: AssetHealthSnapshot[];
};

export function AssetMonitoring({
  assetId,
  latestStatus,
  recentChecks,
}: AssetMonitoringProps) {
  const checkAction = runAssetHealthCheckAction.bind(null, assetId);
  const status = latestStatus?.status ?? "UNKNOWN";

  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">Monitoring</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Run a lightweight HTTP health check for this asset.
          </p>
        </div>
        <form action={checkAction}>
          <SubmitButton pendingLabel="Checking...">Run health check</SubmitButton>
        </form>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <HealthMetric label="Status" value={<HealthBadge status={status} />} />
        <HealthMetric
          label="Response time"
          value={formatResponseTime(latestStatus?.responseTime ?? null)}
        />
        <HealthMetric
          label="Last checked"
          value={formatCheckedAt(latestStatus?.checkedAt ?? null)}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4">
        <h3 className="text-sm font-semibold text-zinc-950">Recent checks</h3>
        <div className="mt-3 space-y-2">
          {recentChecks.length > 0 ? (
            recentChecks.map((check) => (
              <div
                key={`${check.assetId}-${check.checkedAt}`}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <HealthBadge status={check.status} />
                  <span className="text-zinc-500">
                    {formatCheckedAt(check.checkedAt)}
                  </span>
                </div>
                <span className="font-medium text-zinc-700">
                  {formatResponseTime(check.responseTime)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No checks have run yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function HealthMetric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/75 p-4">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <div className="mt-2 text-sm font-semibold text-zinc-950">{value}</div>
    </div>
  );
}
