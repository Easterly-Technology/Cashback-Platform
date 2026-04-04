import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import { auth } from "@/lib/auth";

function formatCurrency(value: number) {
  return `RM${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function SettlementsPage() {
  const session = await auth();
  const merchantId = (session?.user as { id?: string } | undefined)?.id;

  if (!merchantId) {
    redirect("/login?callbackUrl=%2Fsettlements");
  }

  const [settlements, currentTotals] = await Promise.all([
    prisma.merchantSettlement.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.transaction.aggregate({
      where: { merchantId, status: "CONFIRMED" },
      _sum: { rebateAmount: true, serviceFee: true },
    }),
  ]);

  const currentOwed =
    Number(currentTotals._sum.rebateAmount ?? 0) +
    Number(currentTotals._sum.serviceFee ?? 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Settlements
        </h1>
        <p className="text-sm text-slate-500">
          Track what is owed to the platform and review payout periods from your phone or desktop.
        </p>
      </div>

      <div className="mb-6 rounded-3xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">Current Amount Owed to Platform</p>
        <p className="text-3xl font-bold text-red-600 mt-1">
          {formatCurrency(currentOwed)}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Rebate + service fee on all confirmed transactions
        </p>
      </div>

      <div className="space-y-4 lg:hidden">
        {settlements.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-base font-medium text-slate-700">
              No settlement periods yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Settlement cycles will appear here after confirmed sales accumulate and payouts are recorded.
            </p>
          </div>
        ) : (
          settlements.map((settlement) => (
            <div
              key={settlement.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {settlement.periodStart.toISOString().split("T")[0]} ~{" "}
                    {settlement.periodEnd.toISOString().split("T")[0]}
                  </p>
                  <p className="text-sm text-slate-500">
                    Paid{" "}
                    {settlement.paidAt
                      ? settlement.paidAt.toISOString().split("T")[0]
                      : "not yet"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    settlement.status === "PAID"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
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
      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500 bg-gray-50">
                <th className="p-3">Period</th>
                <th className="p-3">Total Rebate</th>
                <th className="p-3">Service Fee</th>
                <th className="p-3">Total Owed</th>
                <th className="p-3">Status</th>
                <th className="p-3">Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    No settlement periods yet
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => (
                  <tr key={settlement.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {settlement.periodStart.toISOString().split("T")[0]} ~{" "}
                      {settlement.periodEnd.toISOString().split("T")[0]}
                    </td>
                    <td className="p-3">
                      {formatCurrency(Number(settlement.totalRebate))}
                    </td>
                    <td className="p-3">
                      {formatCurrency(Number(settlement.totalServiceFee))}
                    </td>
                    <td className="p-3 font-medium">
                      {formatCurrency(Number(settlement.totalOwed))}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          settlement.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {settlement.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">
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
