import { prisma } from "@cashback/database";
import { getTokenSettingsSnapshot } from "@cashback/shared";
import { getDateOnly } from "@/lib/date";

export type OpsAlertSeverity = "critical" | "warning" | "info";

export type OpsAlert = {
  id: string;
  title: string;
  reason: string;
  severity: OpsAlertSeverity;
  href: string;
  age: string;
  source: string;
  createdAt?: Date;
};

function ageFrom(date?: Date) {
  if (!date) return "today";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 60) return `${Math.max(minutes, 1)}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  return `${Math.floor(hours / 24)}d`;
}

export function alertTone(severity: OpsAlertSeverity) {
  switch (severity) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-sky-200 bg-sky-50 text-sky-900";
  }
}

export async function getOpsAlerts() {
  const today = getDateOnly(new Date());
  const staleTransactionCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const staleWithdrawalCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [
    pendingMerchants,
    disputedTransactions,
    staleTransactions,
    staleWithdrawals,
    todayPool,
    todayListingsCount,
    tokenSettings,
    suspendedUsers,
    suspendedMerchants,
    openSettlements,
  ] = await Promise.all([
    prisma.merchant.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 8,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.transaction.findMany({
      where: { status: "DISPUTED" },
      orderBy: { createdAt: "asc" },
      take: 8,
      include: {
        merchant: { select: { name: true } },
        user: { select: { email: true } },
      },
    }),
    prisma.transaction.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: staleTransactionCutoff },
      },
      orderBy: { createdAt: "asc" },
      take: 8,
      include: {
        merchant: { select: { name: true } },
        user: { select: { email: true } },
      },
    }),
    prisma.withdrawalRequest.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: staleWithdrawalCutoff },
      },
      orderBy: { createdAt: "asc" },
      take: 8,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.dailyTokenPool.findUnique({
      where: { poolDate: today },
    }),
    prisma.marketplaceListing.count({
      where: { listingDate: today },
    }),
    prisma.platformSetting.findMany({
      where: {
        key: {
          in: ["marketplace_enabled"],
        },
      },
    }),
    prisma.user.findMany({
      where: { status: { in: ["SUSPENDED", "BANNED"] } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, name: true, status: true, updatedAt: true },
    }),
    prisma.merchant.findMany({
      where: { status: "SUSPENDED" },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, name: true, updatedAt: true },
    }),
    prisma.merchantSettlement.findMany({
      where: { status: { in: ["PENDING", "INVOICED"] } },
      orderBy: { createdAt: "asc" },
      take: 8,
      include: {
        merchant: { select: { id: true, name: true } },
      },
    }),
  ]);

  const { marketplaceEnabled } = getTokenSettingsSnapshot(tokenSettings);
  const alerts: OpsAlert[] = [];

  pendingMerchants.forEach((merchant) => {
    alerts.push({
      id: `merchant-pending-${merchant.id}`,
      title: `${merchant.name} is awaiting approval`,
      reason: "New merchant account has not been activated yet.",
      severity: "warning",
      href: `/merchants/${merchant.id}`,
      age: ageFrom(merchant.createdAt),
      source: "merchant approval",
      createdAt: merchant.createdAt,
    });
  });

  disputedTransactions.forEach((transaction) => {
    alerts.push({
      id: `transaction-disputed-${transaction.id}`,
      title: `Disputed order from ${transaction.merchant.name}`,
      reason: `${transaction.user.email} has a transaction that needs manual review.`,
      severity: "critical",
      href: `/transactions/${transaction.id}`,
      age: ageFrom(transaction.createdAt),
      source: "transaction",
      createdAt: transaction.createdAt,
    });
  });

  staleTransactions.forEach((transaction) => {
    alerts.push({
      id: `transaction-pending-${transaction.id}`,
      title: `Pending order is getting stale`,
      reason: `${transaction.merchant.name} / ${transaction.user.email} has been pending for over 24 hours.`,
      severity: "warning",
      href: `/transactions/${transaction.id}`,
      age: ageFrom(transaction.createdAt),
      source: "transaction",
      createdAt: transaction.createdAt,
    });
  });

  staleWithdrawals.forEach((request) => {
    alerts.push({
      id: `withdrawal-pending-${request.id}`,
      title: `${request.user.name} is still waiting on payout review`,
      reason: `Pending withdrawal for ${request.user.email} has been idle for over 48 hours.`,
      severity: "critical",
      href: `/withdrawals/${request.id}`,
      age: ageFrom(request.createdAt),
      source: "withdrawal",
      createdAt: request.createdAt,
    });
  });

  if (!todayPool) {
    alerts.push({
      id: "missing-token-pool",
      title: "Today's token pool has not been generated",
      reason: "Run history or automation may need attention before exchange listings can go live.",
      severity: "critical",
      href: "/tokens",
      age: "today",
      source: "automation",
    });
  }

  if (marketplaceEnabled && todayPool && todayListingsCount === 0) {
    alerts.push({
      id: "missing-marketplace-listings",
      title: "Exchange listings are missing for today",
      reason: "A token pool exists but no marketplace listings were generated.",
      severity: "critical",
      href: "/marketplace",
      age: "today",
      source: "exchange",
    });
  }

  suspendedUsers.forEach((user) => {
    alerts.push({
      id: `user-${user.id}`,
      title: `${user.name} is ${user.status.toLowerCase()}`,
      reason: "Suspended accounts should be reviewed to confirm the restriction is still expected.",
      severity: "info",
      href: `/users/${user.id}`,
      age: ageFrom(user.updatedAt),
      source: "user account",
      createdAt: user.updatedAt,
    });
  });

  suspendedMerchants.forEach((merchant) => {
    alerts.push({
      id: `merchant-suspended-${merchant.id}`,
      title: `${merchant.name} is suspended`,
      reason: "Suspended merchants should be reviewed for reactivation or permanent offboarding.",
      severity: "info",
      href: `/merchants/${merchant.id}`,
      age: ageFrom(merchant.updatedAt),
      source: "merchant account",
      createdAt: merchant.updatedAt,
    });
  });

  openSettlements.forEach((settlement) => {
    alerts.push({
      id: `settlement-${settlement.id}`,
      title: `${settlement.merchant.name} settlement is still open`,
      reason: `Settlement period ${settlement.periodStart.toISOString().split("T")[0]} to ${settlement.periodEnd.toISOString().split("T")[0]} is ${settlement.status.toLowerCase()}.`,
      severity: settlement.status === "PENDING" ? "warning" : "info",
      href: `/settlements`,
      age: ageFrom(settlement.createdAt),
      source: "settlement",
      createdAt: settlement.createdAt,
    });
  });

  const severityOrder: Record<OpsAlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return alerts.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    if (!a.createdAt && !b.createdAt) return a.title.localeCompare(b.title);
    if (!a.createdAt) return -1;
    if (!b.createdAt) return 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}
