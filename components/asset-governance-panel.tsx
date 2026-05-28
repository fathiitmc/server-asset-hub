import {
  archiveAssetAction,
  restoreAssetAction,
  updateAssetLifecycleAction,
} from "@/app/assets/actions";
import {
  assetLifecycleStates,
  type Asset,
  type AssetLifecycleState,
} from "@/lib/assets";
import { SubmitButton } from "./submit-button";

const lifecycleClasses: Record<AssetLifecycleState, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  MONITORING: "bg-sky-50 text-sky-700 ring-sky-200",
  EXPIRING: "bg-amber-50 text-amber-800 ring-amber-200",
  ARCHIVED: "bg-zinc-100 text-zinc-700 ring-zinc-300",
  RETIRED: "bg-stone-100 text-stone-700 ring-stone-300",
  SUSPENDED: "bg-red-50 text-red-700 ring-red-200",
};

export function LifecycleBadge({
  state,
}: {
  state: AssetLifecycleState;
}) {
  return (
    <span
      className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${lifecycleClasses[state]}`}
    >
      {state.replace("_", " ")}
    </span>
  );
}

export function AssetGovernancePanel({
  asset,
  canManage,
}: {
  asset: Asset;
  canManage: boolean;
}) {
  const lifecycleAction = updateAssetLifecycleAction.bind(null, asset.id);
  const archiveAction = archiveAssetAction.bind(null, asset.id);
  const restoreAction = restoreAssetAction.bind(null, asset.id);
  const isArchived = asset.lifecycleState === "ARCHIVED";

  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Governance
          </p>
          <h2 className="mt-2 text-base font-semibold text-zinc-950">
            Lifecycle control
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Operational state, archive custody, and protected action controls.
          </p>
        </div>
        <LifecycleBadge state={asset.lifecycleState} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Meta label="Lifecycle updated" value={formatTimestamp(asset.lifecycleUpdatedAt)} />
        <Meta label="Archived at" value={formatTimestamp(asset.archivedAt)} />
        <Meta label="Archived by" value={asset.archivedBy || "Not archived"} />
      </div>

      {asset.archiveReason ? (
        <div className="mt-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
            Archive reason
          </p>
          <p className="mt-1 text-sm leading-6 text-zinc-700">
            {asset.archiveReason}
          </p>
        </div>
      ) : null}

      {canManage ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {!isArchived ? (
            <form action={lifecycleAction} className="rounded-xl border border-zinc-200/80 bg-white/70 p-3">
              <label className="block text-sm font-medium text-zinc-700">
                Operational state
                <select
                  name="lifecycleState"
                  defaultValue={asset.lifecycleState}
                  className="premium-field mt-2 h-10 w-full rounded-xl px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                >
                  {assetLifecycleStates
                    .filter((state) => state !== "ARCHIVED")
                    .map((state) => (
                      <option key={state} value={state}>
                        {state.replace("_", " ")}
                      </option>
                    ))}
                </select>
              </label>
              <div className="mt-3">
                <SubmitButton pendingLabel="Updating state...">
                  Update state
                </SubmitButton>
              </div>
            </form>
          ) : null}

          {isArchived ? (
            <form action={restoreAction} className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
              <p className="text-sm font-semibold text-emerald-950">
                Restore archived asset
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                Restoration records an audit event and returns the asset to
                active lifecycle state.
              </p>
              <div className="mt-3">
                <SubmitButton pendingLabel="Restoring...">Restore asset</SubmitButton>
              </div>
            </form>
          ) : (
            <form action={archiveAction} className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
              <label className="block text-sm font-medium text-amber-950">
                Archive reason
                <textarea
                  name="archiveReason"
                  rows={3}
                  required
                  minLength={6}
                  placeholder="Why is this asset leaving active operation?"
                  className="mt-2 block w-full rounded-xl border border-amber-200 bg-white/80 px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                />
              </label>
              <div className="mt-3">
                <SubmitButton variant="danger" pendingLabel="Archiving...">
                  Archive asset
                </SubmitButton>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3">
          <p className="text-sm font-semibold text-zinc-950">
            Lifecycle actions restricted
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Your role can view governance history but cannot change lifecycle
            state.
          </p>
        </div>
      )}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-zinc-950">{value}</p>
    </div>
  );
}

function formatTimestamp(value: string) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
