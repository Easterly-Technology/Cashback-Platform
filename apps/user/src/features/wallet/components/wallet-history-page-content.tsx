import Link from "next/link";
import { prisma } from "@cashback/database";
import { formatCurrency, getTokenSettingsSnapshot } from "@cashback/shared";
import { formatTokenAmount } from "@/lib/reward-journey";

function formatHistoryDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function withdrawalStatusClass(status: string) {
  const classes: Record<string, string> = {
    PENDING: "border-[#f0b90b]/40 bg-[#2b2615] text-[#f0b90b]",
    APPROVED: "border-[#f0b90b]/40 bg-[#2b2615] text-[#f0b90b]",
    COMPLETED: "border-[#0ecb81]/40 bg-[#10261f] text-[#0ecb81]",
    REJECTED: "border-[#f6465d]/40 bg-[#2d171f] text-[#f6465d]",
  };

  return classes[status] ?? "border-[#2b3139] bg-[#0b0e11] text-[#eaecef]";
}

export async function WalletHistoryPageContent({
  userId,
}: {
  userId: string;
}) {
  const [purchases, releases, withdrawals, tradeOrders, settings] =
    await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        include: { merchant: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.tokenReleaseLog.findMany({
        where: { userId },
        orderBy: { releaseDate: "desc" },
        take: 80,
      }),
      prisma.withdrawalRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.marketplaceOrder.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.platformSetting.findMany({
        where: {
          key: {
            in: ["token_multiplier", "token_release_rate"],
          },
        },
      }),
    ]);

  const tokenSettings = getTokenSettingsSnapshot(settings);
  type WalletHistoryItem =
    | { type: "purchase"; date: Date; data: (typeof purchases)[0] }
    | { type: "release"; date: Date; data: (typeof releases)[0] }
    | { type: "withdrawal"; date: Date; data: (typeof withdrawals)[0] }
    | { type: "trade"; date: Date; data: (typeof tradeOrders)[0] };

  const historyItems: WalletHistoryItem[] = [
    ...purchases.map(
      (purchase) =>
        ({
          type: "purchase",
          date: purchase.createdAt,
          data: purchase,
        }) as WalletHistoryItem,
    ),
    ...releases.map(
      (release) =>
        ({
          type: "release",
          date: release.releaseDate,
          data: release,
        }) as WalletHistoryItem,
    ),
    ...withdrawals.map(
      (withdrawal) =>
        ({
          type: "withdrawal",
          date: withdrawal.createdAt,
          data: withdrawal,
        }) as WalletHistoryItem,
    ),
    ...tradeOrders.map(
      (trade) =>
        ({
          type: "trade",
          date: trade.createdAt,
          data: trade,
        }) as WalletHistoryItem,
    ),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 120);

  const isEmpty = historyItems.length === 0;

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-3 bg-[#0b0e11] pb-8 text-[#eaecef]">
      <section className="rounded-lg border border-[#1e2329] bg-[#181a20] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[#848e9c]">
              Wallet
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Wallet History
            </h1>
            <p className="mt-2 text-sm text-[#848e9c]">
              Purchases, rewards, releases, withdrawals and cash credits.
            </p>
          </div>
          <Link
            href="/wallet"
            className="rounded-md border border-[#f0b90b]/50 px-3 py-2 text-xs font-bold text-[#f0b90b] transition hover:bg-[#2b2615]"
          >
            Wallet
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#1e2329] bg-[#181a20]">
        {isEmpty ? (
          <p className="px-4 py-5 text-sm text-[#848e9c]">
            No wallet history yet.
          </p>
        ) : (
          <div className="divide-y divide-[#1e2329]">
            {historyItems.map((item) => {
              if (item.type === "purchase") {
                const purchase = item.data;
                const earnedTokens =
                  Number(purchase.totalAmount) * tokenSettings.multiplier;

                return (
                  <div
                    key={`purchase-${purchase.id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#2b2615] px-2 py-1 text-[10px] font-bold uppercase text-[#f0b90b]">
                          Reward
                        </span>
                        <p className="truncate font-semibold text-white">
                          {purchase.merchant.name}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-[#848e9c]">
                        {formatHistoryDate(purchase.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold text-white">
                        {formatCurrency(Number(purchase.totalAmount))}
                      </p>
                      <p className="text-xs font-medium text-[#0ecb81]">
                        +{formatTokenAmount(earnedTokens)} CBT
                      </p>
                    </div>
                  </div>
                );
              }

              if (item.type === "release") {
                const release = item.data;

                return (
                  <div
                    key={`release-${release.id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#10261f] px-2 py-1 text-[10px] font-bold uppercase text-[#0ecb81]">
                          Release
                        </span>
                        <p className="font-semibold text-white">
                          CBT Released
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-[#848e9c]">
                        {formatHistoryDate(release.releaseDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-[#0ecb81]">
                        +{formatTokenAmount(Number(release.amount))} CBT
                      </p>
                      <p className="text-xs text-[#848e9c]">
                        {formatTokenAmount(Number(release.cumulative))} total
                      </p>
                    </div>
                  </div>
                );
              }

              if (item.type === "trade") {
                const trade = item.data;

                return (
                  <div
                    key={`trade-${trade.id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#10261f] px-2 py-1 text-[10px] font-bold uppercase text-[#0ecb81]">
                          Credit
                        </span>
                        <p className="font-semibold text-white">
                          Trade Cash Credit
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-[#848e9c]">
                        {formatHistoryDate(trade.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-[#0ecb81]">
                        {formatCurrency(Number(trade.cashValue))}
                      </p>
                      <p className="text-xs text-[#f6465d]">
                        -{formatTokenAmount(Number(trade.tokenAmount))} CBT
                      </p>
                    </div>
                  </div>
                );
              }

              const withdrawal = item.data;

              return (
                <div
                  key={`withdrawal-${withdrawal.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#2b3139] px-2 py-1 text-[10px] font-bold uppercase text-[#eaecef]">
                        Withdraw
                      </span>
                      <p className="font-semibold text-white">
                        Withdrawal Request
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-[#848e9c]">
                      {formatHistoryDate(withdrawal.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-white">
                      {formatCurrency(Number(withdrawal.amount))}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded border px-2 py-1 text-[10px] font-bold uppercase ${withdrawalStatusClass(
                        withdrawal.status,
                      )}`}
                    >
                      {withdrawal.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
