import Link from "next/link";
import { prisma } from "@cashback/database";
import { formatCurrency } from "@cashback/shared";
import { DiscoverIcon } from "@/components/icons";
import { HomeSummaryHeader } from "@/features/home/components/home-summary-header";
import { getUserDashboardSummary } from "@/features/home/server/dashboard-summary";
import { formatTokenAmount } from "@/lib/reward-journey";

function getDateOnly(date: Date) {
  return new Date(date.toISOString().split("T")[0]);
}

function formatHomeDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatPrice(value: number) {
  return `RM${value.toFixed(2)}`;
}

function withdrawalStatusClass(status: string) {
  const classes: Record<string, string> = {
    PENDING: "text-[#f0b90b]",
    APPROVED: "text-[#f0b90b]",
    COMPLETED: "text-[#0ecb81]",
    REJECTED: "text-[#f6465d]",
  };

  return classes[status] ?? "text-[#848e9c]";
}

export async function HomePageContent({
  userId,
}: {
  userId: string;
}) {
  const today = getDateOnly(new Date());
  const [
    summary,
    listings,
    latestMarketTrade,
    latestUserTrade,
    latestPurchase,
    latestWithdrawal,
  ] = await Promise.all([
    getUserDashboardSummary(userId),
    prisma.marketplaceListing.findMany({
      where: {
        listingDate: today,
        status: "ACTIVE",
      },
      orderBy: { priceTier: "asc" },
    }),
    prisma.marketplaceOrder.findFirst({
      orderBy: { createdAt: "desc" },
    }),
    prisma.marketplaceOrder.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findFirst({
      where: { userId },
      include: { merchant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.withdrawalRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeListings = listings
    .map((listing) => ({
      price: Number(listing.priceTier),
      remaining: Math.max(0, Math.floor(Number(listing.remainingQty))),
    }))
    .filter((listing) => listing.remaining > 0);
  const bestPrice =
    activeListings[0]?.price ?? Number(latestMarketTrade?.pricePerToken ?? 0);
  const highPrice =
    activeListings.at(-1)?.price ??
    Number(latestMarketTrade?.pricePerToken ?? bestPrice);
  const listedVolume = activeListings.reduce(
    (total, listing) => total + listing.remaining,
    0,
  );
  const cashBalance =
    summary.cashSummary.availableToWithdraw +
    summary.cashSummary.pendingWithdrawalAmount;
  const estimatedAssets =
    cashBalance + summary.availableTokens * bestPrice;
  const latestPurchaseTokens = latestPurchase
    ? Number(latestPurchase.totalAmount) * summary.tokenSettings.multiplier
    : 0;

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-3 bg-[#0b0e11] pb-8 text-[#eaecef]">
      <HomeSummaryHeader
        estimatedAssets={estimatedAssets}
        availableTokens={summary.availableTokens}
        dailyRelease={summary.dailyRelease}
        cashWallet={cashBalance}
        availableToWithdraw={summary.cashSummary.availableToWithdraw}
      />

      <section className="rounded-lg border border-[#1e2329] bg-[#181a20]">
        <div className="flex items-center justify-between border-b border-[#1e2329] px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-white">Markets</h2>
            <p className="mt-0.5 text-xs text-[#848e9c]">CBT/RM preview</p>
          </div>
          <Link href="/trade" className="text-xs font-bold text-[#f0b90b]">
            Trade
          </Link>
        </div>
        <div className="divide-y divide-[#1e2329]">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="font-semibold text-white">CBT/RM</p>
              <p className="mt-0.5 text-xs text-[#848e9c]">
                {listedVolume.toLocaleString()} CBT listed today
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-bold text-[#0ecb81]">
                {bestPrice > 0 ? formatPrice(bestPrice) : "--"}
              </p>
              <p className="mt-0.5 text-xs text-[#848e9c]">Best price</p>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#1e2329] text-center">
            <div className="px-2 py-3">
              <p className="text-[10px] text-[#848e9c]">Last</p>
              <p className="mt-1 font-mono text-xs font-bold text-white">
                {latestMarketTrade
                  ? formatPrice(Number(latestMarketTrade.pricePerToken))
                  : "--"}
              </p>
            </div>
            <div className="px-2 py-3">
              <p className="text-[10px] text-[#848e9c]">Range</p>
              <p className="mt-1 font-mono text-xs font-bold text-white">
                {bestPrice > 0
                  ? `${formatPrice(bestPrice)}-${formatPrice(highPrice)}`
                  : "--"}
              </p>
            </div>
            <div className="px-2 py-3">
              <p className="text-[10px] text-[#848e9c]">Volume</p>
              <p className="mt-1 font-mono text-xs font-bold text-white">
                {listedVolume > 0 ? listedVolume.toLocaleString() : "--"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#1e2329] bg-[#181a20]">
        <div className="flex items-center justify-between border-b border-[#1e2329] px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-white">Recent Activity</h2>
            <p className="mt-0.5 text-xs text-[#848e9c]">
              Purchases, trades and withdrawals
            </p>
          </div>
          <Link
            href="/wallet/history"
            className="text-xs font-bold text-[#f0b90b]"
          >
            History
          </Link>
        </div>
        {!latestPurchase && !latestUserTrade && !latestWithdrawal ? (
          <div className="px-4 py-8 text-center text-sm text-[#848e9c]">
            No activity yet.
          </div>
        ) : (
          <div className="divide-y divide-[#1e2329]">
            {latestPurchase ? (
              <Link
                href="/wallet/history"
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm transition hover:bg-[#1e2329]"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {latestPurchase.merchant.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#848e9c]">
                    Reward earned · {formatHomeDate(latestPurchase.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-[#0ecb81]">
                    +{formatTokenAmount(latestPurchaseTokens)} CBT
                  </p>
                  <p className="text-xs text-[#848e9c]">
                    {formatCurrency(Number(latestPurchase.totalAmount))}
                  </p>
                </div>
              </Link>
            ) : null}

            {latestUserTrade ? (
              <Link
                href="/trade"
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm transition hover:bg-[#1e2329]"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    Trade Cash Credit
                  </p>
                  <p className="mt-0.5 text-xs text-[#848e9c]">
                    Sold CBT · {formatHomeDate(latestUserTrade.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-[#0ecb81]">
                    {formatCurrency(Number(latestUserTrade.cashValue))}
                  </p>
                  <p className="text-xs text-[#f6465d]">
                    -{formatTokenAmount(Number(latestUserTrade.tokenAmount))} CBT
                  </p>
                </div>
              </Link>
            ) : null}

            {latestWithdrawal ? (
              <Link
                href="/profile/withdrawal"
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm transition hover:bg-[#1e2329]"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    Withdrawal Request
                  </p>
                  <p className="mt-0.5 text-xs text-[#848e9c]">
                    {formatHomeDate(latestWithdrawal.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-white">
                    {formatCurrency(Number(latestWithdrawal.amount))}
                  </p>
                  <p
                    className={`text-xs font-bold ${withdrawalStatusClass(
                      latestWithdrawal.status,
                    )}`}
                  >
                    {latestWithdrawal.status}
                  </p>
                </div>
              </Link>
            ) : null}
          </div>
        )}
      </section>

      <Link
        href="/discover"
        className="flex items-center justify-between gap-3 rounded-lg border border-[#1e2329] bg-[#181a20] px-4 py-4 transition hover:border-[#f0b90b]/60"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#2b3139] text-[#f0b90b]">
            <DiscoverIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">Discover</p>
            <p className="mt-0.5 text-xs text-[#848e9c]">
              Merchant offers will appear here.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-[#f0b90b]">Open</span>
      </Link>
    </div>
  );
}
