import { prisma } from "@cashback/database";
import UserListManager from "./user-list-manager";
import { getAdminSessionUser, isSuperAdmin } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [currentAdmin, users] = await Promise.all([
    getAdminSessionUser(),
    prisma.user.findMany({
      include: { tokenEntitlement: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Users
        </h1>
        <p className="text-sm text-slate-500">
          Monitor customer status, cumulative spend, token balances, and apply bulk lifecycle changes when needed.
        </p>
      </div>

      <UserListManager
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          totalSpending: Number(user.tokenEntitlement?.totalSpending ?? 0),
          entitledTokens: Number(user.tokenEntitlement?.entitledTokens ?? 0),
          availableTokens: Number(user.tokenEntitlement?.availableTokens ?? 0),
        }))}
        canBulkManage={isSuperAdmin(currentAdmin?.role)}
      />
    </div>
  );
}
