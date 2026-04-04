import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import { auth } from "@/lib/auth";

function formatCurrency(value: number) {
  return `RM${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function TransactionsPage() {
  const session = await auth();
  const merchantId = (session?.user as { id?: string } | undefined)?.id;

  if (!merchantId) {
    redirect("/login?callbackUrl=%2Ftransactions");
  }

  const transactions = await prisma.transaction.findMany({
    where: { merchantId },
    include: {
      user: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>

      <div className="space-y-4 lg:hidden">
        {transactions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-base font-medium text-slate-700">
              No transactions yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Your completed and pending sales will appear here after QR checkouts begin.
            </p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{tx.user.email}</p>
                  <p className="mt-1 font-mono text-xs text-slate-400">{tx.id}</p>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                  {tx.status}
                </span>
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
                  <p className="mt-1 font-medium text-red-500">
                    {formatCurrency(Number(tx.rebateAmount))}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Service Fee</p>
                  <p className="mt-1 font-medium text-red-500">
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
      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500 bg-gray-50">
                <th className="p-3">ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Rebate</th>
                <th className="p-3">Service Fee</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs text-gray-500">{tx.id}</td>
                  <td className="p-3">{tx.user.email}</td>
                  <td className="p-3 font-medium">
                    {formatCurrency(Number(tx.totalAmount))}
                  </td>
                  <td className="p-3 text-red-500">
                    {formatCurrency(Number(tx.rebateAmount))}
                  </td>
                  <td className="p-3 text-red-500">
                    {formatCurrency(Number(tx.serviceFee))}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">
                    {tx.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400">
                    No transactions yet
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Transaction records are read-only and cannot be modified.
      </p>
    </div>
  );
}
