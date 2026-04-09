import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import { formatCurrency, getTokenSettingsSnapshot } from "@cashback/shared";
import { auth } from "@/lib/auth";
import { getUserCashSummary } from "@/lib/cash-summary";

export default async function TransactionsPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  const [transactions, marketplaceOrders, settings, cashSummary] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      include: { merchant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.marketplaceOrder.findMany({
      where: { userId },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.platformSetting.findMany({
      where: {
        key: {
          in: ["token_multiplier"],
        },
      },
    }),
    getUserCashSummary(userId),
  ]);
  const tokenSettings = getTokenSettingsSnapshot(settings);

  return (
    <div className="space-y-5 py-4">
      <div className="material-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="material-chip">Wallet Snapshot</span>
            <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-950">
              Transaction History
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review confirmed purchases, token trades, and the cash already unlocked from selling tokens.
            </p>
          </div>
          <Link
            href="/profile#cash-wallet"
            className="material-button-outlined px-4 py-2.5 text-sm font-semibold"
          >
            Request Withdrawal
          </Link>
        </div>
      </div>

      <div className="material-card-flat p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-400">Available to Withdraw</p>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(cashSummary.availableToWithdraw)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Pending Withdrawals</p>
            <p className="text-xl font-bold text-amber-600">
              {formatCurrency(cashSummary.pendingWithdrawalAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Withdrawn So Far</p>
            <p className="text-xl font-bold text-slate-900">
              {formatCurrency(cashSummary.withdrawnToDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Lifetime Sold Value</p>
            <p className="text-xl font-bold text-slate-900">
              {formatCurrency(cashSummary.lifetimeProceeds)}
            </p>
          </div>
        </div>
      </div>

      <h2 className="font-semibold text-sm text-gray-500">Purchases</h2>
      <div className="material-card overflow-hidden">
        {transactions.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">No purchases yet</p>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex justify-between items-center border-b border-slate-100 px-4 py-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{tx.merchant.name}</p>
                <p className="text-xs text-gray-400">{tx.createdAt.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatCurrency(Number(tx.totalAmount))}
                </p>
                <p className="text-xs text-green-500">
                  +
                  {(
                    Number(tx.totalAmount) * tokenSettings.multiplier
                  ).toLocaleString()}{" "}
                  tokens
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className="font-semibold text-sm text-gray-500">
        Token Trades
      </h2>
      <div className="material-card overflow-hidden">
        {marketplaceOrders.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">No token trades yet</p>
        ) : (
          marketplaceOrders.map((order) => (
            <div
              key={order.id}
              className="flex justify-between items-center border-b border-slate-100 px-4 py-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium">
                  Sold at RM{Number(order.pricePerToken).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  {order.createdAt.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-500">
                  -{Number(order.tokenAmount).toLocaleString()} tokens
                </p>
                <p className="text-xs text-green-600 font-medium">
                  {formatCurrency(Number(order.cashValue))} credited
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
