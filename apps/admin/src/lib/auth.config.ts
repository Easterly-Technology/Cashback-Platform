import type { NextAuthConfig } from "next-auth";
import {
  authCookieOptions,
  sessionTokenCookieName,
} from "@/lib/auth-cookies";

const authConfig = {
  secret:
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET ??
    "dev-secret-not-for-production",
  cookies: {
    sessionToken: {
      name: sessionTokenCookieName,
      options: authCookieOptions,
    },
    callbackUrl: {
      name: "cashback-admin.callback-url",
      options: authCookieOptions,
    },
    csrfToken: {
      name: "cashback-admin.csrf-token",
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
