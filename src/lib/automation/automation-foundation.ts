import "server-only";

import type {
  AutomationCategory,
  AutomationExecutionSource,
  AutomationExecutionStatus,
  AutomationSeverity,
  AutomationTriggerType,
  Prisma,
} from "@prisma/client";
import { createOperationalEvent } from "@/lib/operational-events-db";

export type AutomationRuleStatus =
  Prisma.AutomationRuleGetPayload<{}>["status"];

export type AutomationRuleSummary = {
  id: string;
  name: string;
  description: string;
  category: AutomationCategory;
  trigger: string;
  triggerType: AutomationTriggerType;
  action: string;
  owner: string;
  teamId: string | null;
  teamName: string;
  escalationOwner: string;
  status: AutomationRuleStatus;
  lastRun: string;
  nextRun: string;
  severity: AutomationSeverity;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  schedules: AutomationScheduleSummary[];
  triggers: AutomationTriggerSummary[];
  executionCount: number;
};

export type AutomationRuleDetail = AutomationRuleSummary & {
  executions: AutomationExecutionSummary[];
};

export type AutomationTriggerSummary = {
  id: string;
  type: AutomationTriggerType;
  label: string;
  enabled: boolean;
};

export type AutomationScheduleSummary = {
  id: string;
  label: string;
  cadence: string;
  timezone: string;
  nextRunAt: string;
  lastRunAt: string;
  enabled: boolean;
};

export type AutomationExecutionSummary = {
  id: string;
  ruleId: string;
  status: AutomationExecutionStatus;
  result: string;
  logs: string[];
  triggeredBy: string;
  source: AutomationExecutionSource;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  createdAt: string;
};

export type AutomationSection = {
  title: string;
  description: string;
  rules: AutomationRuleSummary[];
};

export type AutomationInput = {
  name: string;
  description: string;
  action: string;
  category: AutomationCategory;
  triggerType: AutomationTriggerType;
  triggerLabel: string;
  scheduleCadence: string;
  scheduleTimezone: string;
  scheduleNextRunAt: string;
  owner: string;
  teamId: string | null;
  escalationOwner: string;
  severity: AutomationSeverity;
  status: AutomationRuleStatus;
};

type RuleRecord = Prisma.AutomationRuleGetPayload<{
  include: {
    team: true;
    triggers: true;
    schedules: true;
    executions: { orderBy: { createdAt: "desc" }; take: 10 };
  };
}>;

export const automationStatuses: AutomationRuleStatus[] = [
  "ACTIVE",
  "PAUSED",
  "DRAFT",
  "FAILED",
  "DISABLED",
];

export const automationSeverities: AutomationSeverity[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

export const automationCategories: AutomationCategory[] = [
  "SCHEDULED_CHECKS",
  "RENEWAL_REMINDERS",
  "ALERT_ESCALATIONS",
  "COST_GOVERNANCE",
  "OWNERSHIP_FOLLOW_UPS",
  "OPERATIONAL_REVIEWS",
  "LIFECYCLE_GOVERNANCE",
];

export const automationTriggerTypes: AutomationTriggerType[] = [
  "SCHEDULE",
  "ALERT",
  "RENEWAL",
  "COST_THRESHOLD",
  "LIFECYCLE_CHANGE",
  "MANUAL",
];

const seedRules: AutomationInput[] = [
  {
    name: "Runtime health sweep",
    description: "Scheduled posture check foundation for configured assets.",
    category: "SCHEDULED_CHECKS",
    triggerType: "SCHEDULE",
    triggerLabel: "Every 15 minutes",
    action: "Record runtime posture and create governance visibility only.",
    owner: "DevOps",
    status: "ACTIVE",
    severity: "HIGH",
    escalationOwner: "Operations",
    teamId: null,
    scheduleCadence: "15 minutes",
    scheduleTimezone: "UTC",
    scheduleNextRunAt: "",
  },
  {
    name: "Renewal reminder sequence",
    description: "Renewal-aware notification foundation for owned assets.",
    category: "RENEWAL_REMINDERS",
    triggerType: "RENEWAL",
    triggerLabel: "60, 30, 14, and 7 days before renewal",
    action: "Create renewal governance reminder visibility for asset owners.",
    owner: "Finance",
    status: "DRAFT",
    severity: "HIGH",
    escalationOwner: "Renewal owner",
    teamId: null,
    scheduleCadence: "",
    scheduleTimezone: "UTC",
    scheduleNextRunAt: "",
  },
  {
    name: "Critical alert escalation",
    description: "Escalation foundation for unresolved critical alerts.",
    category: "ALERT_ESCALATIONS",
    triggerType: "ALERT",
    triggerLabel: "Critical alert remains unresolved",
    action: "Record escalation intent and notify operational owner in future phase.",
    owner: "Operations",
    status: "DRAFT",
    severity: "CRITICAL",
    escalationOwner: "Escalation owner",
    teamId: null,
    scheduleCadence: "",
    scheduleTimezone: "UTC",
    scheduleNextRunAt: "",
  },
  {
    name: "Provider spend threshold review",
    description: "FinOps review foundation for provider spend thresholds.",
    category: "COST_GOVERNANCE",
    triggerType: "COST_THRESHOLD",
    triggerLabel: "Provider exceeds configured monthly threshold",
    action: "Open FinOps review signal without changing provider resources.",
    owner: "Finance",
    status: "PAUSED",
    severity: "MEDIUM",
    escalationOwner: "Finance owner",
    teamId: null,
    scheduleCadence: "",
    scheduleTimezone: "UTC",
    scheduleNextRunAt: "",
  },
  {
    name: "Missing ownership follow-up",
    description: "Governance follow-up foundation for incomplete ownership.",
    category: "OWNERSHIP_FOLLOW_UPS",
    triggerType: "LIFECYCLE_CHANGE",
    triggerLabel: "Asset has missing team or operational owner",
    action: "Request owner assignment from administrators in a future notification phase.",
    owner: "Infrastructure",
    status: "ACTIVE",
    severity: "MEDIUM",
    escalationOwner: "Infrastructure owner",
    teamId: null,
    scheduleCadence: "",
    scheduleTimezone: "UTC",
    scheduleNextRunAt: "",
  },
  {
    name: "Monthly operational review",
    description: "Recurring operational review foundation for governance reporting.",
    category: "OPERATIONAL_REVIEWS",
    triggerType: "SCHEDULE",
    triggerLabel: "First day of each month",
    action: "Prepare review visibility for risk, lifecycle, runtime, and cost posture.",
    owner: "Operations",
    status: "DRAFT",
    severity: "LOW",
    escalationOwner: "Operations",
    teamId: null,
    scheduleCadence: "monthly",
    scheduleTimezone: "UTC",
    scheduleNextRunAt: "",
  },
];

async function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

export function automationInputFromFormData(formData: FormData): AutomationInput {
  const input = {
    name: textValue(formData, "name"),
    description: textValue(formData, "description"),
    action: textValue(formData, "action"),
    category: enumValue(
      formData,
      "category",
      automationCategories,
      "SCHEDULED_CHECKS",
    ),
    triggerType: enumValue(
      formData,
      "triggerType",
      automationTriggerTypes,
      "MANUAL",
    ),
    triggerLabel: textValue(formData, "triggerLabel"),
    scheduleCadence: textValue(formData, "scheduleCadence"),
    scheduleTimezone: textValue(formData, "scheduleTimezone") || "UTC",
    scheduleNextRunAt: textValue(formData, "scheduleNextRunAt"),
    owner: textValue(formData, "owner"),
    teamId: textValue(formData, "teamId") || null,
    escalationOwner: textValue(formData, "escalationOwner"),
    severity: enumValue(formData, "severity", automationSeverities, "MEDIUM"),
    status: enumValue(formData, "status", automationStatuses, "DRAFT"),
  };

  if (!input.name || !input.description || !input.action || !input.owner) {
    throw new Error("Automation name, description, action, and owner are required.");
  }

  if (!input.triggerLabel) {
    throw new Error("Automation trigger label is required.");
  }

  return input;
}

export async function ensureAutomationSeedRules() {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return;
  }

  const existing = await prisma.automationRule.count();

  if (existing > 0) {
    return;
  }

  for (const seedRule of seedRules) {
    await createAutomationRule(seedRule, "system", { skipAudit: true });
  }

  await createOperationalEvent({
    eventType: "SYSTEM_SEEDED",
    severity: "INFO",
    title: "Automation rules seeded",
    description: "Foundation automation rules were persisted to the database.",
    metadata: { count: seedRules.length },
    actor: "system",
    source: "SYSTEM",
  });
}

export async function listAutomationRules() {
  await ensureAutomationSeedRules();
  const prisma = await getPrismaClient();

  if (!prisma) {
    return seedRules.map(mapSeedRule);
  }

  const rules = await prisma.automationRule.findMany({
    where: { deletedAt: null },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: ruleInclude(),
  });

  return rules.map(mapRule);
}

export async function getAutomationRuleById(id: string) {
  await ensureAutomationSeedRules();
  const prisma = await getPrismaClient();

  if (!prisma) {
    return null;
  }

  const rule = await prisma.automationRule.findFirst({
    where: { id, deletedAt: null },
    include: ruleInclude(20),
  });

  return rule ? mapRuleDetail(rule) : null;
}

export async function createAutomationRule(
  input: AutomationInput,
  actor: string,
  options: { skipAudit?: boolean } = {},
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    throw new Error("Automation persistence requires DATABASE_URL.");
  }

  const rule = await prisma.automationRule.create({
    data: ruleData(input, actor),
    include: ruleInclude(),
  });

  if (!options.skipAudit) {
    await createOperationalEvent({
      eventType: "AUTOMATION_RULE_CREATED",
      severity: "INFO",
      title: `${rule.name} created`,
      description: "Automation rule was created in governance-safe mode.",
      metadata: { ruleId: rule.id, status: rule.status, category: rule.category },
      actor,
      source: "USER",
    });
  }

  return mapRule(rule);
}

export async function updateAutomationRule(
  id: string,
  input: AutomationInput,
  actor: string,
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    throw new Error("Automation persistence requires DATABASE_URL.");
  }

  const rule = await prisma.automationRule.update({
    where: { id },
    data: {
      ...ruleUpdateData(input, actor),
      updatedBy: actor,
      triggers: {
        deleteMany: {},
        create: triggerCreateData(input),
      },
      schedules: {
        deleteMany: {},
        create: scheduleCreateData(input),
      },
    },
    include: ruleInclude(),
  });

  await createOperationalEvent({
    eventType: "AUTOMATION_RULE_UPDATED",
    severity: "INFO",
    title: `${rule.name} updated`,
    description: "Automation rule metadata or lifecycle was updated.",
    metadata: { ruleId: rule.id, status: rule.status, category: rule.category },
    actor,
    source: "USER",
  });

  return mapRule(rule);
}

export async function updateAutomationRuleStatus(
  id: string,
  status: AutomationRuleStatus,
  actor: string,
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    throw new Error("Automation persistence requires DATABASE_URL.");
  }

  const rule = await prisma.automationRule.update({
    where: { id },
    data: { status, updatedBy: actor },
    include: ruleInclude(),
  });

  await createOperationalEvent({
    eventType:
      status === "DISABLED"
        ? "AUTOMATION_RULE_DISABLED"
        : "AUTOMATION_RULE_UPDATED",
    severity: status === "DISABLED" || status === "FAILED" ? "WARNING" : "INFO",
    title: `${rule.name} ${status.toLowerCase()}`,
    description: "Automation lifecycle state changed.",
    metadata: { ruleId: rule.id, status },
    actor,
    source: "USER",
  });

  return mapRule(rule);
}

export async function safeDeleteAutomationRule(id: string, actor: string) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    throw new Error("Automation persistence requires DATABASE_URL.");
  }

  const rule = await prisma.automationRule.update({
    where: { id },
    data: {
      status: "DISABLED",
      deletedAt: new Date(),
      deletedBy: actor,
      updatedBy: actor,
    },
  });

  await createOperationalEvent({
    eventType: "AUTOMATION_RULE_DELETED",
    severity: "WARNING",
    title: `${rule.name} safely deleted`,
    description: "Automation rule was disabled and removed from active views.",
    metadata: { ruleId: rule.id, deletedAt: rule.deletedAt?.toISOString() },
    actor,
    source: "USER",
  });
}

export async function recordAutomationExecution(
  id: string,
  actor: string,
  source: AutomationExecutionSource = "MANUAL",
) {
  const prisma = await getPrismaClient();

  if (!prisma) {
    throw new Error("Automation persistence requires DATABASE_URL.");
  }

  const rule = await prisma.automationRule.findUnique({
    where: { id },
    include: ruleInclude(),
  });

  if (!rule || rule.deletedAt) {
    throw new Error("Automation rule not found.");
  }

  const startedAt = new Date();
  const logs = buildSafeExecutionLogs(rule.name, rule.status);

  if (rule.status !== "ACTIVE") {
    const completedAt = new Date();
    const execution = await prisma.automationExecution.create({
      data: {
        ruleId: id,
        status: "BLOCKED",
        result: `Execution blocked because rule is ${rule.status}.`,
        logs,
        triggeredBy: actor,
        source,
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      },
    });
    await auditExecution(rule.name, execution, actor);
    return mapExecution(execution);
  }

  const completedAt = new Date();
  const execution = await prisma.automationExecution.create({
    data: {
      ruleId: id,
      status: "SUCCEEDED",
      result:
        "Safe execution foundation completed. No infrastructure mutations were performed.",
      logs,
      triggeredBy: actor,
      source,
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
    },
  });

  await prisma.automationSchedule.updateMany({
    where: { ruleId: id, enabled: true },
    data: { lastRunAt: completedAt },
  });
  await auditExecution(rule.name, execution, actor);

  return mapExecution(execution);
}

export function getAutomationSections(rules: AutomationRuleSummary[]) {
  return [
    section(
      "Scheduled checks",
      "Recurring infrastructure checks prepared for scheduler execution.",
      rules,
      ["SCHEDULED_CHECKS"],
    ),
    section(
      "Recurring governance",
      "Operational review and ownership follow-up jobs.",
      rules,
      ["OWNERSHIP_FOLLOW_UPS", "OPERATIONAL_REVIEWS", "LIFECYCLE_GOVERNANCE"],
    ),
    section(
      "Renewal reminders",
      "Renewal-aware automations for asset and provider billing windows.",
      rules,
      ["RENEWAL_REMINDERS"],
    ),
    section(
      "Escalation workflows",
      "Incident, alert, and spend escalation foundations.",
      rules,
      ["ALERT_ESCALATIONS", "COST_GOVERNANCE"],
    ),
  ];
}

export function getAutomationSummary(rules: AutomationRuleSummary[]) {
  return {
    total: rules.length,
    active: rules.filter((rule) => rule.status === "ACTIVE").length,
    draft: rules.filter((rule) => rule.status === "DRAFT").length,
    paused: rules.filter((rule) => rule.status === "PAUSED").length,
    critical: rules.filter((rule) => rule.severity === "CRITICAL").length,
  };
}

export function getSchedulerSnapshot(rules: AutomationRuleSummary[]) {
  const scheduled = rules.flatMap((rule) =>
    rule.schedules.map((schedule) => ({ rule, schedule })),
  );

  return {
    readyRules: scheduled.filter(
      ({ rule, schedule }) => rule.status === "ACTIVE" && schedule.enabled,
    ).length,
    pausedRules: scheduled.filter(({ rule }) => rule.status === "PAUSED").length,
    nextRun:
      scheduled
        .map(({ schedule }) => schedule.nextRunAt)
        .filter(Boolean)
        .sort()[0] ?? "Pending scheduler",
  };
}

function ruleInclude(take = 10) {
  return {
    team: true,
    triggers: { orderBy: { createdAt: "asc" } },
    schedules: { orderBy: { createdAt: "asc" } },
    executions: { orderBy: { createdAt: "desc" }, take },
  } satisfies Prisma.AutomationRuleInclude;
}

function ruleData(input: AutomationInput, actor: string): Prisma.AutomationRuleCreateInput {
  return {
    name: input.name,
    description: input.description,
    action: input.action,
    category: input.category,
    owner: input.owner,
    escalationOwner: input.escalationOwner || null,
    severity: input.severity,
    status: input.status,
    createdBy: actor,
    updatedBy: actor,
    team: input.teamId ? { connect: { id: input.teamId } } : undefined,
    triggers: { create: triggerCreateData(input) },
    schedules: { create: scheduleCreateData(input) },
  };
}

function ruleUpdateData(
  input: AutomationInput,
  actor: string,
): Prisma.AutomationRuleUpdateInput {
  return {
    name: input.name,
    description: input.description,
    action: input.action,
    category: input.category,
    owner: input.owner,
    escalationOwner: input.escalationOwner || null,
    severity: input.severity,
    status: input.status,
    updatedBy: actor,
    team: input.teamId ? { connect: { id: input.teamId } } : { disconnect: true },
  };
}

function triggerCreateData(input: AutomationInput) {
  return [
    {
      type: input.triggerType,
      label: input.triggerLabel,
      config: {
        boundary: "informational_governance_only",
        destructiveActionsAllowed: false,
      },
      enabled: true,
    },
  ];
}

function scheduleCreateData(input: AutomationInput) {
  if (input.triggerType !== "SCHEDULE" && !input.scheduleCadence) {
    return [];
  }

  return [
    {
      label: input.triggerLabel,
      cadence: input.scheduleCadence || input.triggerLabel,
      timezone: input.scheduleTimezone || "UTC",
      nextRunAt: dateOrNull(input.scheduleNextRunAt),
      enabled: input.status === "ACTIVE",
    },
  ];
}

function mapRule(rule: RuleRecord): AutomationRuleSummary {
  const latestExecution = rule.executions[0];
  const trigger = rule.triggers[0];
  const schedule = rule.schedules[0];

  return {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    category: rule.category,
    trigger: trigger?.label ?? "Manual",
    triggerType: trigger?.type ?? "MANUAL",
    action: rule.action,
    owner: rule.owner,
    teamId: rule.teamId,
    teamName: rule.team?.name ?? "Unassigned",
    escalationOwner: rule.escalationOwner ?? "",
    status: rule.status,
    lastRun: latestExecution?.createdAt.toISOString() ?? "",
    nextRun: schedule?.nextRunAt?.toISOString() ?? "",
    severity: rule.severity,
    createdBy: rule.createdBy ?? "system",
    updatedBy: rule.updatedBy ?? "system",
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    deletedAt: rule.deletedAt?.toISOString() ?? "",
    triggers: rule.triggers.map(mapTrigger),
    schedules: rule.schedules.map(mapSchedule),
    executionCount: rule.executions.length,
  };
}

function mapRuleDetail(rule: RuleRecord): AutomationRuleDetail {
  return {
    ...mapRule(rule),
    executions: rule.executions.map(mapExecution),
  };
}

function mapTrigger(trigger: RuleRecord["triggers"][number]): AutomationTriggerSummary {
  return {
    id: trigger.id,
    type: trigger.type,
    label: trigger.label,
    enabled: trigger.enabled,
  };
}

function mapSchedule(schedule: RuleRecord["schedules"][number]): AutomationScheduleSummary {
  return {
    id: schedule.id,
    label: schedule.label,
    cadence: schedule.cadence,
    timezone: schedule.timezone,
    nextRunAt: schedule.nextRunAt?.toISOString() ?? "",
    lastRunAt: schedule.lastRunAt?.toISOString() ?? "",
    enabled: schedule.enabled,
  };
}

function mapExecution(
  execution: RuleRecord["executions"][number],
): AutomationExecutionSummary {
  return {
    id: execution.id,
    ruleId: execution.ruleId,
    status: execution.status,
    result: execution.result ?? "",
    logs: Array.isArray(execution.logs)
      ? execution.logs.filter((line): line is string => typeof line === "string")
      : [],
    triggeredBy: execution.triggeredBy ?? "system",
    source: execution.source,
    startedAt: execution.startedAt?.toISOString() ?? "",
    completedAt: execution.completedAt?.toISOString() ?? "",
    durationMs: execution.durationMs ?? 0,
    createdAt: execution.createdAt.toISOString(),
  };
}

function mapSeedRule(input: AutomationInput, index: number): AutomationRuleSummary {
  return {
    id: `seed-${index}`,
    name: input.name,
    description: input.description,
    category: input.category,
    trigger: input.triggerLabel,
    triggerType: input.triggerType,
    action: input.action,
    owner: input.owner,
    teamId: null,
    teamName: "Unassigned",
    escalationOwner: input.escalationOwner,
    status: input.status,
    lastRun: "",
    nextRun: "",
    severity: input.severity,
    createdBy: "system",
    updatedBy: "system",
    createdAt: "",
    updatedAt: "",
    deletedAt: "",
    triggers: [],
    schedules: [],
    executionCount: 0,
  };
}

function section(
  title: string,
  description: string,
  rules: AutomationRuleSummary[],
  categories: AutomationCategory[],
): AutomationSection {
  return {
    title,
    description,
    rules: rules.filter((rule) => categories.includes(rule.category)),
  };
}

async function auditExecution(
  ruleName: string,
  execution: RuleRecord["executions"][number],
  actor: string,
) {
  await createOperationalEvent({
    eventType: "AUTOMATION_EXECUTION_RECORDED",
    severity: execution.status === "SUCCEEDED" ? "INFO" : "WARNING",
    title: `${ruleName} execution ${execution.status.toLowerCase()}`,
    description:
      "Automation execution was recorded within safe governance boundaries.",
    metadata: {
      ruleId: execution.ruleId,
      executionId: execution.id,
      status: execution.status,
      source: execution.source,
      durationMs: execution.durationMs,
      destructiveActionsAllowed: false,
    },
    actor,
    source: "USER",
  });
}

function buildSafeExecutionLogs(ruleName: string, status: AutomationRuleStatus) {
  return [
    `Execution requested for ${ruleName}.`,
    "Loaded automation rule and governance metadata.",
    `Rule lifecycle state is ${status}.`,
    "Applied safety boundary: no infrastructure mutation, no destructive remediation, no deployment.",
    "Recorded execution history and operational audit visibility.",
  ];
}

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function enumValue<T extends string>(
  formData: FormData,
  key: string,
  allowed: readonly T[],
  fallback: T,
) {
  const value = textValue(formData, key);
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function dateOrNull(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
