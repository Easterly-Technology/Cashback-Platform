import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import { getTokenSettingsSnapshot } from "@cashback/shared";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

function formatCurrency(value: number) {
  return `RM${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function ProfilePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  const [user, transactionStats, orderStats, withdrawalStats, transactions, marketplaceOrders, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
    }),
    prisma.transaction.aggregate({
      where: { userId },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.marketplaceOrder.aggregate({
      where: { userId },
      _sum: { cashValue: true },
      _count: true,
    }),
    prisma.withdrawalRequest.aggregate({
      where: { userId, status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      include: { merchant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.marketplaceOrder.findMany({
      where: { userId },
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
  ]);

  const tokenSettings = getTokenSettingsSnapshot(settings);

  return (
    <div className="space-y-5 py-4">
      <div className="material-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-lg font-bold text-white shadow-sm">
            {(user?.name ?? "?")
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-slate-950">
              {user?.name}
            </p>
            <p className="truncate text-sm text-slate-500">{user?.email}</p>
            <p className="mt-1 text-xs text-slate-400">
              Member since{" "}
              {user?.createdAt.toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="material-card p-5">
        <h2 className="text-sm font-semibold text-slate-950">Account Summary</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Spending</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(Number(transactionStats._sum.totalAmount ?? 0))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Transactions</span>
            <span className="font-semibold text-slate-900">{transactionStats._count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Token Trades</span>
            <span className="font-semibold text-slate-900">{orderStats._count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cash Withdrawn</span>
            <span className="font-semibold text-emerald-600">
              {formatCurrency(Number(withdrawalStats._sum.amount ?? 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="material-card overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-slate-950">Purchases</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="px-5 pb-5 text-sm text-slate-400">No purchases yet</div>
        ) : (
          <div className="divide-y divide-slate-100/70">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {tx.merchant.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {tx.createdAt.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(Number(tx.totalAmount))}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-600">
                    +{(Number(tx.totalAmount) * tokenSettings.multiplier).toLocaleString()} tokens
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="material-card overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-slate-950">Token Trades</h2>
        </div>
        {marketplaceOrders.length === 0 ? (
          <div className="px-5 pb-5 text-sm text-slate-400">No token trades yet</div>
        ) : (
          <div className="divide-y divide-slate-100/70">
            {marketplaceOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Sold at RM{Number(order.pricePerToken).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {order.createdAt.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-rose-500">
                    -{Number(order.tokenAmount).toLocaleString()} tokens
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-600">
                    {formatCurrency(Number(order.cashValue))} received
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SignOutButton />
    </div>
  );
}
