import { prisma } from "@cashback/database";
import Decimal from "decimal.js";
import {
  calculateDailyRelease,
  calculateTokenPoolValue,
  DEFAULT_TOKEN_RELEASE_RATE,
  distributeTokenPool,
  getTokenSettingsSnapshot,
} from "@cashback/shared";
import { getDateOnly } from "@/lib/date";
import {
  completeSystemJobRun,
  failSystemJobRun,
  normalizeJobError,
  startSystemJobRun,
  type TrackedJobName,
} from "@/lib/job-runs";

async function executeTokenPoolJob(triggeredBy?: string) {
  const run = await startSystemJobRun("token-pool", triggeredBy);

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = getDateOnly(yesterday);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        status: "CONFIRMED",
        createdAt: { gte: startOfDay, lt: endOfDay },
      },
      include: { merchant: { select: { rebatePct: true } } },
    });

    const totalSpending = transactions.reduce(
      (sum, tx) => sum + Number(tx.totalAmount),
      0,
    );
    const poolValue = calculateTokenPoolValue(
      transactions.map((tx) => ({
        totalAmount: tx.totalAmount.toString(),
        rebatePct: tx.merchant.rebatePct.toString(),
      })),
    ).toNumber();

    const poolDate = getDateOnly(startOfDay);

    await prisma.dailyTokenPool.upsert({
      where: { poolDate },
      update: { totalSpending, poolValue },
      create: { poolDate, totalSpending, poolValue },
    });

    const summary = {
      poolDate: poolDate.toISOString(),
      totalSpending,
      poolValue,
      confirmedTransactions: transactions.length,
    };

    await completeSystemJobRun(run.id, summary);

    return {
      success: true as const,
      runId: run.id,
      summary,
    };
  } catch (error) {
    const message = normalizeJobError(error);
    await failSystemJobRun(run.id, message);
    throw new Error(message);
  }
}

async function executeTokenReleaseJob(triggeredBy?: string) {
  const run = await startSystemJobRun("token-release", triggeredBy);

  try {
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
        } catch (error: unknown) {
          if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as { code?: string }).code === "P2002"
          ) {
            continue;
          }

          throw error;
        }
      }

      cursor = entitlements[entitlements.length - 1]?.id;
    }

    const summary = {
      date: today.toISOString(),
      processed,
      totalReleased,
      releaseRate,
    };

    await completeSystemJobRun(run.id, summary);

    return {
      success: true as const,
      runId: run.id,
      summary,
    };
  } catch (error) {
    const message = normalizeJobError(error);
    await failSystemJobRun(run.id, message);
    throw new Error(message);
  }
}

async function executeMarketplaceGenerateJob(triggeredBy?: string) {
  const run = await startSystemJobRun("marketplace-generate", triggeredBy);

  try {
    const today = getDateOnly(new Date());

    const [pool, distSetting, tokenSettings] = await Promise.all([
      prisma.dailyTokenPool.findUnique({
        where: { poolDate: today },
      }),
      prisma.platformSetting.findUnique({
        where: { key: "marketplace_distribution" },
      }),
      prisma.platformSetting.findMany({
        where: { key: { in: ["marketplace_enabled"] } },
      }),
    ]);

    if (!pool) {
      const message = "No token pool for today. Run token-pool first.";
      await failSystemJobRun(run.id, message, {
        date: today.toISOString(),
      });
      throw new Error(message);
    }

    const { marketplaceEnabled } = getTokenSettingsSnapshot(tokenSettings);
    if (!marketplaceEnabled) {
      const message = "Exchange center is disabled in platform settings.";
      await failSystemJobRun(run.id, message, {
        date: today.toISOString(),
      });
      throw new Error(message);
    }

    const distribution = (distSetting?.value ?? {}) as Record<string, number>;
    const distributedListings = distributeTokenPool(
      pool.poolValue.toString(),
      distribution,
    ).filter((listing) => listing.quantity.gt(0));

    const existingListings = await prisma.marketplaceListing.findMany({
      where: { listingDate: today },
      select: {
        id: true,
        priceTier: true,
        remainingQty: true,
        totalQuantity: true,
      },
    });

    const listingMap = new Map(
      existingListings.map((listing) => [
        Number(listing.priceTier).toFixed(2),
        listing,
      ]),
    );

    const listings: Array<{
      id: string;
      priceTier: number;
      quantity: number;
      remainingQty: number;
      regenerated: boolean;
    }> = [];

    for (const entry of distributedListings) {
      const tierKey = entry.priceTier.toFixed(2);
      const existing = listingMap.get(tierKey);
      const nextTotal = entry.quantity;

      if (existing) {
        const consumed = new Decimal(existing.totalQuantity.toString()).minus(
          existing.remainingQty.toString(),
        );
        const normalizedConsumed = Decimal.max(consumed.ceil(), 0);
        const nextRemaining = Decimal.max(nextTotal.minus(normalizedConsumed), 0);

        const updated = await prisma.marketplaceListing.update({
          where: { id: existing.id },
          data: {
            totalQuantity: nextTotal.toNumber(),
            remainingQty: nextRemaining.toNumber(),
            status: nextRemaining.lte(0) ? "EXHAUSTED" : "ACTIVE",
          },
        });

        listings.push({
          id: updated.id,
          priceTier: Number(updated.priceTier),
          quantity: Number(updated.totalQuantity),
          remainingQty: Number(updated.remainingQty),
          regenerated: true,
        });
        continue;
      }

      const created = await prisma.marketplaceListing.create({
        data: {
          listingDate: today,
          priceTier: entry.priceTier.toNumber(),
          totalQuantity: nextTotal.toNumber(),
          remainingQty: nextTotal.toNumber(),
          status: "ACTIVE",
        },
      });

      listings.push({
        id: created.id,
        priceTier: Number(created.priceTier),
        quantity: Number(created.totalQuantity),
        remainingQty: Number(created.remainingQty),
        regenerated: false,
      });
    }

    const summary = {
      date: today.toISOString(),
      listingCount: listings.length,
      poolValue: Number(pool.poolValue),
      listings,
    };

    await completeSystemJobRun(run.id, summary);

    return {
      success: true as const,
      runId: run.id,
      summary,
    };
  } catch (error) {
    const message = normalizeJobError(error);
    await failSystemJobRun(run.id, message);
    throw new Error(message);
  }
}

export async function runTrackedJob(
  jobName: TrackedJobName,
  triggeredBy?: string,
) {
  switch (jobName) {
    case "token-pool":
      return executeTokenPoolJob(triggeredBy);
    case "token-release":
      return executeTokenReleaseJob(triggeredBy);
    case "marketplace-generate":
      return executeMarketplaceGenerateJob(triggeredBy);
    default:
      throw new Error(`Unsupported job: ${jobName}`);
  }
}
