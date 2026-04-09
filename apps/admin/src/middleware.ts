import { NextRequest, NextResponse } from "next/server";
import { sessionTokenCookieCandidates } from "@/lib/auth-cookies";

function hasSessionCookie(request: NextRequest) {
  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name);

  return sessionTokenCookieCandidates.some((candidate) =>
    cookieNames.some(
      (cookieName) =>
        cookieName === candidate || cookieName.startsWith(`${candidate}.`),
    ),
  );
}

export default function middleware(request: NextRequest) {
  if (hasSessionCookie(request)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!login|api/auth|api/health|api/cron|_next/static|_next/image|favicon.ico).*)",
  ],
};
