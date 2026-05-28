import Link from "next/link";
import { acknowledgeAlertAction } from "@/app/dashboard/alerts/actions";
import type { ActiveAlert, AlertSeverity } from "@/src/lib/alerts/alerts";

type AlertCenterProps = {
  alerts: ActiveAlert[];
};

const severityClasses: Record<AlertSeverity, string> = {
  INFO: "bg-sky-50 text-sky-700 ring-sky-200",
  WARNING: "bg-amber-50 text-amber-800 ring-amber-200",
  CRITICAL: "bg-red-50 text-red-700 ring-red-200",
};

const severityDotClasses: Record<AlertSeverity, string> = {
  INFO: "bg-sky-500",
  WARNING: "bg-amber-500",
  CRITICAL: "bg-red-600",
};

export function AlertCenter({ alerts }: AlertCenterProps) {
  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">
            Alert center
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Active renewal and runtime warnings generated from current asset
            state.
          </p>
        </div>
        <span className="inline-flex rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
          {alerts.length} active
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {alerts.length > 0 ? (
          alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 p-5">
            <p className="text-sm font-medium text-zinc-800">No active alerts</p>
            <p className="mt-1 text-sm text-zinc-500">
              Renewal and runtime alert queues are clear.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function AlertCard({ alert }: { alert: ActiveAlert }) {
  const acknowledgeAction = acknowledgeAlertAction.bind(null, alert.id);

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/75 p-4 shadow-sm shadow-zinc-950/[0.03] transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${severityDotClasses[alert.severity]}`}
            />
            <span
              className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${severityClasses[alert.severity]}`}
            >
              {alert.severity}
            </span>
            <span className="text-xs font-medium text-zinc-500">
              {alert.type.replace("_", " ")}
            </span>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-zinc-950">
            {alert.title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            {alert.message}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {alert.assetId ? (
              <Link
                href={`/assets/${alert.assetId}`}
                className="font-medium text-zinc-700 hover:text-zinc-950"
              >
                {alert.assetName ?? "Affected asset"}
              </Link>
            ) : (
              "System alert"
            )}{" "}
            / {new Date(alert.createdAt).toLocaleString("en")}
          </p>
        </div>
        <form action={acknowledgeAction}>
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-300/80 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            Acknowledge
          </button>
        </form>
      </div>
    </div>
  );
}
