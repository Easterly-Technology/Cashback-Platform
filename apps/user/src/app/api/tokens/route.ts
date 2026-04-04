import { prisma } from "@cashback/database";
import {
  calculateDailyRelease,
  daysUntilFullRelease,
  getTokenSettingsSnapshot,
} from "@cashback/shared";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [entitlement, settings] = await Promise.all([
    prisma.userTokenEntitlement.findUnique({
      where: { userId },
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

  if (!entitlement) {
    return Response.json({
      availableTokens: 0,
      releasedTokens: 0,
      entitledTokens: 0,
      totalSpending: 0,
      nextReleaseAmount: 0,
      estimatedDaysRemaining: 0,
      settings: tokenSettings,
    });
  }

  return Response.json({
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
    settings: tokenSettings,
  });
}
