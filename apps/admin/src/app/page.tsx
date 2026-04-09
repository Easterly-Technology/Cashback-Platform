import Link from "next/link";
import type { SVGProps } from "react";
import { prisma } from "@cashback/database";
import { formatCurrency, getTokenSettingsSnapshot } from "@cashback/shared";

export const dynamic = "force-dynamic";

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

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.8-7 9-4.1-1.2-7-4.7-7-9V6l7-2.5Z" />
      <path d="m9.5 12 1.6 1.6 3.4-3.6" />
    </IconBase>
  );
}

function TeamIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="9" r="2.5" />
      <circle cx="16.5" cy="8" r="2" />
      <path d="M4.5 18c1-2.3 2.8-3.5 4.5-3.5s3.5 1.2 4.5 3.5" />
      <path d="M14.5 16c.6-1.4 1.8-2.2 3.1-2.2 1.2 0 2.3.7 2.9 2" />
    </IconBase>
  );
}

function SlidersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M6 5.5v13" />
      <path d="M18 5.5v13" />
      <path d="M12 5.5v13" />
      <path d="M4.5 9h3" />
      <path d="M10.5 14h3" />
      <path d="M16.5 10h3" />
    </IconBase>
  );
}

function WalletIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10.5v14H7A2.5 2.5 0 0 1 4.5 16.5v-9Z" />
      <path d="M17.5 9h2v6h-2" />
      <circle cx="15.5" cy="12" r=".75" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export default async function AdminDashboard() {
  const today = new Date(new Date().toISOString().split("T")[0]);
  const [
    userCount,
    merchantCount,
    pendingMerchantCount,
    pendingWithdrawalCount,
    flaggedTransactionCount,
    todayTxns,
    todayPool,
    recentTxns,
    settings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.merchant.count(),
    prisma.merchant.count({
      where: { status: "PENDING" },
    }),
    prisma.withdrawalRequest.count({
      where: { status: "PENDING" },
    }),
    prisma.transaction.count({
      where: {
        status: {
          in: ["PENDING", "DISPUTED"],
        },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: {
        createdAt: {
          gte: today,
        },
      },
    }),
    prisma.dailyTokenPool.findUnique({
      where: { poolDate: today },
    }),
    prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true } },
        merchant: { select: { name: true } },
      },
    }),
    prisma.platformSetting.findMany({
      where: {
        key: {
          in: ["marketplace_enabled"],
        },
      },
    }),
  ]);

  const { marketplaceEnabled } = getTokenSettingsSnapshot(settings);
  const stats = [
    { label: "Today's Sales", value: formatCurrency(Number(todayTxns._sum.totalAmount ?? 0)), sub: `${todayTxns._count} orders` },
    { label: "Pending Withdrawals", value: pendingWithdrawalCount.toLocaleString(), sub: "Requests awaiting review" },
    { label: "Total Merchants", value: merchantCount.toLocaleString(), sub: `${pendingMerchantCount} awaiting approval` },
    { label: "Today's Token Pool", value: formatCurrency(Number(todayPool?.poolValue ?? 0)), sub: todayPool ? "Generated for today" : "Missing today" },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "status-badge status-badge-success";
      case "PENDING":
        return "status-badge status-badge-warning";
      case "DISPUTED":
        return "status-badge status-badge-danger";
      default:
        return "status-badge status-badge-neutral";
    }
  };

  const quickActions = [
    {
      href: "/withdrawals",
      label: "Withdrawals",
      description: "Review payout requests, approve them, and mark completed transfers.",
      icon: WalletIcon,
    },
    {
      href: "/merchants",
      label: "Merchants",
      description: "Approve new partners and resolve merchant account issues.",
      icon: TeamIcon,
    },
    {
      href: "/marketplace",
      label: "Exchange",
      description: "Monitor token liquidity, daily pool generation, and trade flow.",
      icon: SlidersIcon,
    },
  ];

  const attentionItems = [
    {
      href: "/withdrawals",
      label: "Pending withdrawals",
      value: pendingWithdrawalCount,
      description: "Cash-out requests waiting for finance review.",
      tone:
        pendingWithdrawalCount > 0
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-slate-200 bg-white text-slate-900",
    },
    {
      href: "/merchants",
      label: "Pending merchant approvals",
      value: pendingMerchantCount,
      description: "New merchants that still need activation.",
      tone:
        pendingMerchantCount > 0
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-slate-200 bg-white text-slate-900",
    },
    {
      href: "/transactions",
      label: "Pending or disputed transactions",
      value: flaggedTransactionCount,
      description: "Receipts or transaction states that may need intervention.",
      tone:
        flaggedTransactionCount > 0
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : "border-slate-200 bg-white text-slate-900",
    },
    {
      href: "/marketplace",
      label: !marketplaceEnabled ? "Exchange paused" : todayPool ? "Exchange healthy" : "Token pool missing",
      value: !marketplaceEnabled ? "Paused" : todayPool ? "Ready" : "Missing",
      description: !marketplaceEnabled
        ? "Trading is disabled and users cannot exchange released tokens."
        : todayPool
          ? "Today's pool is in place and the exchange is live."
          : "Today's token pool has not been generated yet.",
      tone: !marketplaceEnabled || !todayPool
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <span className="material-chip">Operations Overview</span>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="material-title text-slate-950">Platform Dashboard</h1>
            <p className="material-subtitle mt-3 max-w-2xl">
              Monitor the operating queue first, then use the KPI layer and recent activity to understand today&apos;s platform movement.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-sm text-indigo-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700">
              Active Users
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {userCount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="material-card-flat p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="icon-tile rounded-[18px] bg-indigo-600/10 text-indigo-700">
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

      <div className="material-card-flat p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Attention Needed</h2>
            <p className="mt-1 text-sm text-slate-500">
              Surface queues and platform states that can block payouts, growth, or trading.
            </p>
          </div>
          <ShieldIcon className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="grid gap-3 xl:grid-cols-4">
          {attentionItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 ${item.tone}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-bold">
                {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
              </p>
              <p className="mt-2 text-sm leading-6 opacity-80">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="material-stat p-5">
            <p className="text-sm font-medium text-slate-500">{s.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {s.value}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="material-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Recent Transactions</h2>
          <span className="material-chip material-chip-muted">
            {recentTxns.length.toLocaleString()} items
          </span>
        </div>
        {recentTxns.length === 0 ? (
          <div className="material-empty px-6 py-10 text-center">
            <p className="text-base font-medium text-slate-700">
              No transactions have been confirmed yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Once merchants complete sales and users confirm receipts, activity will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {recentTxns.map((tx) => (
                <div key={tx.id} className="material-card-flat p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{tx.user.email}</p>
                      <p className="text-sm text-slate-500">{tx.merchant.name}</p>
                    </div>
                    <span className={statusColor(tx.status)}>{tx.status}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">
                      {formatCurrency(Number(tx.totalAmount))}
                    </span>
                    <span className="text-slate-400">
                      {tx.createdAt.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="material-table-shell hidden lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="p-4">User</th>
                      <th className="p-4">Merchant</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTxns.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-100">
                        <td className="p-4">{tx.user.email}</td>
                        <td className="p-4">{tx.merchant.name}</td>
                        <td className="p-4 font-medium">
                          {formatCurrency(Number(tx.totalAmount))}
                        </td>
                        <td className="p-4">
                          <span className={statusColor(tx.status)}>{tx.status}</span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {tx.createdAt.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
