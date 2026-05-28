import jwt from "jsonwebtoken";
import { AUTH_TOKEN_EXPIRES_IN } from "./constants";

export type AuthTokenPayload = {
  userId: string;
  email: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required for authentication.");
  }

  return secret;
}

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: AUTH_TOKEN_EXPIRES_IN,
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (
      typeof payload === "object" &&
      payload !== null &&
      typeof payload.userId === "string" &&
      typeof payload.email === "string"
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
      };
    }

    return null;
  } catch {
    return null;
  }
}
