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
      name: "cashback-merchant.callback-url",
      options: authCookieOptions,
    },
    csrfToken: {
      name: "cashback-merchant.csrf-token",
      options: authCookieOptions,
    },
  },
  providers: [],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.merchantId = user.id;
        token.merchantName = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.merchantId;
        (session.user as any).merchantName = token.merchantName;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
