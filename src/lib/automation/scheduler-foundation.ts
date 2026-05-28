import "server-only";

import type { AutomationRuleSummary } from "./automation-foundation";

export type SchedulerCandidate = {
  ruleId: string;
  ruleName: string;
  scheduleId: string;
  cadence: string;
  nextRunAt: string;
  status: "READY" | "WAITING" | "PAUSED";
};

export function getSchedulerCandidates(
  rules: AutomationRuleSummary[],
  now = new Date(),
): SchedulerCandidate[] {
  return rules.flatMap((rule) =>
    rule.schedules.map((schedule) => {
      const nextRunAt = schedule.nextRunAt
        ? new Date(schedule.nextRunAt)
        : null;
      const ready =
        rule.status === "ACTIVE" &&
        schedule.enabled &&
        nextRunAt !== null &&
        nextRunAt.getTime() <= now.getTime();

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        scheduleId: schedule.id,
        cadence: schedule.cadence,
        nextRunAt: schedule.nextRunAt,
        status:
          rule.status !== "ACTIVE"
            ? "PAUSED"
            : ready
              ? "READY"
              : "WAITING",
      };
    }),
  );
}

export function describeSchedulerBoundary() {
  return {
    mode: "in-process foundation",
    queue: "none",
    workers: "none",
    execution: "manual recording and future scheduler candidates only",
    allowedActions: [
      "record execution history",
      "create operational audit visibility",
      "evaluate schedule readiness",
    ],
    blockedActions: [
      "destructive remediation",
      "infrastructure mutation",
      "auto-deployment",
      "external workflow orchestration",
    ],
  };
}
