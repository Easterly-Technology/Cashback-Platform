import Link from "next/link";
import { prisma } from "@cashback/database";
import { formatCurrency } from "@cashback/shared";
import type { UserCashSummary } from "@/lib/cash-summary";

export async function TabWallet({
  userId,
  cashSummary,
}: {
  userId: string;
  cashSummary: UserCashSummary;
}) {
  const [recentOrders, recentWithdrawals, user] = await Promise.all([
    prisma.marketplaceOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { bankInfo: true },
    }),
  ]);

  const bankInfo = user?.bankInfo as {
    bankName?: string;
    accountNumber?: string;
  } | null;

  const statusBadgeClass: Record<string, string> = {
    PENDING: "status-badge status-badge-warning",
    APPROVED: "status-badge status-badge-info",
    COMPLETED: "status-badge status-badge-success",
    REJECTED: "status-badge status-badge-danger",
  };

  return (
    <div className="space-y-4">
      {/* Cash Balance Hero */}
      <div className="overflow-hidden rounded-[28px] border border-emerald-200/50 bg-gradient-to-br from-emerald-600/90 to-teal-500/85 px-5 pb-4 pt-5 text-white shadow-[0_22px_46px_rgba(16,185,129,0.18),inset_0_1px_0_rgba(255,255,255,0.22)]">
        <p className="text-xs font-medium tracking-wide text-emerald-100/80">
          Available to Withdraw
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight">
          {formatCurrency(cashSummary.availableToWithdraw)}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-white/15 bg-white/10 px-2 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-emerald-100/70">
              Pending
            </p>
            <p className="mt-1 text-sm font-bold">
              {formatCurrency(cashSummary.pendingWithdrawalAmount)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-2 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-emerald-100/70">
              Withdrawn
            </p>
            <p className="mt-1 text-sm font-bold">
              {formatCurrency(cashSummary.withdrawnToDate)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-2 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-emerald-100/70">
              Lifetime
            </p>
            <p className="mt-1 text-sm font-bold">
              {formatCurrency(cashSummary.lifetimeProceeds)}
            </p>
          </div>
        </div>
        <Link
          href="/profile/asset"
          className="mt-3 block w-full rounded-2xl bg-white/20 py-2.5 text-center text-sm font-semibold transition hover:bg-white/28"
        >
          Request Withdrawal
        </Link>
      </div>

      {/* Recent Trades */}
      <div className="material-card overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Recent Trades
          </h2>
          <Link
            href="/exchange"
            className="text-xs font-semibold text-blue-700"
          >
            Exchange
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-400">No trades yet</p>
        ) : (
          <div className="divide-y divide-slate-100/70">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    Sold at RM{Number(order.pricePerToken).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {order.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-rose-500">
                    -{Number(order.tokenAmount).toLocaleString()} tokens
                  </p>
                  <p className="text-xs font-medium text-emerald-600">
                    {formatCurrency(Number(order.cashValue))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal History */}
      <div className="material-card overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Withdrawals
          </h2>
          <Link
            href="/profile/asset"
            className="text-xs font-semibold text-blue-700"
          >
            Manage
          </Link>
        </div>
        {recentWithdrawals.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-400">
            No withdrawal requests yet
          </p>
        ) : (
          <div className="divide-y divide-slate-100/70">
            {recentWithdrawals.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(Number(w.amount))}
                  </p>
                  <p className="text-xs text-slate-400">
                    {w.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <span className={statusBadgeClass[w.status] ?? "status-badge"}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bank Info */}
      <div className="material-card-flat px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-950">Payout Account</h2>
        {bankInfo?.bankName ? (
          <div className="mt-2 text-sm text-slate-600">
            <p>{bankInfo.bankName}</p>
            <p className="text-xs text-slate-400">
              ****{bankInfo.accountNumber?.slice(-4)}
            </p>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-sm text-slate-400">No bank info added yet</p>
            <Link
              href="/profile/account-details"
              className="mt-1 inline-block text-xs font-semibold text-blue-700"
            >
              Add bank details &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
