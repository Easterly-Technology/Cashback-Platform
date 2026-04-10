import Link from "next/link";
import { prisma } from "@cashback/database";
import { formatCurrency, parseBankInfo } from "@cashback/shared";
import { PaginationControls } from "@/components/pagination-controls";
import WithdrawalQueueManager from "./withdrawal-queue-manager";

export const dynamic = "force-dynamic";

const VIEW_OPTIONS = [
  { label: "Needs Review", value: "needs-review" },
  { label: "Stale", value: "stale" },
  { label: "Approved", value: "approved" },
  { label: "Completed", value: "completed" },
  { label: "All", value: "all" },
] as const;

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Rejected", value: "REJECTED" },
] as const;

function buildWhere(selectedStatus?: string, selectedView?: string) {
  const where: Record<string, unknown> = {};

  if (selectedStatus && selectedStatus !== "all") {
    where.status = selectedStatus;
    return where;
  }

  switch (selectedView) {
    case "needs-review":
      where.status = "PENDING";
      break;
    case "approved":
      where.status = "APPROVED";
      break;
    case "completed":
      where.status = "COMPLETED";
      break;
    case "stale":
      where.status = "PENDING";
      where.createdAt = {
        lt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      };
      break;
    default:
      break;
  }

  return where;
}

export default async function WithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; page?: string }>;
}) {
  const params = await searchParams;
  const selectedView = params.view ?? "needs-review";
  const selectedStatus = params.status ?? "all";
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const pageSize = 20;
  const where = buildWhere(selectedStatus, selectedView);

  const [
    requests,
    totalCount,
    pendingAggregate,
    approvedAggregate,
    completedAggregate,
    rejectedAggregate,
  ] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            bankInfo: true,
          },
        },
      },
    }),
    prisma.withdrawalRequest.count({ where }),
    prisma.withdrawalRequest.aggregate({
      where: { status: "PENDING" },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: "APPROVED" },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: "COMPLETED" },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: "REJECTED" },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  const summaryCards = [
    {
      label: "Pending",
      count: pendingAggregate._count,
      amount: Number(pendingAggregate._sum.amount ?? 0),
      tone: "border-amber-200 bg-amber-50",
    },
    {
      label: "Approved",
      count: approvedAggregate._count,
      amount: Number(approvedAggregate._sum.amount ?? 0),
      tone: "border-indigo-200 bg-indigo-50",
    },
    {
      label: "Completed",
      count: completedAggregate._count,
      amount: Number(completedAggregate._sum.amount ?? 0),
      tone: "border-emerald-200 bg-emerald-50",
    },
    {
      label: "Rejected",
      count: rejectedAggregate._count,
      amount: Number(rejectedAggregate._sum.amount ?? 0),
      tone: "border-rose-200 bg-rose-50",
    },
  ];

  const baseParams = {
    status: selectedStatus === "all" ? undefined : selectedStatus,
    view: selectedView === "all" ? undefined : selectedView,
  };

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <span className="material-chip">Payout Operations</span>
        <h1 className="material-title mt-4 text-slate-950">Withdrawals</h1>
        <p className="material-subtitle mt-3 max-w-2xl">
          Review withdrawal requests, verify payout details, work through saved queue presets, and apply bulk payout decisions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border px-5 py-5 ${card.tone}`}>
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {card.count.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {formatCurrency(card.amount)}
            </p>
          </div>
        ))}
      </div>

      <div className="material-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {VIEW_OPTIONS.map((option) => {
              const active = selectedView === option.value;
              const href = new URLSearchParams();

              if (option.value !== "all") {
                href.set("view", option.value);
              }
              if (selectedStatus !== "all") {
                href.set("status", selectedStatus);
              }

              return (
                <Link
                  key={option.value}
                  href={href.toString() ? `/withdrawals?${href.toString()}` : "/withdrawals"}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => {
              const active = selectedStatus === option.value;
              const href = new URLSearchParams();

              if (selectedView !== "all") {
                href.set("view", selectedView);
              }
              if (option.value !== "all") {
                href.set("status", option.value);
              }

              return (
                <Link
                  key={option.value}
                  href={href.toString() ? `/withdrawals?${href.toString()}` : "/withdrawals"}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
            <Link
              href={`/api/admin/withdrawals/export${
                (() => {
                  const href = new URLSearchParams();
                  if (selectedView !== "all") href.set("view", selectedView);
                  if (selectedStatus !== "all") href.set("status", selectedStatus);
                  const query = href.toString();
                  return query ? `?${query}` : "";
                })()
              }`}
              className="material-button-outlined px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Export CSV
            </Link>
          </div>
        </div>
      </div>

      <div className="material-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Withdrawal Queue</h2>
            <p className="mt-1 text-sm text-slate-500">
              Requests include the user&apos;s saved payout details and can be processed individually or in bulk.
            </p>
          </div>
          <span className="material-chip material-chip-muted">
            {totalCount.toLocaleString()} requests
          </span>
        </div>

        <WithdrawalQueueManager
          requests={requests.map((requestEntry) => {
            const bankInfo = parseBankInfo(requestEntry.user.bankInfo);

            return {
              id: requestEntry.id,
              amount: Number(requestEntry.amount),
              status: requestEntry.status,
              processedAt: requestEntry.processedAt?.toISOString() ?? null,
              createdAt: requestEntry.createdAt.toISOString(),
              user: {
                name: requestEntry.user.name,
                email: requestEntry.user.email,
                payoutLabel: bankInfo?.accountHolderName ?? null,
                payoutSubLabel: bankInfo?.bankName ?? null,
                payoutAccount: bankInfo?.accountNumber ?? null,
              },
            };
          })}
        />
      </div>

      <PaginationControls
        pathname="/withdrawals"
        params={baseParams}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </div>
  );
}
