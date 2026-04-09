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

export default async function MerchantDashboard() {
  const session = await auth();
  const merchantId = (session?.user as { id?: string } | undefined)?.id;

  if (!merchantId) {
    redirect("/login?callbackUrl=%2F");
  }

  const [merchant, activeProducts, lowStockCount, todayTransactions, recentTxns] =
    await Promise.all([
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
      prisma.transaction.aggregate({
        where: {
          merchantId,
          createdAt: {
            gte: new Date(new Date().toISOString().split("T")[0]),
          },
        },
        _sum: {
          totalAmount: true,
          rebateAmount: true,
          serviceFee: true,
        },
        _count: true,
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

  const totalOwed =
    Number(todayTransactions._sum.rebateAmount ?? 0) +
    Number(todayTransactions._sum.serviceFee ?? 0);
  const quickActions = [
    {
      href: "/qr-codes",
      label: "New Transaction",
      description: "Build a cart and generate the signed customer QR",
      icon: QrIcon,
      primary: true,
    },
    {
      href: "/products",
      label: "Products",
      description: "Update catalog details and keep inventory current",
      icon: BoxIcon,
      primary: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="material-card mb-6 p-6">
        <span className="material-chip">Merchant Overview</span>
        <h1 className="material-title mt-4 text-slate-950">
          {merchant?.name ?? "Store"} Dashboard
        </h1>
        <p className="material-subtitle mt-3">
          Keep daily sales, in-progress checkout work, and inventory health in view before you check finance follow-up.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className={`${
                action.primary ? "material-hero text-white" : "material-card-flat text-slate-900"
              } flex items-start gap-4 p-6 transition-transform hover:-translate-y-0.5`}
            >
              <div
                className={`icon-tile ${
                  action.primary
                    ? "bg-white/18 text-white"
                    : "bg-emerald-600/10 text-emerald-700"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold">{action.label}</p>
                <p
                  className={`mt-1 text-sm leading-6 ${
                    action.primary ? "text-emerald-50/88" : "text-slate-500"
                  }`}
                >
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="material-stat p-5">
          <p className="text-sm text-gray-500">Today&apos;s Sales</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(Number(todayTransactions._sum.totalAmount ?? 0))}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Revenue confirmed today
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {todayTransactions._count.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Confirmed sales today
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm text-gray-500">Inventory Health</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{lowStockCount}</p>
          <p className="text-xs text-gray-400 mt-1">
            low-stock items across {activeProducts} active products
          </p>
        </div>
      </div>

      <div className="material-card-flat grid gap-4 p-5 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Inventory Watch</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {lowStockCount > 0
              ? `${lowStockCount} products are at or below the low-stock threshold.`
              : "All tracked products are currently above the low-stock threshold."}
          </p>
          <Link href="/products" className="mt-3 inline-flex text-sm font-semibold text-emerald-700">
            Review products
          </Link>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Platform Settlement</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Current confirmed sales translate into {formatCurrency(totalOwed)} owed to the platform through rebate and service fees.
          </p>
          <Link href="/settlements" className="mt-3 inline-flex text-sm font-semibold text-emerald-700">
            View settlements
          </Link>
        </div>
      </div>

      <div className="material-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Recent Transactions</h2>
          <span className="material-chip material-chip-muted">
            {recentTxns.length.toLocaleString()} items
          </span>
        </div>
        {recentTxns.length === 0 ? (
          <div className="material-empty border-emerald-200 bg-emerald-50/40 px-6 py-10 text-center">
            <p className="text-base font-medium text-slate-700">
              No confirmed transactions yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Generate a QR sale to start collecting customer confirmations and settlement data.
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
                      <p className="text-sm text-slate-500">
                        {tx.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <span className="status-badge status-badge-success">
                      {tx.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50/80 p-3">
                      <p className="text-slate-500">Amount</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {formatCurrency(Number(tx.totalAmount))}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50/80 p-3">
                      <p className="text-slate-500">Rebate</p>
                      <p className="mt-1 font-medium text-red-500">
                        {formatCurrency(Number(tx.rebateAmount))}
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
                    <tr className="border-b text-left text-gray-500">
                      <th className="p-4">Customer</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Rebate</th>
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
                        <td className="p-4 text-red-500">
                          {formatCurrency(Number(tx.rebateAmount))}
                        </td>
                        <td className="p-4">
                          <span className="status-badge status-badge-success">
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400">
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
