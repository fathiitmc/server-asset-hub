"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  automationInputFromFormData,
  type AutomationRuleStatus,
  createAutomationRule,
  recordAutomationExecution,
  safeDeleteAutomationRule,
  updateAutomationRule,
  updateAutomationRuleStatus,
} from "@/src/lib/automation/automation-foundation";
import { getSession } from "@/src/lib/auth/session";
import { requirePermission } from "@/src/lib/rbac/permissions";

async function currentActor() {
  const session = await getSession();
  return session?.email ?? "system";
}

export async function createAutomationRuleAction(formData: FormData) {
  await requirePermission("automation:manage");
  const actor = await currentActor();
  const rule = await createAutomationRule(
    automationInputFromFormData(formData),
    actor,
  );

  revalidatePath("/automation");
  redirect(`/automation/${rule.id}`);
}

export async function updateAutomationRuleAction(
  id: string,
  formData: FormData,
) {
  await requirePermission("automation:manage");
  const actor = await currentActor();
  await updateAutomationRule(id, automationInputFromFormData(formData), actor);

  revalidatePath("/automation");
  revalidatePath(`/automation/${id}`);
}

export async function pauseAutomationRuleAction(id: string) {
  await setStatus(id, "PAUSED");
}

export async function resumeAutomationRuleAction(id: string) {
  await setStatus(id, "ACTIVE");
}

export async function disableAutomationRuleAction(id: string) {
  await setStatus(id, "DISABLED");
}

export async function deleteAutomationRuleAction(id: string) {
  await requirePermission("automation:manage");
  await safeDeleteAutomationRule(id, await currentActor());

  revalidatePath("/automation");
  redirect("/automation");
}

export async function runAutomationRuleAction(id: string) {
  await requirePermission("automation:manage");
  await recordAutomationExecution(id, await currentActor(), "MANUAL");

  revalidatePath("/automation");
  revalidatePath(`/automation/${id}`);
}

async function setStatus(id: string, status: AutomationRuleStatus) {
  await requirePermission("automation:manage");
  await updateAutomationRuleStatus(id, status, await currentActor());

  revalidatePath("/automation");
  revalidatePath(`/automation/${id}`);
}
