import Link from "next/link";
import { prisma } from "@cashback/database";
import { formatCurrency } from "@cashback/shared";
import { PaginationControls } from "@/components/pagination-controls";
import TransactionFilters from "./transaction-filters";

export const dynamic = "force-dynamic";

function buildTransactionWhere(params: {
  status?: string;
  from?: string;
  to?: string;
  view?: string;
}) {
  const where: Record<string, unknown> = {};

  if (params.view === "pending-review" && !params.status) {
    where.status = { in: ["PENDING", "DISPUTED"] };
  } else if (params.view === "disputes" && !params.status) {
    where.status = "DISPUTED";
  } else if (params.view === "today" && !params.from && !params.to) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    where.createdAt = { gte: start, lt: end };
  }

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params.from) {
    where.createdAt = { ...(where.createdAt as object), gte: new Date(params.from) };
  }

  if (params.to) {
    const endDate = new Date(params.to);
    endDate.setDate(endDate.getDate() + 1);
    where.createdAt = { ...(where.createdAt as object), lt: endDate };
  }

  return where;
}

function statusColor(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-100 text-green-700";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    case "DISPUTED":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-red-100 text-red-700";
  }
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    from?: string;
    to?: string;
    view?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const pageSize = 20;
  const where = buildTransactionWhere(params);

  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true } },
        merchant: { select: { name: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  const baseParams = {
    status: params.status,
    from: params.from,
    to: params.to,
    view: params.view,
  };

  const exportParams = new URLSearchParams();
  Object.entries(baseParams).forEach(([key, value]) => {
    if (value) exportParams.set(key, value);
  });

  return (
    <div className="space-y-6">
      <div className="material-card mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="material-chip">Transactions</span>
            <h1 className="material-title mt-4 text-slate-950">
              Transactions
            </h1>
            <p className="material-subtitle mt-3">
              Inspect platform orders by amount, rebate, fee, status, and saved views for disputes or review queues.
            </p>
          </div>
          <Link
            href={`/api/admin/transactions/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`}
            className="material-button-outlined px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Export CSV
          </Link>
        </div>
      </div>

      <TransactionFilters
        currentView={params.view}
        currentStatus={params.status}
        currentFrom={params.from}
        currentTo={params.to}
      />

      <div className="space-y-4 lg:hidden">
        {transactions.length === 0 ? (
          <div className="material-empty px-6 py-12 text-center">
            <p className="text-base font-medium text-slate-700">
              No transactions match the current filters.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Adjust the date, status, or saved view to widen the result set.
            </p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="material-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{transaction.user.email}</p>
                  <p className="text-sm text-slate-500">{transaction.merchant.name}</p>
                  <Link
                    href={`/transactions/${transaction.id}`}
                    className="mt-1 block font-mono text-xs text-indigo-600 hover:underline"
                  >
                    {transaction.id}
                  </Link>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(transaction.status)}`}
                >
                  {transaction.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Amount</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatCurrency(Number(transaction.totalAmount))}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Rebate</p>
                  <p className="mt-1 font-medium text-green-600">
                    {formatCurrency(Number(transaction.rebateAmount))}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Service Fee</p>
                  <p className="mt-1 font-medium text-blue-600">
                    {formatCurrency(Number(transaction.serviceFee))}
                  </p>
                </div>
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-900">
                  <p className="text-indigo-600">Date</p>
                  <p className="mt-1 font-medium">
                    {transaction.createdAt.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {transactions.length > 0 ? (
        <div className="material-table-shell hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="p-4">ID</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Merchant</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Rebate</th>
                  <th className="p-4">Service Fee</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-4 font-mono text-xs text-slate-500">
                      <Link
                        href={`/transactions/${transaction.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {transaction.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="p-4">{transaction.user.email}</td>
                    <td className="p-4">{transaction.merchant.name}</td>
                    <td className="p-4 font-medium">
                      {formatCurrency(Number(transaction.totalAmount))}
                    </td>
                    <td className="p-4 text-green-600">
                      {formatCurrency(Number(transaction.rebateAmount))}
                    </td>
                    <td className="p-4 text-blue-600">
                      {formatCurrency(Number(transaction.serviceFee))}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(transaction.status)}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {transaction.createdAt.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <PaginationControls
        pathname="/transactions"
        params={baseParams}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </div>
  );
}
