import { cache } from "react";
import { prisma } from "@cashback/database";
import {
  calculateDailyRelease,
  daysUntilFullRelease,
  getTokenSettingsSnapshot,
} from "@cashback/shared";
import { getUserCashSummary } from "@/lib/cash-summary";

function getDateOnly(date: Date) {
  return new Date(date.toISOString().split("T")[0]);
}

export type ExchangeListing = {
  id: string;
  priceTier: number;
  totalQty: number;
  remainingQty: number;
  status: string;
};

export type ExchangeEntitlement = {
  availableTokens: number;
  releasedTokens: number;
  entitledTokens: number;
  totalSpending: number;
  nextReleaseAmount: number;
  estimatedDaysRemaining: number;
};

export type ExchangeCashSummary = {
  availableToWithdraw: number;
  pendingWithdrawalAmount: number;
  withdrawnToDate: number;
  lifetimeProceeds: number;
};

export type ExchangeRecentOrder = {
  id: string;
  userName: string;
  tokenAmount: number;
  cashValue: number;
  pricePerToken: number;
  createdAt: string;
};

export type ExchangeSnapshot = {
  date: string;
  marketplaceEnabled: boolean;
  exchangeEnabled: boolean;
  listings: ExchangeListing[];
  entitlement: ExchangeEntitlement;
  cashSummary: ExchangeCashSummary | null;
  recentOrders: ExchangeRecentOrder[];
};

const emptyEntitlement: ExchangeEntitlement = {
  availableTokens: 0,
  releasedTokens: 0,
  entitledTokens: 0,
  totalSpending: 0,
  nextReleaseAmount: 0,
  estimatedDaysRemaining: 0,
};

export async function getExchangeSnapshotUncached(
  userId: string | null | undefined,
): Promise<ExchangeSnapshot> {
  const today = getDateOnly(new Date());

  const [listings, recentOrders, settings, cashSummary, entitlement] =
    await Promise.all([
      prisma.marketplaceListing.findMany({
        where: { listingDate: today },
        orderBy: { priceTier: "asc" },
      }),
      prisma.marketplaceOrder.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: { name: true },
          },
        },
      }),
      prisma.platformSetting.findMany({
        where: {
          key: {
            in: [
              "marketplace_enabled",
              "token_multiplier",
              "token_release_rate",
            ],
          },
        },
      }),
      userId ? getUserCashSummary(userId) : Promise.resolve(null),
      userId
        ? prisma.userTokenEntitlement.findUnique({
            where: { userId },
          })
        : Promise.resolve(null),
    ]);

  const tokenSettings = getTokenSettingsSnapshot(settings);
  const normalizedListings = listings
    .map((listing) => ({
      id: listing.id,
      priceTier: Number(listing.priceTier),
      totalQty: Math.max(0, Math.floor(Number(listing.totalQuantity))),
      remainingQty: Math.max(0, Math.floor(Number(listing.remainingQty))),
      status: listing.status,
    }))
    .filter((listing) => listing.totalQty > 0 && listing.remainingQty > 0);

  const entitlementSnapshot = entitlement
    ? {
        availableTokens: Number(entitlement.availableTokens),
        releasedTokens: Number(entitlement.releasedTokens),
        entitledTokens: Number(entitlement.entitledTokens),
        totalSpending: Number(entitlement.totalSpending),
        nextReleaseAmount: calculateDailyRelease(
          entitlement.entitledTokens.toString(),
          entitlement.releasedTokens.toString(),
          tokenSettings.releaseRate,
        ).toNumber(),
        estimatedDaysRemaining: daysUntilFullRelease(
          entitlement.entitledTokens.toString(),
          entitlement.releasedTokens.toString(),
          tokenSettings.releaseRate,
        ),
      }
    : emptyEntitlement;

  return {
    date: today.toISOString(),
    marketplaceEnabled: tokenSettings.marketplaceEnabled,
    exchangeEnabled: tokenSettings.marketplaceEnabled,
    listings: normalizedListings,
    entitlement: entitlementSnapshot,
    cashSummary,
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      userName: order.user.name,
      tokenAmount: Number(order.tokenAmount),
      cashValue: Number(order.cashValue),
      pricePerToken: Number(order.pricePerToken),
      createdAt: order.createdAt.toISOString(),
    })),
  };
}

export const getExchangeSnapshot = cache(getExchangeSnapshotUncached);
