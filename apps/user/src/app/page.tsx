import Link from "next/link";
import type { SVGProps } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import {
  calculateDailyRelease,
  daysUntilFullRelease,
  getTokenSettingsSnapshot,
} from "@cashback/shared";
import { auth } from "@/lib/auth";

function IconBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

function ScanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M5 8V6a1 1 0 0 1 1-1h2" />
      <path d="M19 8V6a1 1 0 0 0-1-1h-2" />
      <path d="M5 16v2a1 1 0 0 0 1 1h2" />
      <path d="M19 16v2a1 1 0 0 1-1 1h-2" />
      <path d="M7 12h10" />
      <path d="M9 9.5h6" />
      <path d="M9 14.5h6" />
    </IconBase>
  );
}

function MarketplaceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 8.5h16" />
      <path d="m6 8.5 1.2-3h9.6l1.2 3" />
      <path d="M5.5 8.5v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9" />
      <path d="M9 12.5h6" />
    </IconBase>
  );
}

function ExchangeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M7 7.5h10" />
      <path d="m14 4.5 3 3-3 3" />
      <path d="M17 16.5H7" />
      <path d="m10 13.5-3 3 3 3" />
    </IconBase>
  );
}

function TokensIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M9.5 10.5c0-1.1 1-2 2.5-2s2.5.7 2.5 1.8c0 2.8-5 1.1-5 3.9 0 1.1 1.1 1.8 2.5 1.8 1.7 0 2.7-.9 2.7-2" />
    </IconBase>
  );
}

function formatCurrency(value: number) {
  return `RM${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function UserDashboard() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  const [entitlement, recentTransactions, marketplaceOrders, settings] =
    await Promise.all([
      prisma.userTokenEntitlement.findUnique({
        where: { userId },
      }),
      prisma.transaction.findMany({
        where: { userId },
        include: {
          merchant: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.marketplaceOrder.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
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
  const totalSpending = Number(entitlement?.totalSpending ?? 0);
  const entitled = Number(entitlement?.entitledTokens ?? 0);
  const released = Number(entitlement?.releasedTokens ?? 0);
  const available = Number(entitlement?.availableTokens ?? 0);
  const progress = entitled > 0 ? Math.min((released / entitled) * 100, 100) : 0;
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

  return (
    <div className="space-y-5 py-4">
      <div className="material-hero overflow-hidden p-6 text-white">
        <span className="inline-flex rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-50">
          Account Summary
        </span>
        <p className="mt-4 text-sm text-blue-100/85">Total Spending</p>
        <p className="mt-2 text-4xl font-bold tracking-tight">
          {formatCurrency(totalSpending)}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-100/75">
              Entitled
            </p>
            <p className="mt-1 text-lg font-bold">{entitled.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-100/75">
              Released
            </p>
            <p className="mt-1 text-lg font-bold">{released.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-100/75">
              Available
            </p>
            <p className="mt-1 text-lg font-bold text-amber-200">
              {available.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="material-card-flat p-5">
        <div className="flex items-start gap-4">
          <div className="icon-tile rounded-[20px] bg-blue-600/12 text-blue-700">
            <ScanIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <span className="material-chip">Confirm Purchases</span>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
              Scan the merchant QR after checkout
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              After you pay in-store, scan the merchant&apos;s QR code on your phone.
              We&apos;ll show the purchase details here so you can confirm the receipt and
              update your entitled tokens right away.
            </p>
            <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                1. Pay in store
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                2. Scan the signed QR
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                3. Confirm and earn tokens
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/transactions"
                className="material-button-primary px-4 py-2.5 text-sm font-semibold"
              >
                View Transactions
              </Link>
              <Link
                href="/marketplace"
                className="material-button-outlined px-4 py-2.5 text-sm font-semibold"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="material-card-flat p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="icon-tile rounded-[18px] bg-blue-600/10 text-blue-700">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-950">{action.label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="material-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Recent Activity</h2>
          <Link href="/transactions" className="text-xs font-semibold text-blue-700">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No confirmed purchases yet.
            </p>
          ) : (
            recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
              >
                <div>
                  <p className="font-semibold text-slate-900">{tx.merchant.name}</p>
                  <p className="text-xs text-slate-500">
                    {tx.createdAt.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
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
            ))
          )}
        </div>
      </div>

      <div className="material-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">Daily Token Release</h2>
          <span className="material-chip">{progress.toFixed(1)}%</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-blue-100/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>
            {released.toLocaleString()} / {entitled.toLocaleString()} released
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          +{tomorrowRelease.toLocaleString()} tokens releasing tomorrow at midnight
        </p>
        {marketplaceOrders.length > 0 ? (
          <p className="mt-1 text-sm text-slate-600">
            {marketplaceOrders.length} exchange trades completed
          </p>
        ) : null}
        <p className="mt-1 text-sm text-slate-600">
          Estimated full release in {remainingDays} days
        </p>
      </div>
    </div>
  );
}
