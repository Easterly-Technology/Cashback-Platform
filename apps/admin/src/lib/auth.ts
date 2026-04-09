import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import authConfig from "@/lib/auth.config";

function isValidPassword(password: string, passwordHash: string) {
  if (passwordHash.startsWith("$2")) {
    return bcrypt.compare(password, passwordHash);
  }

  const legacyHash = createHash("sha256").update(password).digest("hex");
  return Promise.resolve(legacyHash === passwordHash);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
});
