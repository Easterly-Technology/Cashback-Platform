import { prisma } from "@cashback/database";
import { getTokenSettingsSnapshot } from "@cashback/shared";
import TokenSettingsForm from "./token-settings-form";

export const dynamic = "force-dynamic";

export default async function TokensPage() {
  const [latestPool, totalReleased, settings, poolHistory] = await Promise.all([
    prisma.dailyTokenPool.findFirst({ orderBy: { poolDate: "desc" } }),
    prisma.tokenReleaseLog.aggregate({ _sum: { amount: true } }),
    prisma.platformSetting.findMany({
      where: {
        key: {
          in: ["token_multiplier", "token_release_rate", "marketplace_enabled"],
        },
      },
    }),
    prisma.dailyTokenPool.findMany({
      orderBy: { poolDate: "desc" },
      take: 7,
    }),
  ]);

  const { multiplier, releaseRate, marketplaceEnabled } =
    getTokenSettingsSnapshot(settings);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Token Management</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Latest Pool Value</p>
          <p className="text-2xl font-bold mt-1">
            RM{Number(latestPool?.poolValue ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {latestPool?.poolDate
              ? new Date(latestPool.poolDate).toISOString().split("T")[0]
              : "No data"}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Total Tokens Released</p>
          <p className="text-2xl font-bold mt-1">
            {Number(totalReleased._sum.amount ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Exchange Status</p>
          <p className="text-2xl font-bold mt-1">
            {Boolean(marketplaceEnabled) ? "Active" : "Disabled"}
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-3xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Token Pool History</h2>
        {poolHistory.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded border bg-gray-50 text-gray-400">
            No pool history yet
          </div>
        ) : (
          <div className="space-y-3">
            {poolHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {new Date(entry.poolDate).toISOString().split("T")[0]}
                  </p>
                  <p className="text-slate-500">
                    Spending: RM{Number(entry.totalSpending).toLocaleString()}
                  </p>
                </div>
                <p className="text-base font-semibold text-slate-900">
                  RM{Number(entry.poolValue).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <TokenSettingsForm
        initialMultiplier={multiplier}
        initialReleaseRate={releaseRate * 100}
        initialMarketplaceEnabled={marketplaceEnabled}
      />
    </div>
  );
}
