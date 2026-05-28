"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/src/lib/auth/session";

function safeRedirectPath(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return "/dashboard";
  }

  if (value.startsWith("//") || value.startsWith("/login")) {
    return "/dashboard";
  }

  return value;
}

function loginErrorRedirect(nextPath: string): never {
  const params = new URLSearchParams({
    error: "invalid",
    next: nextPath,
  });

  redirect(`/login?${params.toString()}`);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  const nextPath = safeRedirectPath(formData.get("next"));

  if (
    email !== "admin@serverassethub.local" ||
    password !== "admin123"
  ) {
    loginErrorRedirect(nextPath);
  }

  await createSession({
    userId: "local-admin",
    email: "admin@serverassethub.local",
  });

  redirect(nextPath);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}