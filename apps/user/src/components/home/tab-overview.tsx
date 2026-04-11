import Link from "next/link";
import { prisma } from "@cashback/database";
import { formatCurrency } from "@cashback/shared";
import type { UserDashboardSummary } from "@/lib/dashboard-summary";
import {
  buildRewardJourney,
  formatTokenAmount,
  getNextRewardAction,
  type JourneyStepStatus,
} from "@/lib/reward-journey";
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

const journeyStatusClass: Record<JourneyStepStatus, string> = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
  current: "border-blue-200 bg-blue-50 text-blue-700 shadow-sm",
  upcoming: "border-slate-200 bg-white/80 text-slate-500",
};

const journeyStatusLabel: Record<JourneyStepStatus, string> = {
  complete: "Done",
  current: "Now",
  upcoming: "Next",
};

export async function TabOverview({
  summary,
  userId,
}: {
  summary: UserDashboardSummary;
  userId: string;
}) {
  const latestOrder = await prisma.marketplaceOrder.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const journeyInput = {
    totalSpending: summary.totalSpending,
    entitledTokens: summary.entitledTokens,
    releasedTokens: summary.releasedTokens,
    availableTokens: summary.availableTokens,
    availableToWithdraw: summary.cashSummary.availableToWithdraw,
    dailyRelease: summary.dailyRelease,
    tradeCount: summary.cashSummary.tradeCount,
    pendingWithdrawalCount: summary.cashSummary.pendingWithdrawalCount,
    completedWithdrawalCount: summary.cashSummary.completedWithdrawalCount,
  };
  const nextAction = getNextRewardAction(journeyInput);
  const journeySteps = buildRewardJourney(journeyInput);

  return (
    <div className="space-y-4">
      {/* Next Best Action */}
      <Link
        href={nextAction.href}
        className="material-card block overflow-hidden p-5 transition-transform hover:-translate-y-0.5"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="material-chip">Next Step</span>
          <span className="text-xs font-semibold text-blue-700">
            {nextAction.cta} &rarr;
          </span>
        </div>
        <h2 className="mt-4 text-lg font-bold tracking-tight text-slate-950">
          {nextAction.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {nextAction.description}
        </p>
      </Link>

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

      {/* Reward Journey */}
      <div className="material-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              Reward Journey
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Follow the path from purchase to withdrawable cash.
            </p>
          </div>
          <span className="material-chip material-chip-muted">
            {formatTokenAmount(summary.availableTokens)} ready
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {journeySteps.map((step, index) => (
            <Link
              key={step.label}
              href={step.href}
              className={`flex items-start gap-3 rounded-2xl border px-3 py-3 transition hover:-translate-y-0.5 ${
                journeyStatusClass[step.status]
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{step.label}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
                    {journeyStatusLabel[step.status]}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-5 opacity-80">
                  {step.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
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
            +{summary.dailyRelease.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {summary.daysRemaining > 0
              ? `${summary.daysRemaining} days left`
              : "Fully released"}
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
