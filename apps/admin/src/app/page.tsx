import Link from "next/link";
import type { SVGProps } from "react";
import { prisma } from "@cashback/database";
import { formatCurrency, getTokenSettingsSnapshot } from "@cashback/shared";
import { JobRunControls } from "@/components/job-run-controls";
import { getAdminSessionUser, isSuperAdmin } from "@/lib/admin-session";
import { formatRelativeAge, getDateOnly } from "@/lib/date";
import { getTrackedJobHealth } from "@/lib/job-runs";
import { alertTone, getOpsAlerts } from "@/lib/ops";

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

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4-4" />
    </IconBase>
  );
}

function FileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </IconBase>
  );
}

function jobTone(status?: string | null) {
  switch (status) {
    case "SUCCESS":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "RUNNING":
      return "border-indigo-200 bg-indigo-50 text-indigo-900";
    default:
      return "border-slate-200 bg-white text-slate-900";
  }
}

function summarizeJob(summary: unknown) {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return "No summary available";
  }

  const record = summary as Record<string, unknown>;

  if (typeof record.poolValue === "number") {
    return `Pool ${formatCurrency(record.poolValue)}`;
  }

  if (typeof record.totalReleased === "number") {
    return `${record.totalReleased.toLocaleString()} tokens released`;
  }

  if (typeof record.listingCount === "number") {
    return `${record.listingCount.toLocaleString()} listings generated`;
  }

  return "Completed";
}

function statusColor(status: string) {
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
}

function buildSparkline(values: number[]) {
  if (values.length === 0) return "";

  const max = Math.max(...values, 1);
  const step = values.length === 1 ? 100 : 100 / (values.length - 1);

  return values
    .map((value, index) => {
      const x = index * step;
      const y = 40 - (value / max) * 32;
      return `${x},${y}`;
    })
    .join(" ");
}

export default async function AdminDashboard() {
  const today = getDateOnly(new Date());
  const trendDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date;
  });

  const [
    currentAdmin,
    userCount,
    merchantCount,
    pendingMerchantCount,
    pendingWithdrawalCount,
    flaggedTransactionCount,
    openSettlementCount,
    todayTxns,
    todayPool,
    recentTxns,
    settings,
    alerts,
    jobHealth,
    salesTrend,
    withdrawalTrend,
  ] = await Promise.all([
    getAdminSessionUser(),
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
    prisma.merchantSettlement.count({
      where: {
        status: { in: ["PENDING", "INVOICED"] },
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
    getOpsAlerts(),
    getTrackedJobHealth(),
    Promise.all(
      trendDays.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const aggregate = await prisma.transaction.aggregate({
          where: {
            status: "CONFIRMED",
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
          _sum: {
            totalAmount: true,
          },
        });

        return {
          date: date.toISOString().split("T")[0],
          value: Number(aggregate._sum.totalAmount ?? 0),
        };
      }),
    ),
    Promise.all(
      trendDays.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const aggregate = await prisma.withdrawalRequest.aggregate({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
          _sum: {
            amount: true,
          },
          _count: true,
        });

        return {
          date: date.toISOString().split("T")[0],
          value: Number(aggregate._sum.amount ?? 0),
          count: aggregate._count,
        };
      }),
    ),
  ]);

  const { marketplaceEnabled } = getTokenSettingsSnapshot(settings);
  const canTriggerJobs = isSuperAdmin(currentAdmin?.role);
  const stats = [
    {
      label: "Today's Sales",
      value: formatCurrency(Number(todayTxns._sum.totalAmount ?? 0)),
      sub: `${todayTxns._count} orders`,
    },
    {
      label: "Pending Withdrawals",
      value: pendingWithdrawalCount.toLocaleString(),
      sub: "Requests awaiting review",
    },
    {
      label: "Open Settlements",
      value: openSettlementCount.toLocaleString(),
      sub: "Pending or invoiced periods",
    },
    {
      label: "Total Merchants",
      value: merchantCount.toLocaleString(),
      sub: `${pendingMerchantCount} awaiting approval`,
    },
    {
      label: "Today's Token Pool",
      value: formatCurrency(Number(todayPool?.poolValue ?? 0)),
      sub: todayPool ? "Generated for today" : "Missing today",
    },
  ];

  const quickActions = [
    {
      href: "/withdrawals",
      label: "Withdrawals",
      description: "Review payout requests and push them through approval and completion.",
      icon: WalletIcon,
    },
    {
      href: "/settlements",
      label: "Settlements",
      description: "Track open merchant balances and finance reconciliation periods.",
      icon: FileIcon,
    },
    {
      href: "/ops",
      label: "Operations Inbox",
      description: "Work through disputed orders, stale requests, and automation exceptions.",
      icon: ShieldIcon,
    },
    {
      href: "/merchants",
      label: "Merchants",
      description: "Approve new partners and review merchant account status changes.",
      icon: TeamIcon,
    },
    {
      href: "/marketplace",
      label: "Exchange",
      description: "Monitor token liquidity, daily pool generation, and listing availability.",
      icon: SlidersIcon,
    },
    {
      href: "/announcements",
      label: "Announcements",
      description: "Publish updates that appear directly in the user news feed.",
      icon: SearchIcon,
    },
  ];

  const attentionItems = alerts.slice(0, 6);
  const salesSparkline = buildSparkline(salesTrend.map((entry) => entry.value));
  const withdrawalSparkline = buildSparkline(
    withdrawalTrend.map((entry) => entry.value),
  );

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <span className="material-chip">Operations Overview</span>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="material-title text-slate-950">Platform Dashboard</h1>
            <p className="material-subtitle mt-3 max-w-2xl">
              Start with the operations inbox, then move into finance, automation health, and the latest customer activity.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-sm text-indigo-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700">
              Active Users
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {userCount.toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-indigo-700">
              {flaggedTransactionCount.toLocaleString()} transactions currently need attention
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Attention Needed</h2>
            <p className="mt-1 text-sm text-slate-500">
              The inbox is driven by real record-level alerts with severity and age.
            </p>
          </div>
          <Link
            href="/ops"
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
          >
            Open inbox
          </Link>
        </div>

        {attentionItems.length === 0 ? (
          <div className="material-empty px-6 py-10 text-center">
            <p className="text-base font-medium text-slate-700">
              No operational alerts right now.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              The queue, settlements, and automation all look healthy.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-3">
            {attentionItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 ${alertTone(item.severity)}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                    {item.source}
                  </p>
                  <p className="text-xs opacity-80">{item.age}</p>
                </div>
                <p className="mt-3 text-base font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 opacity-80">{item.reason}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="material-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">7-Day Sales Trend</h2>
              <p className="mt-1 text-sm text-slate-500">
                Confirmed GMV across the last seven daily closes.
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {formatCurrency(
                salesTrend.reduce((sum, entry) => sum + entry.value, 0),
              )}
            </p>
          </div>
          <svg
            viewBox="0 0 100 42"
            className="mt-4 h-24 w-full rounded-2xl bg-slate-50 p-3"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-indigo-600"
              points={salesSparkline}
            />
          </svg>
          <div className="mt-4 grid gap-3 sm:grid-cols-7">
            {salesTrend.map((entry) => (
              <div key={entry.date} className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {entry.date.slice(5)}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatCurrency(entry.value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="material-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">7-Day Withdrawal Trend</h2>
              <p className="mt-1 text-sm text-slate-500">
                Cash-out demand by request volume and value.
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {withdrawalTrend
                .reduce((sum, entry) => sum + entry.count, 0)
                .toLocaleString()}{" "}
              requests
            </p>
          </div>
          <svg
            viewBox="0 0 100 42"
            className="mt-4 h-24 w-full rounded-2xl bg-slate-50 p-3"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-emerald-600"
              points={withdrawalSparkline}
            />
          </svg>
          <div className="mt-4 grid gap-3 sm:grid-cols-7">
            {withdrawalTrend.map((entry) => (
              <div key={entry.date} className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {entry.date.slice(5)}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {entry.count.toLocaleString()} req
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatCurrency(entry.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="material-card p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Automation Health</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cron-dependent exchange jobs now keep run history so failures are visible from the dashboard.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Exchange is {marketplaceEnabled ? "enabled" : "paused"}
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {jobHealth.map((job) => (
            <div
              key={job.jobName}
              className={`rounded-2xl border px-4 py-4 ${jobTone(job.latest?.status)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{job.jobName}</p>
                  <span className="mt-2 inline-flex rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold">
                    {job.latest?.status ?? "NO RUNS"}
                  </span>
                </div>
                {canTriggerJobs ? <JobRunControls jobName={job.jobName} /> : null}
              </div>
              <p className="mt-3 text-sm">
                {job.latest
                  ? summarizeJob(job.latest.summary)
                  : "This job has not been executed yet."}
              </p>
              <div className="mt-3 space-y-1 text-xs opacity-80">
                <p>
                  Latest:{" "}
                  {job.latest
                    ? `${job.latest.startedAt.toLocaleString()} (${formatRelativeAge(job.latest.startedAt)})`
                    : "Never"}
                </p>
                <p>
                  Last success:{" "}
                  {job.latestSuccess
                    ? job.latestSuccess.startedAt.toLocaleString()
                    : "None yet"}
                </p>
                <p>
                  Last failure:{" "}
                  {job.latestFailure
                    ? job.latestFailure.startedAt.toLocaleString()
                    : "No failures"}
                </p>
                {job.latest?.error ? <p>Error: {job.latest.error}</p> : null}
              </div>
            </div>
          ))}
        </div>
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
