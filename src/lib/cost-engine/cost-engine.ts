import type { Asset } from "@/lib/assets";

export type CostInsightSeverity = "INFO" | "WARNING" | "CRITICAL";

export type AssetCostProfile = {
  asset: Asset;
  currency: string;
  billingCycle: string;
  monthlyRecurring: number;
  yearlyRecurring: number;
  oneTimeCost: number;
  annualizedCost: number;
  nextRenewalDate: string;
  daysUntilRenewal: number | null;
  renewalRisk: "HEALTHY" | "UPCOMING" | "URGENT" | "OVERDUE";
};

export type CostInsight = {
  id: string;
  assetId?: string;
  title: string;
  description: string;
  severity: CostInsightSeverity;
  action: string;
};

export type CostForecastMonth = {
  key: string;
  label: string;
  recurring: number;
  renewals: number;
  projected: number;
};

export type CostBreakdown = {
  name: string;
  amount: number;
  count: number;
  share: number;
};

export type FinOpsSummary = {
  currency: string;
  assetCount: number;
  monthlyBurn: number;
  yearlyProjection: number;
  oneTimeExposure: number;
  renewalForecast60d: number;
  upcomingPayments: AssetCostProfile[];
  topExpensiveAssets: AssetCostProfile[];
  providerSpend: CostBreakdown[];
  categorySpend: CostBreakdown[];
  environmentSpend: CostBreakdown[];
  forecast: CostForecastMonth[];
  insights: CostInsight[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function daysUntil(dateValue: string) {
  if (!dateValue) {
    return null;
  }

  const target = new Date(`${dateValue}T00:00:00.000Z`).getTime();
  if (Number.isNaN(target)) {
    return null;
  }

  const today = new Date();
  const start = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  return Math.ceil((target - start) / MS_PER_DAY);
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function renewalRisk(days: number | null): AssetCostProfile["renewalRisk"] {
  if (days === null) return "HEALTHY";
  if (days < 0) return "OVERDUE";
  if (days <= 14) return "URGENT";
  if (days <= 60) return "UPCOMING";
  return "HEALTHY";
}

function annualizedFromCycle(asset: Asset) {
  const monthly = Number(asset.monthlyCost || 0);
  const yearly = Number(asset.yearlyCost || asset.estimatedCost || 0);
  const oneTime = Number(asset.oneTimeCost || 0);

  if (asset.billingCycle === "MONTHLY") {
    return {
      monthlyRecurring: monthly || yearly / 12,
      yearlyRecurring: yearly || monthly * 12,
      oneTimeCost: oneTime,
    };
  }

  if (asset.billingCycle === "QUARTERLY") {
    const annual = yearly || monthly * 12;
    return {
      monthlyRecurring: annual / 12,
      yearlyRecurring: annual,
      oneTimeCost: oneTime,
    };
  }

  if (asset.billingCycle === "SEMIANNUAL") {
    const annual = yearly || monthly * 12;
    return {
      monthlyRecurring: annual / 12,
      yearlyRecurring: annual,
      oneTimeCost: oneTime,
    };
  }

  if (asset.billingCycle === "ONE_TIME") {
    return {
      monthlyRecurring: 0,
      yearlyRecurring: 0,
      oneTimeCost: oneTime || yearly || asset.estimatedCost,
    };
  }

  return {
    monthlyRecurring: monthly || yearly / 12,
    yearlyRecurring: yearly,
    oneTimeCost: oneTime,
  };
}

export function getAssetCostProfile(asset: Asset): AssetCostProfile {
  const annualized = annualizedFromCycle(asset);
  const days = daysUntil(asset.renewalDate);

  return {
    asset,
    currency: (asset.currency || "USD").toUpperCase(),
    billingCycle: asset.billingCycle,
    monthlyRecurring: roundMoney(annualized.monthlyRecurring),
    yearlyRecurring: roundMoney(annualized.yearlyRecurring),
    oneTimeCost: roundMoney(annualized.oneTimeCost),
    annualizedCost: roundMoney(
      annualized.yearlyRecurring + annualized.oneTimeCost,
    ),
    nextRenewalDate: asset.renewalDate,
    daysUntilRenewal: days,
    renewalRisk: renewalRisk(days),
  };
}

function buildBreakdown(
  profiles: AssetCostProfile[],
  getName: (profile: AssetCostProfile) => string,
): CostBreakdown[] {
  const total = profiles.reduce(
    (sum, profile) => sum + profile.yearlyRecurring,
    0,
  );
  const groups = new Map<string, { amount: number; count: number }>();

  for (const profile of profiles) {
    const name = getName(profile) || "Unassigned";
    const current = groups.get(name) ?? { amount: 0, count: 0 };
    current.amount += profile.yearlyRecurring;
    current.count += 1;
    groups.set(name, current);
  }

  return Array.from(groups, ([name, value]) => ({
    name,
    amount: roundMoney(value.amount),
    count: value.count,
    share: total > 0 ? roundMoney((value.amount / total) * 100) : 0,
  })).sort((a, b) => b.amount - a.amount);
}

export function getCostForecast(profiles: AssetCostProfile[]) {
  const now = new Date();
  const monthlyBurn = profiles.reduce(
    (sum, profile) => sum + profile.monthlyRecurring,
    0,
  );

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + index, 1));
    const key = monthKey(date);
    const renewals = profiles
      .filter((profile) => {
        if (!profile.nextRenewalDate) return false;
        const renewal = new Date(`${profile.nextRenewalDate}T00:00:00.000Z`);
        return monthKey(renewal) === key;
      })
      .reduce((sum, profile) => sum + profile.yearlyRecurring, 0);

    return {
      key,
      label: monthLabel(date),
      recurring: roundMoney(monthlyBurn),
      renewals: roundMoney(renewals),
      projected: roundMoney(monthlyBurn + renewals),
    };
  });
}

export function getCostInsights(
  profiles: AssetCostProfile[],
  providerSpend: CostBreakdown[],
): CostInsight[] {
  const insights: CostInsight[] = [];
  const topAsset = profiles[0];

  if (topAsset && topAsset.yearlyRecurring > 1000) {
    insights.push({
      id: `high-cost-${topAsset.asset.id}`,
      assetId: topAsset.asset.id,
      title: "High-cost infrastructure asset",
      description: `${topAsset.asset.name} is the largest annualized cost driver in the current inventory.`,
      severity: topAsset.yearlyRecurring > 5000 ? "CRITICAL" : "WARNING",
      action: "Review utilization, ownership, and renewal justification.",
    });
  }

  for (const profile of profiles) {
    if (
      profile.renewalRisk === "URGENT" ||
      profile.renewalRisk === "OVERDUE"
    ) {
      insights.push({
        id: `renewal-${profile.asset.id}`,
        assetId: profile.asset.id,
        title:
          profile.renewalRisk === "OVERDUE"
            ? "Renewal payment overdue"
            : "Renewal payment approaching",
        description: `${profile.asset.name} has ${profile.currency} ${profile.yearlyRecurring.toLocaleString()} tied to a near-term renewal window.`,
        severity: profile.renewalRisk === "OVERDUE" ? "CRITICAL" : "WARNING",
        action: "Confirm payment owner, budget coverage, and service continuity.",
      });
    }
  }

  const concentratedProvider = providerSpend[0];
  if (concentratedProvider && concentratedProvider.share >= 50) {
    insights.push({
      id: `provider-concentration-${concentratedProvider.name}`,
      title: "Provider spend concentration",
      description: `${concentratedProvider.name} represents ${concentratedProvider.share}% of annualized infrastructure spend.`,
      severity: concentratedProvider.share >= 70 ? "CRITICAL" : "WARNING",
      action: "Track dependency risk and negotiate committed usage or discounts.",
    });
  }

  for (const profile of profiles) {
    if (
      profile.yearlyRecurring > 500 &&
      profile.asset.status === "ARCHIVED"
    ) {
      insights.push({
        id: `idle-cost-${profile.asset.id}`,
        assetId: profile.asset.id,
        title: "Expensive idle infrastructure",
        description: `${profile.asset.name} is archived but still carries recurring cost metadata.`,
        severity: "WARNING",
        action: "Validate cancellation, retention need, or archival billing status.",
      });
    }
  }

  return insights.slice(0, 8);
}

export function getFinOpsSummary(assets: Asset[]): FinOpsSummary {
  const profiles = assets
    .map(getAssetCostProfile)
    .sort((a, b) => b.yearlyRecurring - a.yearlyRecurring);
  const currency = profiles[0]?.currency ?? "USD";
  const providerSpend = buildBreakdown(profiles, (profile) => profile.asset.provider);
  const forecast = getCostForecast(profiles);
  const upcomingPayments = profiles
    .filter(
      (profile) =>
        profile.daysUntilRenewal !== null &&
        profile.daysUntilRenewal >= 0 &&
        profile.daysUntilRenewal <= 60,
    )
    .sort((a, b) => (a.daysUntilRenewal ?? 0) - (b.daysUntilRenewal ?? 0));

  return {
    currency,
    assetCount: assets.length,
    monthlyBurn: roundMoney(
      profiles.reduce((sum, profile) => sum + profile.monthlyRecurring, 0),
    ),
    yearlyProjection: roundMoney(
      profiles.reduce((sum, profile) => sum + profile.yearlyRecurring, 0),
    ),
    oneTimeExposure: roundMoney(
      profiles.reduce((sum, profile) => sum + profile.oneTimeCost, 0),
    ),
    renewalForecast60d: roundMoney(
      upcomingPayments.reduce((sum, profile) => sum + profile.yearlyRecurring, 0),
    ),
    upcomingPayments,
    topExpensiveAssets: profiles.slice(0, 6),
    providerSpend,
    categorySpend: buildBreakdown(profiles, (profile) => profile.asset.type),
    environmentSpend: buildBreakdown(
      profiles,
      (profile) => profile.asset.environment,
    ),
    forecast,
    insights: getCostInsights(profiles, providerSpend),
  };
}

export function getAssetFinancialIndicators(
  profile: AssetCostProfile,
): CostInsight[] {
  return getCostInsights([profile], []).map((insight) => ({
    ...insight,
    assetId: profile.asset.id,
  }));
}
