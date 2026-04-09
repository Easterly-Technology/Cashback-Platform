import { prisma } from "@cashback/database";
import { formatCurrency, parseBankInfo } from "@cashback/shared";
import { WithdrawalStatusActions } from "./withdrawal-status-actions";

export const dynamic = "force-dynamic";

function statusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "status-badge status-badge-success";
    case "APPROVED":
      return "status-badge status-badge-info";
    case "REJECTED":
      return "status-badge status-badge-danger";
    default:
      return "status-badge status-badge-warning";
  }
}

export default async function WithdrawalsPage() {
  const [
    requests,
    pendingAggregate,
    approvedAggregate,
    completedAggregate,
    rejectedAggregate,
  ] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            bankInfo: true,
          },
        },
      },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: "PENDING" },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: "APPROVED" },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: "COMPLETED" },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: "REJECTED" },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  const summaryCards = [
    {
      label: "Pending",
      count: pendingAggregate._count,
      amount: Number(pendingAggregate._sum.amount ?? 0),
      tone: "border-amber-200 bg-amber-50",
    },
    {
      label: "Approved",
      count: approvedAggregate._count,
      amount: Number(approvedAggregate._sum.amount ?? 0),
      tone: "border-indigo-200 bg-indigo-50",
    },
    {
      label: "Completed",
      count: completedAggregate._count,
      amount: Number(completedAggregate._sum.amount ?? 0),
      tone: "border-emerald-200 bg-emerald-50",
    },
    {
      label: "Rejected",
      count: rejectedAggregate._count,
      amount: Number(rejectedAggregate._sum.amount ?? 0),
      tone: "border-rose-200 bg-rose-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <span className="material-chip">Payout Operations</span>
        <h1 className="material-title mt-4 text-slate-950">Withdrawals</h1>
        <p className="material-subtitle mt-3 max-w-2xl">
          Review withdrawal requests, verify payout details, and move each request through approval and completion states.
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

      <div className="material-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Withdrawal Queue</h2>
            <p className="mt-1 text-sm text-slate-500">
              Requests include the user&apos;s saved payout details and the current processing state.
            </p>
          </div>
          <span className="material-chip material-chip-muted">
            {requests.length.toLocaleString()} requests
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="material-empty px-6 py-10 text-center">
            <p className="text-base font-medium text-slate-700">
              No withdrawal requests yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              When users request a cash payout, the queue will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 xl:hidden">
              {requests.map((request) => {
                const bankInfo = parseBankInfo(request.user.bankInfo);

                return (
                  <div key={request.id} className="material-card-flat p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{request.user.name}</p>
                        <p className="text-sm text-slate-500">{request.user.email}</p>
                      </div>
                      <span className={statusClass(request.status)}>{request.status}</span>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-slate-500">Amount</p>
                        <p className="mt-1 font-semibold text-slate-950">
                          {formatCurrency(Number(request.amount))}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-slate-500">Payout Details</p>
                        {bankInfo ? (
                          <>
                            <p className="mt-1 font-semibold text-slate-900">
                              {bankInfo.accountHolderName}
                            </p>
                            <p className="mt-1 text-slate-600">{bankInfo.bankName}</p>
                            <p className="mt-1 font-mono text-xs text-slate-500">
                              {bankInfo.accountNumber}
                            </p>
                          </>
                        ) : (
                          <p className="mt-1 text-slate-400">No payout details saved</p>
                        )}
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-slate-500">Timeline</p>
                        <p className="mt-1 text-slate-900">
                          Requested {request.createdAt.toLocaleString()}
                        </p>
                        <p className="mt-1 text-slate-500">
                          {request.processedAt
                            ? `Updated ${request.processedAt.toLocaleString()}`
                            : "Awaiting admin action"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <WithdrawalStatusActions
                        id={request.id}
                        status={request.status}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="material-table-shell hidden xl:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="p-4">Requester</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Payout Details</th>
                      <th className="p-4">Requested</th>
                      <th className="p-4">Processed</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => {
                      const bankInfo = parseBankInfo(request.user.bankInfo);

                      return (
                        <tr key={request.id} className="border-b border-slate-100 align-top">
                          <td className="p-4">
                            <p className="font-medium text-slate-900">{request.user.name}</p>
                            <p className="text-xs text-slate-500">{request.user.email}</p>
                          </td>
                          <td className="p-4 font-medium text-slate-950">
                            {formatCurrency(Number(request.amount))}
                          </td>
                          <td className="p-4">
                            {bankInfo ? (
                              <div className="space-y-1">
                                <p className="font-medium text-slate-900">
                                  {bankInfo.accountHolderName}
                                </p>
                                <p className="text-xs text-slate-500">{bankInfo.bankName}</p>
                                <p className="font-mono text-xs text-slate-400">
                                  {bankInfo.accountNumber}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                No payout details saved
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-slate-500">
                            {request.createdAt.toLocaleString()}
                          </td>
                          <td className="p-4 text-slate-500">
                            {request.processedAt
                              ? request.processedAt.toLocaleString()
                              : "Awaiting action"}
                          </td>
                          <td className="p-4">
                            <span className={statusClass(request.status)}>{request.status}</span>
                          </td>
                          <td className="p-4">
                            <WithdrawalStatusActions
                              id={request.id}
                              status={request.status}
                            />
                          </td>
                        </tr>
                      );
                    })}
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
