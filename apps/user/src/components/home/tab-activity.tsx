import Link from "next/link";
import { prisma } from "@cashback/database";
import { formatCurrency, getTokenSettingsSnapshot } from "@cashback/shared";

export async function TabActivity({ userId }: { userId: string }) {
  const [transactions, tokenReleases, marketplaceOrders, settings] =
    await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        include: { merchant: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.tokenReleaseLog.findMany({
        where: { userId },
        orderBy: { releaseDate: "desc" },
        take: 20,
      }),
      prisma.marketplaceOrder.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.platformSetting.findMany({
        where: { key: { in: ["token_multiplier"] } },
      }),
    ]);

  const tokenSettings = getTokenSettingsSnapshot(settings);

  // Merge all activities into a unified timeline
  type ActivityItem =
    | { type: "purchase"; date: Date; data: (typeof transactions)[0] }
    | { type: "release"; date: Date; data: (typeof tokenReleases)[0] }
    | { type: "trade"; date: Date; data: (typeof marketplaceOrders)[0] };

  const allItems: ActivityItem[] = [
    ...transactions.map(
      (tx) =>
        ({ type: "purchase", date: tx.createdAt, data: tx }) as ActivityItem,
    ),
    ...tokenReleases.map(
      (r) =>
        ({ type: "release", date: r.releaseDate, data: r }) as ActivityItem,
    ),
    ...marketplaceOrders.map(
      (o) => ({ type: "trade", date: o.createdAt, data: o }) as ActivityItem,
    ),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 25);

  const isEmpty = allItems.length === 0;

  return (
    <div className="space-y-3">
      {/* Filter hint */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400">
          Showing recent activity across all types
        </p>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-blue-700"
        >
          Full History
        </Link>
      </div>

      {isEmpty ? (
        <div className="material-empty px-5 py-10 text-center">
          <p className="text-sm font-medium text-slate-500">
            No activity yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Scan a merchant QR code after your next purchase to get started.
          </p>
        </div>
      ) : (
        <div className="material-card overflow-hidden">
          <div className="divide-y divide-slate-100/70">
            {allItems.map((item, idx) => {
              if (item.type === "purchase") {
                const tx = item.data;
                return (
                  <div
                    key={`p-${tx.id}`}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {tx.merchant.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {tx.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(Number(tx.totalAmount))}
                      </p>
                      <p className="text-xs font-medium text-emerald-600">
                        +
                        {(
                          Number(tx.totalAmount) * tokenSettings.multiplier
                        ).toLocaleString()}{" "}
                        tokens
                      </p>
                    </div>
                  </div>
                );
              }

              if (item.type === "release") {
                const r = item.data;
                return (
                  <div
                    key={`r-${r.id}`}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        Token Release
                      </p>
                      <p className="text-xs text-slate-400">
                        {r.releaseDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        +{Number(r.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400">
                        {Number(r.cumulative).toLocaleString()} total
                      </p>
                    </div>
                  </div>
                );
              }

              // trade
              const o = item.data;
              return (
                <div
                  key={`t-${o.id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-900">Token Trade</p>
                    <p className="text-xs text-slate-400">
                      {o.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-rose-500">
                      -{Number(o.tokenAmount).toLocaleString()} tokens
                    </p>
                    <p className="text-xs font-medium text-emerald-600">
                      {formatCurrency(Number(o.cashValue))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
