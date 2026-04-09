import type { NextAuthConfig } from "next-auth";

const authCookiePrefix = "cashback-user";
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
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
