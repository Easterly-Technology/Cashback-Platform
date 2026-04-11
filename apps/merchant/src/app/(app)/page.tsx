import Link from "next/link";
import type { SVGProps } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import { formatCurrency } from "@cashback/shared";
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

function QrIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M5 5h5v5H5z" />
      <path d="M14 5h5v5h-5z" />
      <path d="M5 14h5v5H5z" />
      <path d="M14 14h2" />
      <path d="M18 14h1" />
      <path d="M14 18h5" />
      <path d="M16 16v1" />
    </IconBase>
  );
}

function BoxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="m12 3.5 7 4v9l-7 4-7-4v-9l7-4Z" />
      <path d="m5 7.5 7 4 7-4" />
      <path d="M12 11.5v9" />
    </IconBase>
  );
}

function ReceiptIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </IconBase>
  );
}

function statusClass(status: string) {
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

export default async function MerchantDashboard() {
  const session = await auth();
  const merchantId = (session?.user as { id?: string } | undefined)?.id;

  if (!merchantId) {
    redirect("/login?callbackUrl=%2F");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const now = new Date();

  const [
    merchant,
    activeProducts,
    lowStockCount,
    outOfStockCount,
    todayTransactions,
    todayConfirmedCount,
    openQrCount,
    recentTxns,
  ] = await Promise.all([
    prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { name: true },
    }),
    prisma.product.count({
      where: { merchantId, status: "ACTIVE" },
    }),
    prisma.inventory.count({
      where: {
        product: { merchantId },
        quantity: { lte: 10 },
      },
    }),
    prisma.inventory.count({
      where: {
        product: { merchantId },
        quantity: 0,
      },
    }),
    prisma.transaction.aggregate({
      where: {
        merchantId,
        createdAt: { gte: todayStart },
      },
      _sum: {
        totalAmount: true,
        rebateAmount: true,
        serviceFee: true,
      },
      _count: true,
    }),
    prisma.transaction.count({
      where: {
        merchantId,
        status: "CONFIRMED",
        createdAt: { gte: todayStart },
      },
    }),
    prisma.transactionQrCode.count({
      where: {
        merchantId,
        status: "PENDING",
        expiresAt: { gte: now },
      },
    }),
    prisma.transaction.findMany({
      where: { merchantId },
      include: {
        user: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const grossSales = Number(todayTransactions._sum.totalAmount ?? 0);
  const totalFees =
    Number(todayTransactions._sum.rebateAmount ?? 0) +
    Number(todayTransactions._sum.serviceFee ?? 0);
  const avgOrderValue =
    todayTransactions._count > 0 ? grossSales / todayTransactions._count : 0;

  const quickActions = [
    {
      href: "/qr-codes",
      label: "Create Payment QR",
      description: "Enter a final amount and generate a live payment QR in a few taps.",
      icon: QrIcon,
      tone: "hero",
    },
    {
      href: "/products",
      label: "Refresh Catalog",
      description: "Tighten pricing, refill stock, and keep best sellers ready.",
      icon: BoxIcon,
      tone: "flat",
    },
    {
      href: "/transactions",
      label: "Review Sales",
      description: "Scan today’s order flow, fee totals, and confirmation status.",
      icon: ReceiptIcon,
      tone: "flat",
    },
  ] as const;

  const insightLines = [
    openQrCount > 0
      ? `${openQrCount} payment QR ${openQrCount === 1 ? "is" : "are"} still open right now.`
      : "No customer QR sessions are currently waiting for confirmation.",
    lowStockCount > 0
      ? `${lowStockCount} SKU ${lowStockCount === 1 ? "needs" : "need"} stock attention today.`
      : "Inventory looks healthy across your active catalog.",
    totalFees > 0
      ? `${formatCurrency(totalFees)} in rebate and fees is accruing toward settlement.`
      : "No settlement fees have accrued yet today.",
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <div className="material-hero p-6 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-50">
              Merchant Overview
            </span>
            <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-50/90">
              {activeProducts.toLocaleString()} active products
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            {merchant?.name ?? "Store"} is ready for today’s selling window.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50/88 sm:text-base">
            Keep checkout moving, catch low-stock risk early, and see what today’s sales are adding to your next settlement cycle.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`rounded-[22px] border p-4 transition hover:-translate-y-0.5 ${
                    action.tone === "hero"
                      ? "border-white/22 bg-white/12"
                      : "border-white/12 bg-white/8"
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-base font-semibold">{action.label}</p>
                  <p className="mt-1 text-sm leading-6 text-emerald-50/80">
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="material-card-flat p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Operating Pulse</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                A quick read on checkout momentum, stock pressure, and fee exposure.
              </p>
            </div>
            <span className="material-chip material-chip-muted">Today</span>
          </div>

          <div className="mt-5 space-y-3">
            {insightLines.map((line) => (
              <div
                key={line}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-600"
              >
                {line}
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Open QR Sessions
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {openQrCount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Avg Order Value
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {formatCurrency(avgOrderValue)}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="material-stat p-5">
          <p className="text-sm text-slate-500">Today&apos;s Gross Sales</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(grossSales)}
          </p>
          <p className="mt-1 text-xs text-slate-400">All transactions started today</p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm text-slate-500">Confirmed Orders</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {todayConfirmedCount.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">Customer-confirmed checkouts today</p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm text-slate-500">Settlement Fees</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(totalFees)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Rebate plus service fee on today’s flow</p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm text-slate-500">Inventory Pressure</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {lowStockCount.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Low-stock items, including {outOfStockCount.toLocaleString()} out of stock
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
        <div className="material-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Recent Transactions</h2>
              <p className="mt-1 text-sm text-slate-500">
                The latest customer activity across checkout confirmations and pending sales.
              </p>
            </div>
            <Link
              href="/transactions"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View all
            </Link>
          </div>

          {recentTxns.length === 0 ? (
            <div className="material-empty border-emerald-200 bg-emerald-50/40 px-6 py-10 text-center">
              <p className="text-base font-medium text-slate-700">
                No transactions yet.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Create a payment QR to start collecting customer confirmations and settlement data.
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
                        <p className="mt-1 text-sm text-slate-500">
                          {tx.createdAt.toLocaleString()}
                        </p>
                      </div>
                      <span className={statusClass(tx.status)}>{tx.status}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50/80 p-3">
                        <p className="text-slate-500">Amount</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {formatCurrency(Number(tx.totalAmount))}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50/80 p-3">
                        <p className="text-slate-500">Fees</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {formatCurrency(
                            Number(tx.rebateAmount) + Number(tx.serviceFee),
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="material-table-shell hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="p-4">Customer</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Fees</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTxns.map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-100">
                          <td className="p-4">{tx.user.email}</td>
                          <td className="p-4 font-medium">
                            {formatCurrency(Number(tx.totalAmount))}
                          </td>
                          <td className="p-4 text-slate-600">
                            {formatCurrency(
                              Number(tx.rebateAmount) + Number(tx.serviceFee),
                            )}
                          </td>
                          <td className="p-4">
                            <span className={statusClass(tx.status)}>{tx.status}</span>
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

        <div className="space-y-4">
          <div className="material-card-flat p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">Inventory Watch</h2>
              <span className="material-chip material-chip-muted">
                {lowStockCount.toLocaleString()} flagged
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {lowStockCount > 0
                ? `${lowStockCount} products are at or below the current low-stock threshold, including ${outOfStockCount} that need an immediate refill.`
                : "All tracked products are currently above the low-stock threshold."}
            </p>
            <Link
              href="/products"
              className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Review inventory
            </Link>
          </div>

          <div className="material-card-flat p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">Settlement Preview</h2>
              <span className="material-chip material-chip-muted">Finance</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Today’s transaction flow is currently contributing {formatCurrency(totalFees)} toward platform rebate and service fee settlement.
            </p>
            <Link
              href="/settlements"
              className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View settlements
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
