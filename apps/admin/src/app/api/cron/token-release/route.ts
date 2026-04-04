import { prisma } from "@cashback/database";
import {
  calculateDailyRelease,
  DEFAULT_TOKEN_RELEASE_RATE,
  getTokenSettingsSnapshot,
} from "@cashback/shared";

function getDateOnly(date: Date) {
  return new Date(date.toISOString().split("T")[0]);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getDateOnly(new Date());
  const settings = await prisma.platformSetting.findMany({
    where: { key: { in: ["token_release_rate"] } },
  });
  const { releaseRate } = getTokenSettingsSnapshot(settings);
  let processed = 0;
  let totalReleased = 0;
  const batchSize = 100;
  let cursor: string | undefined;

  while (true) {
    const entitlements = await prisma.userTokenEntitlement.findMany({
      where: {
        entitledTokens: { gt: 0 },
      },
      orderBy: { id: "asc" },
      take: batchSize,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    if (entitlements.length === 0) break;

    for (const ent of entitlements) {
      const dailyRelease = calculateDailyRelease(
        ent.entitledTokens.toString(),
        ent.releasedTokens.toString(),
        releaseRate || DEFAULT_TOKEN_RELEASE_RATE,
      );

      if (dailyRelease.lte(0)) continue;

      try {
        await prisma.$transaction(async (tx) => {
          const updatedEntitlement = await tx.userTokenEntitlement.update({
            where: { id: ent.id },
            data: {
              releasedTokens: { increment: dailyRelease.toNumber() },
              availableTokens: { increment: dailyRelease.toNumber() },
              releaseStartDate: ent.releaseStartDate ?? today,
            },
            select: { releasedTokens: true },
          });

          await tx.tokenReleaseLog.create({
            data: {
              userId: ent.userId,
              releaseDate: today,
              amount: dailyRelease.toNumber(),
              cumulative: updatedEntitlement.releasedTokens,
            },
          });
        });
        processed++;
        totalReleased += dailyRelease.toNumber();
      } catch (e: any) {
        if (e?.code === "P2002") continue; // Already processed today
        throw e;
      }
    }

    cursor = entitlements[entitlements.length - 1]?.id;
  }

  return Response.json({
    success: true,
    date: today.toISOString(),
    processed,
    totalReleased,
    releaseRate,
  });
}
