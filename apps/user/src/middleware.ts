export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!login|register|scan|api/health|_next/static|_next/image|favicon.ico).*)",
  ],
};
