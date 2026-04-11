import Link from "next/link";
import { Prisma, SettlementStatus, prisma } from "@cashback/database";
import { formatCurrency } from "@cashback/shared";
import { SettlementActions } from "./settlement-actions";

export const dynamic = "force-dynamic";

const FILTER_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "Pending", value: "PENDING" },
  { label: "Invoiced", value: "INVOICED" },
  { label: "Paid", value: "PAID" },
  { label: "All", value: "all" },
] as const;

export default async function SettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const selectedStatus = params.status ?? "open";

  let where: Prisma.MerchantSettlementWhereInput = {};

  if (selectedStatus === "open") {
    where = {
      status: { in: [SettlementStatus.PENDING, SettlementStatus.INVOICED] },
    };
  } else if (
    selectedStatus === SettlementStatus.PENDING ||
    selectedStatus === SettlementStatus.INVOICED ||
    selectedStatus === SettlementStatus.PAID
  ) {
    where = { status: selectedStatus };
  }

  const settlementsPromise = prisma.merchantSettlement.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 50,
    include: {
      merchant: {
        select: {
          id: true,
          name: true,
          contactEmail: true,
        },
      },
    },
  });

  const aggregatesPromise = prisma.merchantSettlement.groupBy({
    by: ["status"],
    _count: true,
    _sum: {
      totalOwed: true,
    },
  });

  const overdueCutoff = new Date();
  overdueCutoff.setDate(overdueCutoff.getDate() - 14);

  const overdueAggregatePromise = prisma.merchantSettlement.aggregate({
    where: {
      status: { in: [SettlementStatus.PENDING, SettlementStatus.INVOICED] },
      createdAt: { lt: overdueCutoff },
    },
    _count: true,
    _sum: {
      totalOwed: true,
    },
  });

  const [settlements, aggregates, overdueAggregate] = await Promise.all([
    settlementsPromise,
    aggregatesPromise,
    overdueAggregatePromise,
  ]);

  const summaryMap = new Map(
    aggregates.map((entry) => [
      entry.status,
      {
        count: entry._count,
        amount: Number(entry._sum.totalOwed ?? 0),
      },
    ]),
  );

  const summaryCards = [
    {
      label: "Pending",
      count: summaryMap.get("PENDING")?.count ?? 0,
      amount: summaryMap.get("PENDING")?.amount ?? 0,
      tone: "border-amber-200 bg-amber-50",
    },
    {
      label: "Invoiced",
      count: summaryMap.get("INVOICED")?.count ?? 0,
      amount: summaryMap.get("INVOICED")?.amount ?? 0,
      tone: "border-indigo-200 bg-indigo-50",
    },
    {
      label: "Paid",
      count: summaryMap.get("PAID")?.count ?? 0,
      amount: summaryMap.get("PAID")?.amount ?? 0,
      tone: "border-emerald-200 bg-emerald-50",
    },
    {
      label: "Overdue",
      count: overdueAggregate._count,
      amount: Number(overdueAggregate._sum.totalOwed ?? 0),
      tone: "border-rose-200 bg-rose-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <span className="material-chip">Finance Operations</span>
        <h1 className="material-title mt-4 text-slate-950">Settlements</h1>
        <p className="material-subtitle mt-3 max-w-2xl">
          Review merchant settlement periods, track open balances, and confirm which payout cycles are still pending or invoiced.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border px-5 py-5 ${card.tone}`}>
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {card.count.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {formatCurrency(card.amount)}
            </p>
          </div>
        ))}
      </div>

      <div className="material-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => {
            const active = selectedStatus === option.value;

            return (
              <Link
                key={option.value}
                href={option.value === "open" ? "/settlements" : `/settlements?status=${option.value}`}
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
          <Link
            href={`/api/admin/settlements/export${selectedStatus === "open" ? "" : `?status=${selectedStatus}`}`}
            className="material-button-outlined px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Export CSV
          </Link>
        </div>
      </div>

      <div className="material-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Settlement Queue</h2>
            <p className="mt-1 text-sm text-slate-500">
              Open periods and paid records are grouped in one finance view for easier reconciliation.
            </p>
          </div>
          <span className="material-chip material-chip-muted">
            {settlements.length.toLocaleString()} records
          </span>
        </div>

        {settlements.length === 0 ? (
          <div className="material-empty px-6 py-10 text-center">
            <p className="text-base font-medium text-slate-700">
              No settlements match the selected filter.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Switch filters to view other settlement states.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 xl:hidden">
              {settlements.map((settlement) => (
                <div key={settlement.id} className="material-card-flat p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/merchants/${settlement.merchant.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-700"
                      >
                        {settlement.merchant.name}
                      </Link>
                      <p className="text-sm text-slate-500">
                        {settlement.periodStart.toISOString().split("T")[0]} to{" "}
                        {settlement.periodEnd.toISOString().split("T")[0]}
                      </p>
                    </div>
                    <span className="status-badge status-badge-info">
                      {settlement.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Total Owed</p>
                      <p className="mt-1 font-semibold text-slate-950">
                        {formatCurrency(Number(settlement.totalOwed))}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Paid At</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {settlement.paidAt
                          ? settlement.paidAt.toLocaleString()
                          : "Awaiting payout"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm">
                    <p className="text-slate-500">Invoice Reference</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {settlement.invoiceReference ?? "Not set"}
                    </p>
                  </div>
                  <div className="mt-4">
                    <SettlementActions
                      id={settlement.id}
                      status={settlement.status}
                      initialInvoiceReference={settlement.invoiceReference}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="material-table-shell hidden xl:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="p-4">Merchant</th>
                      <th className="p-4">Period</th>
                      <th className="p-4">Rebate</th>
                      <th className="p-4">Service Fee</th>
                      <th className="p-4">Total Owed</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Invoice Ref</th>
                      <th className="p-4">Paid At</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((settlement) => (
                      <tr key={settlement.id} className="border-b border-slate-100 align-top">
                        <td className="p-4">
                          <Link
                            href={`/merchants/${settlement.merchant.id}`}
                            className="font-medium text-slate-900 hover:text-indigo-700"
                          >
                            {settlement.merchant.name}
                          </Link>
                          <p className="mt-1 text-xs text-slate-500">
                            {settlement.merchant.contactEmail}
                          </p>
                        </td>
                        <td className="p-4 text-slate-600">
                          {settlement.periodStart.toISOString().split("T")[0]} to{" "}
                          {settlement.periodEnd.toISOString().split("T")[0]}
                        </td>
                        <td className="p-4">
                          {formatCurrency(Number(settlement.totalRebate))}
                        </td>
                        <td className="p-4">
                          {formatCurrency(Number(settlement.totalServiceFee))}
                        </td>
                        <td className="p-4 font-semibold text-slate-950">
                          {formatCurrency(Number(settlement.totalOwed))}
                        </td>
                        <td className="p-4">
                          <span className="status-badge status-badge-info">
                            {settlement.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {settlement.invoiceReference ?? "Not set"}
                        </td>
                        <td className="p-4 text-slate-500">
                          {settlement.paidAt
                            ? settlement.paidAt.toLocaleString()
                            : "Awaiting payout"}
                        </td>
                        <td className="p-4">
                          <SettlementActions
                            id={settlement.id}
                            status={settlement.status}
                            initialInvoiceReference={settlement.invoiceReference}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
