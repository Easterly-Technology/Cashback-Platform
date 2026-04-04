export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!login|api/health|_next/static|_next/image|favicon.ico).*)",
  ],
};
