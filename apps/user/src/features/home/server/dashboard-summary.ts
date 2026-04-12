import { cache } from "react";
import { prisma } from "@cashback/database";
import {
  calculateDailyRelease,
  daysUntilFullRelease,
  getTokenSettingsSnapshot,
  type TokenSettingsSnapshot,
} from "@cashback/shared";
import { getUserCashSummary, type UserCashSummary } from "@/lib/cash-summary";

export type UserDashboardSummary = {
  tokenSettings: TokenSettingsSnapshot;
  cashSummary: UserCashSummary;
  entitledTokens: number;
  releasedTokens: number;
  availableTokens: number;
  totalSpending: number;
  dailyRelease: number;
  releaseProgress: number;
  daysRemaining: number;
};

export const getUserDashboardSummary = cache(
  async (userId: string): Promise<UserDashboardSummary> => {
    const [entitlement, settings, cashSummary] = await Promise.all([
      prisma.userTokenEntitlement.findUnique({ where: { userId } }),
      prisma.platformSetting.findMany({
        where: {
          key: { in: ["token_multiplier", "token_release_rate"] },
        },
      }),
      getUserCashSummary(userId),
    ]);

    const tokenSettings = getTokenSettingsSnapshot(settings);
    const entitledTokens = Number(entitlement?.entitledTokens ?? 0);
    const releasedTokens = Number(entitlement?.releasedTokens ?? 0);
    const availableTokens = Number(entitlement?.availableTokens ?? 0);
    const totalSpending = Number(entitlement?.totalSpending ?? 0);
    const dailyRelease = calculateDailyRelease(
      entitledTokens,
      releasedTokens,
      tokenSettings.releaseRate,
    ).toNumber();
    const releaseProgress =
      entitledTokens > 0
        ? Math.min((releasedTokens / entitledTokens) * 100, 100)
        : 0;

    return {
      tokenSettings,
      cashSummary,
      entitledTokens,
      releasedTokens,
      availableTokens,
      totalSpending,
      dailyRelease,
      releaseProgress,
      daysRemaining: daysUntilFullRelease(
        entitledTokens,
        releasedTokens,
        tokenSettings.releaseRate,
      ),
    };
  },
);
