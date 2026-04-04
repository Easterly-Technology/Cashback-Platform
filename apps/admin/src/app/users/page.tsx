import { prisma } from "@cashback/database";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: { tokenEntitlement: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Users
        </h1>
        <p className="text-sm text-slate-500">
          Monitor customer status, cumulative spend, and token balances.
        </p>
      </div>

      <div className="space-y-4 lg:hidden">
        {users.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-base font-medium text-slate-700">
              No users have registered yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Once customers start using the platform, their spend and entitlement snapshots will appear here.
            </p>
          </div>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{u.name}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    u.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {u.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Total Spending</p>
                  <p className="mt-1 font-medium text-slate-900">
                    RM
                    {Number(
                      u.tokenEntitlement?.totalSpending ?? 0,
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Entitled Tokens</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {Number(
                      u.tokenEntitlement?.entitledTokens ?? 0,
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2 rounded-2xl bg-slate-950 p-3 text-white">
                  <p className="text-slate-300">Available Tokens</p>
                  <p className="mt-1 text-lg font-semibold">
                    {Number(
                      u.tokenEntitlement?.availableTokens ?? 0,
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <button className="font-medium text-blue-600 hover:underline">
                  View
                </button>
                <button className="font-medium text-red-600 hover:underline">
                  Suspend
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {users.length > 0 ? (
        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Total Spending</th>
                  <th className="p-4">Entitled Tokens</th>
                  <th className="p-4">Available Tokens</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4 text-slate-500">{u.email}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          u.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4">
                      RM
                      {Number(
                        u.tokenEntitlement?.totalSpending ?? 0,
                      ).toLocaleString()}
                    </td>
                    <td className="p-4">
                      {Number(
                        u.tokenEntitlement?.entitledTokens ?? 0,
                      ).toLocaleString()}
                    </td>
                    <td className="p-4">
                      {Number(
                        u.tokenEntitlement?.availableTokens ?? 0,
                      ).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <button className="mr-2 text-xs text-blue-600 hover:underline">
                        View
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
