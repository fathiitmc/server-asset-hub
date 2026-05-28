import { NextResponse, type NextRequest } from "next/server";
import { verifyAuthToken } from "@/src/lib/auth/auth";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/constants";

const protectedPrefixes = [
  "/dashboard",
  "/assets",
  "/finance",
  "/teams",
  "/automation",
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return token ? verifyAuthToken(token) : null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSession(request);

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtectedPath(pathname) && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/assets/:path*",
    "/finance/:path*",
    "/teams/:path*",
    "/automation/:path*",
  ],
};
