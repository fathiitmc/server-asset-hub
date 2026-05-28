import type { OperationalSignal } from "./operational-signals";

export type OperationalRecommendation = {
  id: string;
  title: string;
  detail: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export function getRecommendationsForSignals(
  signals: OperationalSignal[],
): OperationalRecommendation[] {
  const recommendations = new Map<string, OperationalRecommendation>();

  function add(recommendation: OperationalRecommendation) {
    recommendations.set(recommendation.id, recommendation);
  }

  for (const signal of signals) {
    if (signal.ruleId.includes("monitoring")) {
      add({
        id: "enable-monitoring",
        title: "Enable monitoring coverage",
        detail:
          "Run health checks and establish a recent runtime baseline for this infrastructure.",
        priority: signal.attentionLevel === "CRITICAL_ATTENTION" ? "CRITICAL" : "HIGH",
      });
    }

    if (signal.ruleId.includes("owner") || signal.ruleId.includes("orphaned")) {
      add({
        id: "assign-owner",
        title: "Assign operational ownership",
        detail:
          "Set a clear owner so renewal, runtime, and incident responsibility is traceable.",
        priority: "HIGH",
      });
    }

    if (signal.ruleId.includes("expiry") || signal.ruleId.includes("renewal")) {
      add({
        id: "review-expiry",
        title: "Review renewal window",
        detail:
          "Validate renewal date, payment owner, and provider access before the risk window closes.",
        priority: signal.attentionLevel === "CRITICAL_ATTENTION" ? "CRITICAL" : "HIGH",
      });
    }

    if (signal.ruleId.includes("runtime") || signal.ruleId.includes("degradation")) {
      add({
        id: "investigate-runtime",
        title: "Investigate runtime instability",
        detail:
          "Review recent health checks, response time changes, and provider status for this asset.",
        priority: "HIGH",
      });
    }

    if (signal.ruleId.includes("provider-concentration")) {
      add({
        id: "reduce-provider-concentration",
        title: "Review provider concentration",
        detail:
          "Assess whether critical production assets depend too heavily on a single provider.",
        priority: "MEDIUM",
      });
    }
  }

  return Array.from(recommendations.values()).sort(
    (a, b) => priorityRank(b.priority) - priorityRank(a.priority),
  );
}

function priorityRank(priority: OperationalRecommendation["priority"]) {
  const ranks: Record<OperationalRecommendation["priority"], number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  };

  return ranks[priority];
}
