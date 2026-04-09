import Link from "next/link";
import { prisma } from "@cashback/database";
import {
  calculateDailyRelease,
  daysUntilFullRelease,
  getTokenSettingsSnapshot,
} from "@cashback/shared";

export async function TabRewards({ userId }: { userId: string }) {
  const [entitlement, settings, releases, orderStats] = await Promise.all([
    prisma.userTokenEntitlement.findUnique({ where: { userId } }),
    prisma.platformSetting.findMany({
      where: {
        key: { in: ["token_multiplier", "token_release_rate"] },
      },
    }),
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
  const releasedPct =
    entitled > 0 ? Math.min((released / entitled) * 100, 100) : 0;
  const usedInMarketplace = Number(orderStats._sum.tokenAmount ?? 0);

  return (
    <div className="space-y-4">
      {/* Token Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="material-stat p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Entitled
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {entitled.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            = RM{Number(entitlement?.totalSpending ?? 0).toLocaleString()} &times;{" "}
            {tokenSettings.multiplier}
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Available
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {available.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">Ready to use</p>
        </div>
      </div>

      {/* Release Progress */}
      <div className="material-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-950">
            Release Progress
          </h2>
          <span className="material-chip">{releasedPct.toFixed(1)}%</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-blue-100/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500"
            style={{ width: `${releasedPct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>{released.toLocaleString()} released</span>
          <span>{entitled.toLocaleString()} total</span>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Daily release: {dailyRelease.toLocaleString()} tokens (
          {(tokenSettings.releaseRate * 100).toLocaleString()}% of entitled)
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Estimated full release: ~{daysRemaining} days remaining
        </p>
      </div>

      {/* Release History */}
      <div className="material-card overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2 className="text-sm font-semibold text-slate-950">
            Release History
          </h2>
          <Link
            href="/tokens/history"
            className="text-xs font-semibold text-blue-700"
          >
            View All
          </Link>
        </div>
        {releases.length === 0 ? (
          <div className="px-5 pb-5 text-sm text-slate-400">
            No token releases yet
          </div>
        ) : (
          <div className="divide-y divide-slate-100/70">
            {releases.map((release) => (
              <div
                key={release.id}
                className="grid grid-cols-3 px-5 py-3 text-sm"
              >
                <span className="text-slate-500">
                  {release.releaseDate.toISOString().split("T")[0]}
                </span>
                <span className="text-center font-semibold text-emerald-600">
                  +{Number(release.amount).toLocaleString()}
                </span>
                <span className="text-right text-slate-400">
                  {Number(release.cumulative).toLocaleString()} total
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Token Usage */}
      <div className="material-card p-5">
        <h2 className="text-sm font-semibold text-slate-950">Token Usage</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Total released</span>
            <span className="font-semibold text-slate-900">
              {released.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Traded for cash</span>
            <span className="font-semibold text-rose-500">
              -{usedInMarketplace.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Token trades</span>
            <span className="font-semibold text-slate-900">
              {orderStats._count}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold">
            <span className="text-slate-900">Available balance</span>
            <span className="text-blue-700">{available.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
