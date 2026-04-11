import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import { formatCurrency } from "@cashback/shared";
import { auth } from "@/lib/auth";

const STATUS_OPTIONS = [
  { label: "All Periods", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
] as const;

function settlementStatusClass(status: string) {
  return status === "PAID"
    ? "status-badge status-badge-success"
    : "status-badge status-badge-warning";
}

function buildSettlementWhere(merchantId: string, status?: string) {
  const where: Record<string, unknown> = { merchantId };

  if (status && status !== "all") {
    where.status = status;
  }

  return where;
}

function formatPeriod(start: Date, end: Date) {
  return `${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]}`;
}

export default async function SettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const merchantId = (session?.user as { id?: string } | undefined)?.id;

  if (!merchantId) {
    redirect("/login?callbackUrl=%2Fsettlements");
  }

  const params = await searchParams;
  const activeStatus = params.status ?? "all";
  const where = buildSettlementWhere(merchantId, activeStatus);

  const [settlements, currentTotals, paidTotals, pendingPeriods] = await Promise.all([
    prisma.merchantSettlement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.transaction.aggregate({
      where: { merchantId, status: "CONFIRMED" },
      _sum: { rebateAmount: true, serviceFee: true },
    }),
    prisma.merchantSettlement.aggregate({
      where: { merchantId, status: "PAID" },
      _sum: { totalOwed: true },
    }),
    prisma.merchantSettlement.count({
      where: { merchantId, status: "PENDING" },
    }),
  ]);

  const currentOwed =
    Number(currentTotals._sum.rebateAmount ?? 0) +
    Number(currentTotals._sum.serviceFee ?? 0);
  const paidTotal = Number(paidTotals._sum.totalOwed ?? 0);

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="material-chip">Finance Oversight</span>
            <h1 className="material-title mt-4 text-slate-950">Settlements</h1>
            <p className="material-subtitle mt-3 max-w-3xl">
              Track what confirmed sales are currently accruing, review historical settlement periods, and see which cycles are still open.
            </p>
          </div>
          <Link
            href="/transactions"
            className="material-button-outlined inline-flex min-h-11 items-center px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Review transactions
          </Link>
        </div>
      </div>

      <div className="material-card p-5">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const href =
              option.value === "all"
                ? "/settlements"
                : `/settlements?status=${option.value}`;
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
          <p className="text-sm text-slate-500">Current Amount Owed</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(currentOwed)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Rebate plus service fees on all confirmed sales
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm text-slate-500">Paid to Date</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(paidTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Historical settlement periods already marked paid
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm text-slate-500">Open Periods</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {pendingPeriods.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Settlement cycles still waiting for completion
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm text-slate-500">Visible Periods</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {settlements.length.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Rows in the current settlement view
          </p>
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        {settlements.length === 0 ? (
          <div className="material-empty px-6 py-12 text-center">
            <p className="text-base font-medium text-slate-700">
              No settlement periods match this view.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Settlement cycles will appear here as confirmed sales accumulate and payouts are recorded.
            </p>
          </div>
        ) : (
          settlements.map((settlement) => (
            <div key={settlement.id} className="material-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {formatPeriod(settlement.periodStart, settlement.periodEnd)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Paid{" "}
                    {settlement.paidAt
                      ? settlement.paidAt.toISOString().split("T")[0]
                      : "not yet"}
                  </p>
                </div>
                <span className={settlementStatusClass(settlement.status)}>
                  {settlement.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Total Rebate</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatCurrency(Number(settlement.totalRebate))}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Service Fee</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatCurrency(Number(settlement.totalServiceFee))}
                  </p>
                </div>
                <div className="col-span-2 rounded-2xl bg-slate-950 p-3 text-white">
                  <p className="text-slate-300">Total Owed</p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatCurrency(Number(settlement.totalOwed))}
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
                <th className="p-4">Period</th>
                <th className="p-4">Total Rebate</th>
                <th className="p-4">Service Fee</th>
                <th className="p-4">Total Owed</th>
                <th className="p-4">Status</th>
                <th className="p-4">Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No settlement periods match this view.
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => (
                  <tr key={settlement.id} className="border-b border-slate-100">
                    <td className="p-4">
                      {formatPeriod(settlement.periodStart, settlement.periodEnd)}
                    </td>
                    <td className="p-4">
                      {formatCurrency(Number(settlement.totalRebate))}
                    </td>
                    <td className="p-4">
                      {formatCurrency(Number(settlement.totalServiceFee))}
                    </td>
                    <td className="p-4 font-medium">
                      {formatCurrency(Number(settlement.totalOwed))}
                    </td>
                    <td className="p-4">
                      <span className={settlementStatusClass(settlement.status)}>
                        {settlement.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {settlement.paidAt
                        ? settlement.paidAt.toISOString().split("T")[0]
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
