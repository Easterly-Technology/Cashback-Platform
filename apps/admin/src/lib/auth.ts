import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

function isValidPassword(password: string, passwordHash: string) {
  if (passwordHash.startsWith("$2")) {
    return bcrypt.compare(password, passwordHash);
  }

  const legacyHash = createHash("sha256").update(password).digest("hex");
  return Promise.resolve(legacyHash === passwordHash);
}

const authCookiePrefix = "cashback-admin";
const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export const { handlers, signIn, signOut, auth } = NextAuth({
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
  providers: [
    Credentials({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { prisma } = await import("@cashback/database");
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email as string },
        });
        if (!admin) return null;

        const valid = await isValidPassword(
          credentials.password as string,
          admin.passwordHash,
        );
        if (!valid) return null;

        return { id: admin.id, email: admin.email, role: admin.role };
      },
    }),
  ],
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
});
