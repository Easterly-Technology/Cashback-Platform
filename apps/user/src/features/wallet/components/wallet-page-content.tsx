import Link from "next/link";
import { prisma } from "@cashback/database";
import {
  calculateDailyRelease,
  formatCurrency,
  getTokenSettingsSnapshot,
} from "@cashback/shared";
import { getUserCashSummary } from "@/lib/cash-summary";
import { formatTokenAmount, getReleaseForecast } from "@/lib/reward-journey";

function formatWalletDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export async function WalletPageContent({ userId }: { userId: string }) {
  const [
    entitlement,
    settings,
    cashSummary,
    orderStats,
    recentOrders,
    recentPurchases,
    recentReleases,
  ] = await Promise.all([
    prisma.userTokenEntitlement.findUnique({ where: { userId } }),
    prisma.platformSetting.findMany({
      where: {
        key: {
          in: ["token_release_rate", "token_multiplier"],
        },
      },
    }),
    getUserCashSummary(userId),
    prisma.marketplaceOrder.aggregate({
      where: { userId },
      _sum: { tokenAmount: true },
    }),
    prisma.marketplaceOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.transaction.findMany({
      where: { userId },
      include: {
        merchant: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.tokenReleaseLog.findMany({
      where: { userId },
      orderBy: { releaseDate: "desc" },
      take: 4,
    }),
  ]);

  const tokenSettings = getTokenSettingsSnapshot(settings);
  const entitled = Number(entitlement?.entitledTokens ?? 0);
  const released = Number(entitlement?.releasedTokens ?? 0);
  const available = Number(entitlement?.availableTokens ?? 0);
  const spent = Number(entitlement?.totalSpending ?? 0);
  const usedInTrades = Number(orderStats._sum.tokenAmount ?? 0);
  const dailyRelease = calculateDailyRelease(
    entitled,
    released,
    tokenSettings.releaseRate,
  ).toNumber();
  const releaseProgress =
    entitled > 0 ? Math.min((released / entitled) * 100, 100) : 0;
  const forecast = getReleaseForecast({
    entitledTokens: entitled,
    releasedTokens: released,
    releaseRate: tokenSettings.releaseRate,
  });

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-3 bg-[#0b0e11] pb-8 text-[#eaecef]">
      <section className="rounded-lg border border-[#1e2329] bg-[#181a20] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[#848e9c]">
              Wallet
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">Assets</h1>
          </div>
          <Link href="/wallet/history" className="text-xs font-bold text-[#f0b90b]">
            History
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[#2b3139] bg-[#0b0e11] p-3">
            <p className="text-[10px] font-semibold uppercase text-[#848e9c]">
              Cash Wallet
            </p>
            <p className="mt-2 font-mono text-xl font-bold text-white">
              {formatCurrency(cashSummary.availableToWithdraw)}
            </p>
            <p className="mt-1 text-xs text-[#848e9c]">Available cash</p>
          </div>
          <div className="rounded-lg border border-[#2b3139] bg-[#0b0e11] p-3">
            <p className="text-[10px] font-semibold uppercase text-[#848e9c]">
              Token Wallet
            </p>
            <p className="mt-2 font-mono text-xl font-bold text-[#f0b90b]">
              {formatTokenAmount(available)}
            </p>
            <p className="mt-1 text-xs text-[#848e9c]">CBT ready</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#1e2329] bg-[#181a20] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[#848e9c]">
              Cash Wallet
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-white">
              {formatCurrency(cashSummary.availableToWithdraw)}
            </p>
            <p className="mt-1 text-xs text-[#848e9c]">
              Cash from completed CBT trades
            </p>
          </div>
          <span className="rounded-md border border-[#0ecb81]/40 bg-[#10261f] px-2 py-1 text-xs font-bold text-[#0ecb81]">
            Cash
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-[#1e2329] border-t border-[#1e2329] pt-3 text-center">
          <div className="px-2">
            <p className="text-[10px] font-medium uppercase text-[#848e9c]">
              Available
            </p>
            <p className="mt-1 font-mono text-xs font-bold text-white">
              {formatCurrency(cashSummary.availableToWithdraw)}
            </p>
          </div>
          <div className="px-2">
            <p className="text-[10px] font-medium uppercase text-[#848e9c]">
              Processing
            </p>
            <p className="mt-1 font-mono text-xs font-bold text-[#f0b90b]">
              {formatCurrency(cashSummary.pendingWithdrawalAmount)}
            </p>
          </div>
          <div className="px-2">
            <p className="text-[10px] font-medium uppercase text-[#848e9c]">
              Credits
            </p>
            <p className="mt-1 font-mono text-xs font-bold text-white">
              {formatCurrency(cashSummary.lifetimeProceeds)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#1e2329] bg-[#181a20] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[#848e9c]">
              Token Wallet
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-[#f0b90b]">
              {formatTokenAmount(available)}
            </p>
            <p className="mt-1 text-xs text-[#848e9c]">CBT ready to trade</p>
          </div>
          <Link
            href="/trade"
            className="rounded-md border border-[#f0b90b]/50 px-3 py-2 text-xs font-bold text-[#f0b90b] transition hover:bg-[#2b2615]"
          >
            Trade
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-[#1e2329] border-t border-[#1e2329] pt-3 text-center">
          <div className="px-2">
            <p className="text-[10px] font-medium uppercase text-[#848e9c]">
              Entitled
            </p>
            <p className="mt-1 font-mono text-xs font-bold text-white">
              {formatTokenAmount(entitled)}
            </p>
          </div>
          <div className="px-2">
            <p className="text-[10px] font-medium uppercase text-[#848e9c]">
              Released
            </p>
            <p className="mt-1 font-mono text-xs font-bold text-[#0ecb81]">
              {formatTokenAmount(released)}
            </p>
          </div>
          <div className="px-2">
            <p className="text-[10px] font-medium uppercase text-[#848e9c]">
              Traded
            </p>
            <p className="mt-1 font-mono text-xs font-bold text-[#f6465d]">
              {usedInTrades > 0
                ? `-${formatTokenAmount(usedInTrades)}`
                : "0"}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">Release Progress</h2>
              <p className="mt-1 text-xs text-[#848e9c]">
                {forecast.daysRemaining > 0
                  ? `${forecast.daysRemaining} days remaining`
                  : "Fully released"}
              </p>
            </div>
            <span className="rounded-md bg-[#2b3139] px-2 py-1 font-mono text-xs font-bold text-[#f0b90b]">
              {releaseProgress.toFixed(1)}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded bg-[#2b3139]">
            <div
              className="h-full rounded bg-[#f0b90b]"
              style={{ width: `${releaseProgress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-[#2b3139] px-3 py-2">
            <p className="text-[10px] uppercase text-[#848e9c]">Next</p>
            <p className="mt-1 font-mono text-xs font-bold text-[#0ecb81]">
              +{formatTokenAmount(forecast.nextRelease)}
            </p>
          </div>
          <div className="rounded-md border border-[#2b3139] px-3 py-2">
            <p className="text-[10px] uppercase text-[#848e9c]">7 Days</p>
            <p className="mt-1 font-mono text-xs font-bold text-white">
              +{formatTokenAmount(forecast.nextSevenDays)}
            </p>
          </div>
          <div className="rounded-md border border-[#2b3139] px-3 py-2">
            <p className="text-[10px] uppercase text-[#848e9c]">Daily</p>
            <p className="mt-1 font-mono text-xs font-bold text-white">
              +{formatTokenAmount(dailyRelease)}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#1e2329] bg-[#181a20]">
        <div className="flex items-center justify-between border-b border-[#1e2329] px-4 py-3">
          <h2 className="text-sm font-bold text-white">Release History</h2>
          <Link
            href="/wallet/history"
            className="text-xs font-bold text-[#f0b90b]"
          >
            View All
          </Link>
        </div>
        {recentReleases.length === 0 ? (
          <p className="px-4 py-5 text-sm text-[#848e9c]">
            No token releases yet.
          </p>
        ) : (
          <div className="divide-y divide-[#1e2329]">
            {recentReleases.map((release) => (
              <div
                key={release.id}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-white">
                    {formatWalletDate(release.releaseDate)}
                  </p>
                  <p className="mt-0.5 text-xs text-[#848e9c]">
                    {formatTokenAmount(Number(release.cumulative))} total
                  </p>
                </div>
                <p className="font-mono font-bold text-[#0ecb81]">
                  +{formatTokenAmount(Number(release.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-[#1e2329] bg-[#181a20]">
        <div className="flex items-center justify-between border-b border-[#1e2329] px-4 py-3">
          <h2 className="text-sm font-bold text-white">Recent Trades</h2>
          <Link href="/trade" className="text-xs font-bold text-[#f0b90b]">
            Trade
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-4 py-5 text-sm text-[#848e9c]">No trades yet.</p>
        ) : (
          <div className="divide-y divide-[#1e2329]">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-white">
                    Sold at RM{Number(order.pricePerToken).toFixed(2)}
                  </p>
                  <p className="mt-0.5 text-xs text-[#848e9c]">
                    {formatWalletDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[#f6465d]">
                    -{formatTokenAmount(Number(order.tokenAmount))} CBT
                  </p>
                  <p className="text-xs font-medium text-[#0ecb81]">
                    {formatCurrency(Number(order.cashValue))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-[#1e2329] bg-[#181a20]">
        <div className="border-b border-[#1e2329] px-4 py-3">
          <h2 className="text-sm font-bold text-white">Recent Purchases</h2>
        </div>
        {recentPurchases.length === 0 ? (
          <p className="px-4 py-5 text-sm text-[#848e9c]">
            No purchases yet.
          </p>
        ) : (
          <div className="divide-y divide-[#1e2329]">
            {recentPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-white">
                    {purchase.merchant.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#848e9c]">
                    {formatWalletDate(purchase.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-white">
                    {formatCurrency(Number(purchase.totalAmount))}
                  </p>
                  <p className="text-xs text-[#848e9c]">{purchase.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[#1e2329] bg-[#181a20] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">Reward Spending</h2>
            <p className="mt-1 text-xs text-[#848e9c]">
              {tokenSettings.multiplier}x CBT entitlement rate
            </p>
          </div>
          <p className="font-mono text-sm font-bold text-white">
            {formatCurrency(spent)}
          </p>
        </div>
      </section>
    </div>
  );
}
