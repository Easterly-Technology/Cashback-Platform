import Link from "next/link";
import { prisma } from "@cashback/database";
import {
  calculateDailyRelease,
  daysUntilFullRelease,
  formatCurrency,
  getTokenSettingsSnapshot,
} from "@cashback/shared";
import {
  ScanIcon,
  MarketplaceIcon,
  ExchangeIcon,
  TokensIcon,
} from "@/components/icons";

const quickActions = [
  {
    href: "/marketplace",
    label: "Marketplace",
    description: "Browse partner products before you shop",
    icon: MarketplaceIcon,
  },
  {
    href: "/exchange",
    label: "Exchange",
    description: "Convert released tokens into cash value",
    icon: ExchangeIcon,
  },
  {
    href: "/tokens",
    label: "Tokens",
    description: "Track release progress and balance details",
    icon: TokensIcon,
  },
];

export async function TabOverview({ userId }: { userId: string }) {
  const [entitlement, latestOrder, settings] = await Promise.all([
    prisma.userTokenEntitlement.findUnique({ where: { userId } }),
    prisma.marketplaceOrder.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.platformSetting.findMany({
      where: { key: { in: ["token_release_rate"] } },
    }),
  ]);

  const tokenSettings = getTokenSettingsSnapshot(settings);
  const entitled = Number(entitlement?.entitledTokens ?? 0);
  const released = Number(entitlement?.releasedTokens ?? 0);
  const tomorrowRelease = calculateDailyRelease(
    entitled,
    released,
    tokenSettings.releaseRate,
  ).toNumber();
  const remainingDays = daysUntilFullRelease(
    entitled,
    released,
    tokenSettings.releaseRate,
  );

  return (
    <div className="space-y-4">
      {/* QR Scan CTA */}
      <div className="material-card-flat flex items-center gap-4 px-5 py-4">
        <div className="icon-tile rounded-[20px] bg-blue-600/12 text-blue-700">
          <ScanIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950">
            Scan QR after checkout to earn tokens
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Pay in store &rarr; Scan merchant QR &rarr; Confirm &amp; earn
          </p>
        </div>
        <Link
          href="/transactions"
          className="material-button-outlined shrink-0 px-3 py-2 text-xs font-semibold"
        >
          Transactions
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="material-card-flat p-4 transition-transform hover:-translate-y-0.5"
            >
              <div className="icon-tile rounded-[18px] bg-blue-600/10 text-blue-700">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-950">
                {action.label}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* At-a-Glance Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="material-stat p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Next Release
          </p>
          <p className="mt-2 text-xl font-bold text-blue-700">
            +{tomorrowRelease.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {remainingDays > 0 ? `${remainingDays} days left` : "Fully released"}
          </p>
        </div>
        <div className="material-stat p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Recent Trade
          </p>
          {latestOrder ? (
            <>
              <p className="mt-2 text-xl font-bold text-emerald-600">
                {formatCurrency(Number(latestOrder.cashValue))}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {Number(latestOrder.tokenAmount).toLocaleString()} tokens sold
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm font-medium text-slate-400">
                No trades yet
              </p>
              <Link
                href="/exchange"
                className="mt-1 text-xs font-semibold text-blue-600"
              >
                Start trading &rarr;
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tip Card */}
      <div className="material-alert material-alert-info px-4 py-3">
        <p className="text-xs font-semibold">How token release works</p>
        <p className="mt-1 text-xs leading-5 opacity-80">
          Tokens release daily at midnight based on your entitled balance.
          Once released, exchange them for cash on the marketplace.
        </p>
      </div>
    </div>
  );
}
