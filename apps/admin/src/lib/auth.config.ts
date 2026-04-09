import type { NextAuthConfig } from "next-auth";

const authCookiePrefix = "cashback-admin";
const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

const authConfig = {
  secret:
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET ??
    "dev-secret-not-for-production",
  cookies: {
    sessionToken: {
      name: `${authCookiePrefix}.session-token`,
      options: authCookieOptions,
    },
    callbackUrl: {
      name: `${authCookiePrefix}.callback-url`,
      options: authCookieOptions,
    },
    csrfToken: {
      name: `${authCookiePrefix}.csrf-token`,
      options: authCookieOptions,
    },
  },
  providers: [],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
