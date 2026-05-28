"use server";

import { revalidatePath } from "next/cache";
import { createOperationalEvent } from "@/lib/operational-events-db";
import { acknowledgeAlert } from "@/src/lib/alerts/alerts";
import { getSession } from "@/src/lib/auth/session";

export async function acknowledgeAlertAction(alertId: string) {
  await acknowledgeAlert(alertId);
  const session = await getSession();
  await createOperationalEvent({
    eventType: "ALERT_ACKNOWLEDGED",
    severity: "INFO",
    title: "Alert acknowledged",
    description: "An active operational alert was acknowledged.",
    metadata: { alertId },
    actor: session?.email ?? "system",
    source: "USER",
  });
  revalidatePath("/dashboard");
}
