import { prisma } from "@cashback/database";
import TransactionFilters from "./transaction-filters";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const where: Record<string, unknown> = {};
  if (params.status && params.status !== "all") {
    where.status = params.status;
  }
  if (params.from) {
    where.createdAt = { ...(where.createdAt as object), gte: new Date(params.from) };
  }
  if (params.to) {
    where.createdAt = { ...(where.createdAt as object), lt: new Date(params.to) };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
      merchant: { select: { name: true } },
    },
  });

  const statusColor = (status: string) => {
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
  };

  return (
    <div>
      <div className="material-card mb-6 p-6">
        <span className="material-chip">Transactions</span>
        <h1 className="material-title mt-4 text-slate-950">
          Transactions
        </h1>
        <p className="material-subtitle mt-3">
          Inspect platform orders by amount, rebate, fee, and status.
        </p>
      </div>

      <TransactionFilters
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
              Adjust the date or status filters to widen the result set.
            </p>
          </div>
        ) : (
          transactions.map((t) => (
            <div
              key={t.id}
              className="material-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{t.user.email}</p>
                  <p className="text-sm text-slate-500">{t.merchant.name}</p>
                  <p className="mt-1 font-mono text-xs text-slate-400">
                    {t.id}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(t.status)}`}
                >
                  {t.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Amount</p>
                  <p className="mt-1 font-medium text-slate-900">
                    RM{Number(t.totalAmount).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Rebate</p>
                  <p className="mt-1 font-medium text-green-600">
                    RM{Number(t.rebateAmount).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Service Fee</p>
                  <p className="mt-1 font-medium text-blue-600">
                    RM{Number(t.serviceFee).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-900">
                  <p className="text-indigo-600">Date</p>
                  <p className="mt-1 font-medium">{t.createdAt.toLocaleString()}</p>
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
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-mono text-xs text-slate-500">
                      {t.id.slice(0, 8)}
                    </td>
                    <td className="p-4">{t.user.email}</td>
                    <td className="p-4">{t.merchant.name}</td>
                    <td className="p-4 font-medium">
                      RM{Number(t.totalAmount).toLocaleString()}
                    </td>
                    <td className="p-4 text-green-600">
                      RM{Number(t.rebateAmount).toLocaleString()}
                    </td>
                    <td className="p-4 text-blue-600">
                      RM{Number(t.serviceFee).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(t.status)}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {t.createdAt.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
