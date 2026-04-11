import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@cashback/database";
import { formatCurrency, parseBankInfo } from "@cashback/shared";
import { AdminNotesPanel } from "@/components/admin-notes-panel";
import { AuditLogFeed } from "@/components/audit-log-feed";
import { EntityStatusActions } from "@/components/entity-status-actions";

export const dynamic = "force-dynamic";

function getMerchantActions(status: string) {
  switch (status) {
    case "PENDING":
      return [
        { value: "ACTIVE", label: "Activate", tone: "primary" as const },
        { value: "SUSPENDED", label: "Suspend", tone: "danger" as const },
      ];
    case "ACTIVE":
      return [{ value: "SUSPENDED", label: "Suspend", tone: "danger" as const }];
    case "SUSPENDED":
      return [{ value: "ACTIVE", label: "Reactivate", tone: "primary" as const }];
    default:
      return [];
  }
}

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [
    merchant,
    productCount,
    transactionStats,
    settlements,
    auditLogs,
    recentTransactions,
    adminNotes,
  ] =
    await Promise.all([
      prisma.merchant.findUnique({
        where: { id },
      }),
      prisma.product.count({
        where: { merchantId: id },
      }),
      prisma.transaction.aggregate({
        where: { merchantId: id, status: "CONFIRMED" },
        _sum: { totalAmount: true, rebateAmount: true, serviceFee: true },
        _count: true,
      }),
      prisma.merchantSettlement.findMany({
        where: { merchantId: id },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.auditLog.findMany({
        where: {
          OR: [
            { actorType: "MERCHANT", actorId: id },
            { resourceType: "MERCHANT", resourceId: id },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.transaction.findMany({
        where: { merchantId: id },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          user: { select: { id: true, email: true } },
        },
      }),
      prisma.adminNote.findMany({
        where: {
          resourceType: "MERCHANT",
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

  if (!merchant) notFound();

  const bankInfo = parseBankInfo(merchant.bankInfo);
  const statusHistory = auditLogs.filter((log) => log.action.includes("STATUS"));

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="material-chip">Merchant Detail</span>
            <h1 className="material-title mt-4 text-slate-950">{merchant.name}</h1>
            <p className="material-subtitle mt-3 max-w-2xl">
              {merchant.contactEmail} · Joined {merchant.createdAt.toLocaleString()}
            </p>
          </div>
          <span className="status-badge status-badge-neutral">{merchant.status}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="material-stat p-5">
          <p className="text-sm font-medium text-slate-500">Confirmed Sales</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(Number(transactionStats._sum.totalAmount ?? 0))}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            {transactionStats._count} orders
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm font-medium text-slate-500">Rebate Collected</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(Number(transactionStats._sum.rebateAmount ?? 0))}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            {(Number(merchant.rebatePct) * 100).toFixed(1)}% configured
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm font-medium text-slate-500">Service Fees</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(Number(transactionStats._sum.serviceFee ?? 0))}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            {(Number(merchant.serviceFeePct) * 100).toFixed(1)}% configured
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm font-medium text-slate-500">Catalog Size</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {productCount.toLocaleString()}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            active and inactive products
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Merchant Summary</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Contact Email</p>
                <p className="mt-1 font-medium text-slate-900">
                  {merchant.contactEmail}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Bank Details</p>
                <p className="mt-1 font-medium text-slate-900">
                  {bankInfo
                    ? `${bankInfo.bankName} · ${bankInfo.accountNumber}`
                    : "No bank info saved"}
                </p>
              </div>
            </div>
          </div>

          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Recent Activity</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Transactions
                </p>
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
                          {transaction.user.email}
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
                <p className="text-sm font-semibold text-slate-700">Settlements</p>
                <div className="mt-3 space-y-3">
                  {settlements.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No settlement periods yet.
                    </p>
                  ) : (
                    settlements.map((settlement) => (
                      <div
                        key={settlement.id}
                        className="rounded-2xl border border-slate-200 px-4 py-3"
                      >
                        <p className="font-medium text-slate-900">
                          {settlement.periodStart.toISOString().split("T")[0]} to{" "}
                          {settlement.periodEnd.toISOString().split("T")[0]}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatCurrency(Number(settlement.totalOwed))}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {settlement.status} · {settlement.createdAt.toLocaleString()}
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
              Merchant controls are limited to lifecycle status changes.
            </p>
            <div className="mt-4">
              <EntityStatusActions
                endpoint={`/api/admin/merchants/${merchant.id}`}
                currentStatus={merchant.status}
                options={getMerchantActions(merchant.status)}
              />
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
            resourceType="MERCHANT"
            resourceId={merchant.id}
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
                emptyMessage="No audit records linked to this merchant yet."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
