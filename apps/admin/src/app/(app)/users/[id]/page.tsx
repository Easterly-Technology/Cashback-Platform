import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@cashback/database";
import { formatCurrency } from "@cashback/shared";
import { AdminNotesPanel } from "@/components/admin-notes-panel";
import { AuditLogFeed } from "@/components/audit-log-feed";
import { EntityStatusActions } from "@/components/entity-status-actions";
import { getAdminSessionUser, isSuperAdmin } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function getUserActions(status: string) {
  switch (status) {
    case "ACTIVE":
      return [
        { value: "SUSPENDED", label: "Suspend", tone: "neutral" as const },
        { value: "BANNED", label: "Ban", tone: "danger" as const },
      ];
    case "SUSPENDED":
      return [
        { value: "ACTIVE", label: "Reactivate", tone: "primary" as const },
        { value: "BANNED", label: "Ban", tone: "danger" as const },
      ];
    case "BANNED":
      return [{ value: "ACTIVE", label: "Reactivate", tone: "primary" as const }];
    default:
      return [];
  }
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [
    currentAdmin,
    user,
    transactionStats,
    withdrawalStats,
    recentTransactions,
    recentWithdrawals,
    recentOrders,
    auditLogs,
    adminNotes,
  ] =
    await Promise.all([
      getAdminSessionUser(),
      prisma.user.findUnique({
        where: { id },
        include: {
          tokenEntitlement: true,
        },
      }),
      prisma.transaction.aggregate({
        where: { userId: id },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.withdrawalRequest.aggregate({
        where: { userId: id },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          merchant: { select: { id: true, name: true } },
        },
      }),
      prisma.withdrawalRequest.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.marketplaceOrder.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.auditLog.findMany({
        where: {
          OR: [
            { actorType: "USER", actorId: id },
            { resourceType: "USER", resourceId: id },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.adminNote.findMany({
        where: {
          resourceType: "USER",
          resourceId: id,
        },
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
        take: 20,
      }),
    ]);

  if (!user) notFound();

  const statusHistory = auditLogs.filter((log) => log.action.includes("STATUS"));
  const canManageUserStatus = isSuperAdmin(currentAdmin?.role);

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="material-chip">User Detail</span>
            <h1 className="material-title mt-4 text-slate-950">{user.name}</h1>
            <p className="material-subtitle mt-3 max-w-2xl">
              {user.email} · Joined {user.createdAt.toLocaleString()}
            </p>
          </div>
          <span className="status-badge status-badge-neutral">{user.status}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="material-stat p-5">
          <p className="text-sm font-medium text-slate-500">Total Spending</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(Number(transactionStats._sum.totalAmount ?? 0))}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            {transactionStats._count} transactions
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm font-medium text-slate-500">Entitled Tokens</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {Number(user.tokenEntitlement?.entitledTokens ?? 0).toLocaleString()}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            released {Number(user.tokenEntitlement?.releasedTokens ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm font-medium text-slate-500">Available Tokens</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {Number(user.tokenEntitlement?.availableTokens ?? 0).toLocaleString()}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            ready to exchange or withdraw
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm font-medium text-slate-500">Withdrawals</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(Number(withdrawalStats._sum.amount ?? 0))}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            {withdrawalStats._count} requests
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Profile Summary</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Email</p>
                <p className="mt-1 font-medium text-slate-900">{user.email}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Phone</p>
                <p className="mt-1 font-medium text-slate-900">
                  {user.phone ?? "Not provided"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Email Verified</p>
                <p className="mt-1 font-medium text-slate-900">
                  {user.emailVerified ? "Verified" : "Pending"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Release Start Date</p>
                <p className="mt-1 font-medium text-slate-900">
                  {user.tokenEntitlement?.releaseStartDate
                    ? user.tokenEntitlement.releaseStartDate.toISOString().split("T")[0]
                    : "Not started"}
                </p>
              </div>
            </div>
          </div>

          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Related Activity</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Transactions</p>
                <div className="mt-3 space-y-3">
                  {recentTransactions.length === 0 ? (
                    <p className="text-sm text-slate-500">No transactions yet.</p>
                  ) : (
                    recentTransactions.map((transaction) => (
                      <Link
                        key={transaction.id}
                        href={`/transactions/${transaction.id}`}
                        className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                      >
                        <p className="font-medium text-slate-900">
                          {transaction.merchant.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatCurrency(Number(transaction.totalAmount))}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {transaction.status} · {transaction.createdAt.toLocaleString()}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">Withdrawals</p>
                <div className="mt-3 space-y-3">
                  {recentWithdrawals.length === 0 ? (
                    <p className="text-sm text-slate-500">No withdrawals yet.</p>
                  ) : (
                    recentWithdrawals.map((withdrawal) => (
                      <Link
                        key={withdrawal.id}
                        href={`/withdrawals/${withdrawal.id}`}
                        className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                      >
                        <p className="font-medium text-slate-900">
                          {formatCurrency(Number(withdrawal.amount))}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {withdrawal.status} · {withdrawal.createdAt.toLocaleString()}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">Exchange Orders</p>
                <div className="mt-3 space-y-3">
                  {recentOrders.length === 0 ? (
                    <p className="text-sm text-slate-500">No exchange orders yet.</p>
                  ) : (
                    recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-slate-200 px-4 py-3"
                      >
                        <p className="font-medium text-slate-900">
                          {Number(order.tokenAmount).toLocaleString()} tokens
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatCurrency(Number(order.cashValue))}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {order.status} · {order.createdAt.toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Available Actions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Super admins can change customer lifecycle status directly from this record.
            </p>
            <div className="mt-4">
              {canManageUserStatus ? (
                <EntityStatusActions
                  endpoint={`/api/admin/users/${user.id}`}
                  currentStatus={user.status}
                  options={getUserActions(user.status)}
                />
              ) : (
                <p className="text-sm text-slate-500">
                  Your role can review this account but cannot change user lifecycle status.
                </p>
              )}
            </div>
          </div>

          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Status History</h2>
            <div className="mt-4 space-y-3">
              {statusHistory.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No admin status changes recorded yet.
                </p>
              ) : (
                statusHistory.map((log) => (
                  <div key={String(log.id)} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">{log.action}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {log.createdAt.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <AdminNotesPanel
            resourceType="USER"
            resourceId={user.id}
            notes={adminNotes.map((note) => ({
              id: note.id,
              body: note.body,
              createdAt: note.createdAt.toISOString(),
              updatedAt: note.updatedAt.toISOString(),
              author: {
                id: note.author.id,
                email: note.author.email,
                role: note.author.role,
              },
            }))}
          />

          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Audit Trail</h2>
            <div className="mt-4">
              <AuditLogFeed
                logs={auditLogs}
                emptyMessage="No audit records linked to this user yet."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
