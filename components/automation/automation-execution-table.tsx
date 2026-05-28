import type { AutomationExecutionSummary } from "@/src/lib/automation/automation-foundation";
import {
  AutomationBadge,
  executionStatusClasses,
  formatAutomationLabel,
  formatAutomationTime,
} from "./automation-badges";

export function AutomationExecutionTable({
  executions,
}: {
  executions: AutomationExecutionSummary[];
}) {
  if (executions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 p-5">
        <p className="text-sm font-semibold text-zinc-950">
          No executions yet
        </p>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Manual runs and future scheduler records will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80">
      <table className="min-w-full divide-y divide-zinc-200/80 text-sm">
        <thead className="bg-zinc-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-500">
          <tr>
            <th className="px-4 py-3">Execution</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Duration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {executions.map((execution) => (
            <tr key={execution.id}>
              <td className="px-4 py-4">
                <p className="font-semibold text-zinc-950">
                  {formatAutomationTime(execution.createdAt)}
                </p>
                <p className="mt-1 max-w-md text-xs leading-5 text-zinc-500">
                  {execution.result}
                </p>
              </td>
              <td className="px-4 py-4">
                <AutomationBadge className={executionStatusClasses[execution.status]}>
                  {formatAutomationLabel(execution.status)}
                </AutomationBadge>
              </td>
              <td className="px-4 py-4 text-zinc-600">
                {formatAutomationLabel(execution.source)}
              </td>
              <td className="px-4 py-4 text-zinc-600">
                {execution.triggeredBy}
              </td>
              <td className="px-4 py-4 text-zinc-600">
                {execution.durationMs} ms
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AutomationExecutionTimeline({
  executions,
}: {
  executions: AutomationExecutionSummary[];
}) {
  return (
    <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-4 before:top-3 before:w-px before:bg-zinc-200">
      {executions.map((execution) => (
        <li key={execution.id} className="relative pl-10">
          <div className="absolute left-0 top-3 grid h-8 w-8 place-items-center rounded-full bg-zinc-950 text-xs font-semibold text-white shadow-sm shadow-zinc-950/10">
            E
          </div>
          <article className="rounded-xl border border-zinc-200/80 bg-white/75 p-3 shadow-sm shadow-zinc-950/[0.03]">
            <div className="flex flex-wrap items-center gap-2">
              <AutomationBadge className={executionStatusClasses[execution.status]}>
                {formatAutomationLabel(execution.status)}
              </AutomationBadge>
              <span className="text-xs text-zinc-500">
                {formatAutomationTime(execution.createdAt)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {execution.result || "Execution recorded."}
            </p>
            {execution.logs.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {execution.logs.map((log) => (
                  <li key={log} className="text-xs leading-5 text-zinc-500">
                    {log}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        </li>
      ))}
    </ol>
  );
}
