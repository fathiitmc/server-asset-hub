import "server-only";

import { cookies } from "next/headers";
import { signAuthToken, verifyAuthToken, type AuthTokenPayload } from "./auth";
import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME } from "./constants";

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function createSession(payload: AuthTokenPayload) {
  const token = signAuthToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    ...sessionCookieOptions,
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyAuthToken(token);
}
