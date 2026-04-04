import { prisma } from "@cashback/database";

export const dynamic = "force-dynamic";

export default async function MerchantsPage() {
  const merchants = await prisma.merchant.findMany({
    orderBy: { createdAt: "desc" },
  });

  const merchantsWithOwed = await Promise.all(
    merchants.map(async (m) => {
      const agg = await prisma.transaction.aggregate({
        where: { merchantId: m.id, status: "CONFIRMED" },
        _sum: { rebateAmount: true, serviceFee: true },
      });
      return {
        ...m,
        amountOwed:
          Number(agg._sum.rebateAmount ?? 0) +
          Number(agg._sum.serviceFee ?? 0),
      };
    }),
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Merchants
          </h1>
          <p className="text-sm text-slate-500">
            Review merchant status, fees, and outstanding platform balances.
          </p>
        </div>
        <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
          Add Merchant
        </button>
      </div>

      <div className="space-y-4 lg:hidden">
        {merchantsWithOwed.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-base font-medium text-slate-700">
              No merchants have been onboarded yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Add your first merchant to start issuing QR sales and settlement records.
            </p>
          </div>
        ) : (
          merchantsWithOwed.map((m) => (
            <div
              key={m.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{m.name}</p>
                  <p className="text-sm text-slate-500">{m.contactEmail}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    m.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : m.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Rebate</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {(Number(m.rebatePct) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Service Fee</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {(Number(m.serviceFeePct) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="col-span-2 rounded-2xl bg-slate-950 p-3 text-white">
                  <p className="text-slate-300">Amount Owed</p>
                  <p className="mt-1 text-lg font-semibold">
                    RM{m.amountOwed.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <button className="font-medium text-blue-600 hover:underline">
                  Edit
                </button>
                <button className="font-medium text-red-600 hover:underline">
                  Suspend
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {merchantsWithOwed.length > 0 ? (
        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Rebate %</th>
                  <th className="p-4">Service Fee</th>
                  <th className="p-4">Amount Owed</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {merchantsWithOwed.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium">{m.name}</td>
                    <td className="p-4 text-slate-500">{m.contactEmail}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          m.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : m.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {(Number(m.rebatePct) * 100).toFixed(1)}%
                    </td>
                    <td className="p-4">
                      {(Number(m.serviceFeePct) * 100).toFixed(1)}%
                    </td>
                    <td className="p-4 font-medium">
                      RM{m.amountOwed.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <button className="mr-2 text-xs text-blue-600 hover:underline">
                        Edit
                      </button>
                      <button className="text-xs text-red-600 hover:underline">
                        Suspend
                      </button>
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
