"use server";

import { revalidatePath } from "next/cache";
import { createOperationalEvent } from "@/lib/operational-events-db";
import { runAssetHealthCheck } from "@/src/lib/monitoring/checks";

export async function runAssetHealthCheckAction(assetId: string) {
  const snapshot = await runAssetHealthCheck(assetId);
  await createOperationalEvent({
    assetId,
    eventType:
      snapshot.status === "OFFLINE"
        ? "RUNTIME_OFFLINE"
        : snapshot.status === "DEGRADED"
          ? "HEALTH_DEGRADED"
          : snapshot.status === "ONLINE"
            ? "RUNTIME_ONLINE"
            : "HEALTH_CHECK_RUN",
    severity:
      snapshot.status === "OFFLINE"
        ? "CRITICAL"
        : snapshot.status === "DEGRADED"
          ? "WARNING"
          : "INFO",
    title: `Health check reported ${snapshot.status.toLowerCase()}`,
    description: "Manual runtime health check completed.",
    metadata: {
      status: snapshot.status,
      responseTime: snapshot.responseTime,
      checkedAt: snapshot.checkedAt,
    },
    source: "MONITOR",
  });
  revalidatePath("/dashboard");
  revalidatePath(`/assets/${assetId}`);
}
