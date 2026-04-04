import Link from "next/link";
import type { SVGProps } from "react";
import { prisma } from "@cashback/database";

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

export default async function AdminDashboard() {
  const [userCount, merchantCount, todayTxns, latestPool, recentTxns] =
    await Promise.all([
      prisma.user.count(),
      prisma.merchant.count(),
      prisma.transaction.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: {
          createdAt: {
            gte: new Date(new Date().toISOString().split("T")[0]),
          },
        },
      }),
      prisma.dailyTokenPool.findFirst({ orderBy: { poolDate: "desc" } }),
      prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true } },
          merchant: { select: { name: true } },
        },
      }),
    ]);

  const stats = [
    { label: "Total Users", value: userCount.toLocaleString(), sub: "" },
    {
      label: "Total Merchants",
      value: merchantCount.toLocaleString(),
      sub: "",
    },
    {
      label: "Today's Transactions",
      value: `RM${Number(todayTxns._sum.totalAmount ?? 0).toLocaleString()}`,
      sub: `${todayTxns._count} orders`,
    },
    {
      label: "Token Pool",
      value: `RM${Number(latestPool?.poolValue ?? 0).toLocaleString()}`,
      sub: latestPool?.poolDate
        ? new Date(latestPool.poolDate).toISOString().split("T")[0]
        : "No data",
    },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "status-badge status-badge-success";
      case "PENDING":
        return "status-badge status-badge-warning";
      case "DISPUTED":
        return "status-badge status-badge-warning";
      default:
        return "status-badge status-badge-danger";
      }
  };
  const quickActions = [
    {
      href: "/merchants",
      label: "Merchants",
      description: "Review partner accounts, approvals, and status changes.",
      icon: TeamIcon,
    },
    {
      href: "/transactions",
      label: "Transactions",
      description: "Inspect recent purchase flow issues and status changes.",
      icon: ShieldIcon,
    },
    {
      href: "/tokens",
      label: "Tokens",
      description: "Adjust release settings and exchange availability.",
      icon: SlidersIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <span className="material-chip">Operations Overview</span>
        <h1 className="material-title mt-4 text-slate-950">
          Platform Dashboard
        </h1>
        <p className="material-subtitle mt-3">
          Live totals, recent activity, and shortcuts for day-to-day operations.
        </p>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="material-stat p-5"
          >
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
                <div
                  key={tx.id}
                  className="material-card-flat p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{tx.user.email}</p>
                      <p className="text-sm text-slate-500">{tx.merchant.name}</p>
                    </div>
                    <span className={statusColor(tx.status)}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">
                      RM{Number(tx.totalAmount).toLocaleString()}
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
                          RM{Number(tx.totalAmount).toLocaleString()}
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { href: "/merchants", label: "Manage Merchants" },
          { href: "/users", label: "Manage Users" },
          { href: "/tokens", label: "Token Settings" },
          { href: "/marketplace", label: "Exchange" },
          { href: "/transactions", label: "All Transactions" },
          { href: "/audit-log", label: "Audit Log" },
          { href: "/settings", label: "Platform Settings" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="material-card-flat p-5 text-center font-semibold text-slate-700 transition-transform hover:-translate-y-0.5"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
