import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import { formatCurrency } from "@cashback/shared";
import { auth } from "@/lib/auth";

const STATUS_OPTIONS = [
  { label: "All Sales", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Disputed", value: "DISPUTED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

function statusClass(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "status-badge status-badge-success";
    case "PENDING":
      return "status-badge status-badge-warning";
    case "DISPUTED":
      return "status-badge status-badge-danger";
    case "CANCELLED":
      return "status-badge status-badge-neutral";
    default:
      return "status-badge status-badge-info";
  }
}

function buildTransactionWhere(merchantId: string, status?: string) {
  const where: Record<string, unknown> = { merchantId };

  if (status && status !== "all") {
    where.status = status;
  }

  return where;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const merchantId = (session?.user as { id?: string } | undefined)?.id;

  if (!merchantId) {
    redirect("/login?callbackUrl=%2Ftransactions");
  }

  const params = await searchParams;
  const activeStatus = params.status ?? "all";
  const where = buildTransactionWhere(merchantId, activeStatus);

  const [transactions, totals, todayTotals, pendingCount] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        user: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.transaction.aggregate({
      where,
      _sum: {
        totalAmount: true,
        rebateAmount: true,
        serviceFee: true,
      },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: {
        merchantId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.transaction.count({
      where: { merchantId, status: "PENDING" },
    }),
  ]);

  const grossVolume = Number(totals._sum.totalAmount ?? 0);
  const rebateTotal = Number(totals._sum.rebateAmount ?? 0);
  const feeTotal = Number(totals._sum.serviceFee ?? 0);
  const filterLabel =
    STATUS_OPTIONS.find((option) => option.value === activeStatus)?.label ??
    "All Sales";

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="material-chip">Sales Ledger</span>
            <h1 className="material-title mt-4 text-slate-950">
              Transactions
            </h1>
            <p className="material-subtitle mt-3 max-w-3xl">
              Review customer purchases, monitor platform charges, and keep a close read on confirmations or pending orders.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800 shadow-sm">
            Showing <span className="font-semibold">{filterLabel}</span>
          </div>
        </div>
      </div>

      <div className="material-card p-5">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const href =
              option.value === "all"
                ? "/transactions"
                : `/transactions?status=${option.value}`;
            const active = option.value === activeStatus;

            return (
              <Link
                key={option.value}
                href={href}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="material-stat p-5">
          <p className="text-sm text-slate-500">Orders</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {totals._count.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Matching the current transaction filter
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm text-slate-500">Gross Volume</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(grossVolume)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Total customer spend across visible records
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm text-slate-500">Platform Charges</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(rebateTotal + feeTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Rebate plus service fees for this transaction set
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm text-slate-500">Today&apos;s Flow</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(Number(todayTotals._sum.totalAmount ?? 0))}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {todayTotals._count.toLocaleString()} orders today, {pendingCount.toLocaleString()} still pending
          </p>
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        {transactions.length === 0 ? (
          <div className="material-empty px-6 py-12 text-center">
            <p className="text-base font-medium text-slate-700">
              No transactions match this view.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Switch status filters or launch a new QR checkout to create fresh activity.
            </p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="material-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{tx.user.email}</p>
                  <p className="mt-1 font-mono text-xs text-slate-400">{tx.id}</p>
                </div>
                <span className={statusClass(tx.status)}>{tx.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Amount</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatCurrency(Number(tx.totalAmount))}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Rebate</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatCurrency(Number(tx.rebateAmount))}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Service Fee</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatCurrency(Number(tx.serviceFee))}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950 p-3 text-white">
                  <p className="text-slate-300">Date</p>
                  <p className="mt-1 font-medium">
                    {tx.createdAt.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="material-table-shell hidden lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="p-4">ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Rebate</th>
                <th className="p-4">Service Fee</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No transactions match this view.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-100">
                    <td className="p-4 font-mono text-xs text-slate-500">{tx.id}</td>
                    <td className="p-4">{tx.user.email}</td>
                    <td className="p-4 font-medium">
                      {formatCurrency(Number(tx.totalAmount))}
                    </td>
                    <td className="p-4 text-slate-600">
                      {formatCurrency(Number(tx.rebateAmount))}
                    </td>
                    <td className="p-4 text-slate-600">
                      {formatCurrency(Number(tx.serviceFee))}
                    </td>
                    <td className="p-4">
                      <span className={statusClass(tx.status)}>{tx.status}</span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {tx.createdAt.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Transaction records are read-only so settlement and audit calculations stay consistent after customer confirmation.
      </p>
    </div>
  );
}
