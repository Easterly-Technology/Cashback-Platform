export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!login|api/health|api/cron|_next/static|_next/image|favicon.ico).*)",
  ],
};
