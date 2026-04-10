import { auth } from "@/lib/auth";

export type AdminRole = "SUPER_ADMIN" | "ADMIN";

export type AdminSessionUser = {
  id: string;
  email: string | null;
  role: AdminRole;
};

export function isSuperAdmin(role?: string | null): role is "SUPER_ADMIN" {
  return role === "SUPER_ADMIN";
}

export async function getAdminSessionUser(): Promise<AdminSessionUser | null> {
  const session = await auth();
  const user = session?.user as
    | {
        id?: string;
        email?: string | null;
        role?: string | null;
      }
    | undefined;

  if (!user?.id || !user.role) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    role: user.role as AdminRole,
  };
}

export async function requireAdminSession() {
  const admin = await getAdminSessionUser();

  if (!admin) {
    return {
      ok: false as const,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    ok: true as const,
    admin,
  };
}

export async function requireSuperAdmin() {
  const result = await requireAdminSession();

  if (!result.ok) return result;

  if (!isSuperAdmin(result.admin.role)) {
    return {
      ok: false as const,
      response: Response.json(
        { error: "Super admin permission required" },
        { status: 403 },
      ),
    };
  }

  return result;
}
