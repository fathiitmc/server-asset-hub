import Link from "next/link";
import {
  eventSeverityClasses,
  eventSeverityDotClasses,
  eventSourceClasses,
  formatEventTime,
  getOperationalEventIcon,
  operationalEventLabels,
  type OperationalEventSummary,
} from "@/lib/operational-events";

type OperationalTimelineProps = {
  title: string;
  description?: string;
  events: OperationalEventSummary[];
  emptyTitle?: string;
  emptyDescription?: string;
  compact?: boolean;
};

export function OperationalTimeline({
  title,
  description,
  events,
  emptyTitle = "No operational events",
  emptyDescription = "Activity will appear here as assets change.",
  compact = false,
}: OperationalTimelineProps) {
  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              {description}
            </p>
          ) : null}
        </div>
        <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
          {events.length} events
        </span>
      </div>

      <div className="mt-5">
        {events.length > 0 ? (
          <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-4 before:top-3 before:w-px before:bg-zinc-200">
            {events.map((event) => (
              <TimelineEvent key={event.id} event={event} compact={compact} />
            ))}
          </ol>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 p-5">
            <p className="text-sm font-medium text-zinc-800">{emptyTitle}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {emptyDescription}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function TimelineEvent({
  event,
  compact,
}: {
  event: OperationalEventSummary;
  compact: boolean;
}) {
  return (
    <li className="relative pl-10">
      <div
        className={`absolute left-0 top-3 grid h-8 w-8 place-items-center rounded-full text-xs font-semibold text-white shadow-sm shadow-zinc-950/10 ${
          event.severity === "CRITICAL"
            ? "bg-red-600"
            : event.severity === "WARNING"
              ? "bg-amber-500"
              : "bg-zinc-950"
        }`}
      >
        {getOperationalEventIcon(event.eventType)}
      </div>
      <article className="rounded-xl border border-zinc-200/80 bg-white/75 p-3 shadow-sm shadow-zinc-950/[0.03] transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${eventSeverityDotClasses[event.severity]}`}
              />
              <span className="text-xs font-medium text-zinc-500">
                {operationalEventLabels[event.eventType]}
              </span>
              <Badge className={eventSeverityClasses[event.severity]}>
                {event.severity}
              </Badge>
              <Badge className={eventSourceClasses[event.source]}>
                {event.source.replace("_", " ")}
              </Badge>
            </div>
            <h3 className="mt-2 truncate text-sm font-semibold text-zinc-950">
              {event.title}
            </h3>
            {!compact ? (
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                {event.description}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-zinc-500">
              {event.assetId ? (
                <Link
                  href={`/assets/${event.assetId}`}
                  className="font-medium text-zinc-700 hover:text-zinc-950"
                >
                  {event.assetName ?? "Linked asset"}
                </Link>
              ) : (
                event.assetName ?? "System"
              )}{" "}
              / {formatEventTime(event.createdAt)}
              {event.actor ? ` / ${event.actor}` : ""}
            </p>
          </div>
        </div>
      </article>
    </li>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}
