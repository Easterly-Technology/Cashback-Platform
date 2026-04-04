import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import {
  calculateDailyRelease,
  daysUntilFullRelease,
  getTokenSettingsSnapshot,
} from "@cashback/shared";
import { auth } from "@/lib/auth";

export default async function TokensPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  const [entitlement, releases, orders, settings] = await Promise.all([
    prisma.userTokenEntitlement.findUnique({ where: { userId } }),
    prisma.tokenReleaseLog.findMany({
      where: { userId },
      orderBy: { releaseDate: "desc" },
      take: 8,
    }),
    prisma.marketplaceOrder.aggregate({
      where: { userId },
      _sum: { tokenAmount: true, cashValue: true },
      _count: true,
    }),
    prisma.platformSetting.findMany({
      where: {
        key: {
          in: ["token_multiplier", "token_release_rate", "marketplace_enabled"],
        },
      },
    }),
  ]);

  const tokenSettings = getTokenSettingsSnapshot(settings);
  const entitled = Number(entitlement?.entitledTokens ?? 0);
  const released = Number(entitlement?.releasedTokens ?? 0);
  const available = Number(entitlement?.availableTokens ?? 0);
  const dailyRelease = calculateDailyRelease(
    entitled,
    released,
    tokenSettings.releaseRate,
  ).toNumber();
  const daysRemaining = daysUntilFullRelease(
    entitled,
    released,
    tokenSettings.releaseRate,
  );
  const usedInMarketplace = Number(orders._sum.tokenAmount ?? 0);
  const releasedPct = entitled > 0 ? Math.min((released / entitled) * 100, 100) : 0;

  return (
    <div className="py-4">
      <h1 className="text-xl font-bold mb-4">My Tokens</h1>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-400">Entitled</p>
          <p className="text-xl font-bold">{entitled.toLocaleString()}</p>
          <p className="text-xs text-gray-400">
            = RM{Number(entitlement?.totalSpending ?? 0).toLocaleString()} ×{" "}
            {tokenSettings.multiplier}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-400">Available</p>
          <p className="text-xl font-bold text-blue-600">
            {available.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">Ready to use</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-4">
        <h2 className="font-semibold mb-2">Release Progress</h2>
        <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full"
            style={{ width: `${releasedPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{released.toLocaleString()} released</span>
          <span>{entitled.toLocaleString()} total</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Daily release: {dailyRelease.toLocaleString()} tokens (
          {(tokenSettings.releaseRate * 100).toLocaleString()}% of entitled)
        </p>
        <p className="text-xs text-gray-400">
          Estimated full release: ~{daysRemaining} days remaining
        </p>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Release History</h2>
          <Link href="/tokens/history" className="text-blue-600 text-xs">
            View All
          </Link>
        </div>
        <div className="space-y-2">
          {releases.length === 0 ? (
            <p className="text-sm text-gray-400">No token releases yet</p>
          ) : (
            releases.map((release) => (
              <div
                key={release.id}
                className="flex justify-between text-sm py-1 border-b last:border-0"
              >
                <span className="text-gray-500">
                  {release.releaseDate.toISOString().split("T")[0]}
                </span>
                <span className="text-green-600">
                  +{Number(release.amount).toLocaleString()}
                </span>
                <span className="text-gray-400">
                  {Number(release.cumulative).toLocaleString()} total
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold mb-3">Token Usage</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total released</span>
            <span>{released.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Traded for cash</span>
            <span className="text-red-500">
              -{usedInMarketplace.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Token trades</span>
            <span>{orders._count}</span>
          </div>
          <div className="flex justify-between font-medium border-t pt-2">
            <span>Available balance</span>
            <span className="text-blue-600">{available.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
