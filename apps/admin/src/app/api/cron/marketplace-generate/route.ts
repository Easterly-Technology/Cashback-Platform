import { prisma } from "@cashback/database";
import Decimal from "decimal.js";
import {
  distributeTokenPool,
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
    return Response.json(
      { error: "No token pool for today. Run token-pool cron first." },
      { status: 400 },
    );
  }

  const { marketplaceEnabled } = getTokenSettingsSnapshot(tokenSettings);
  if (!marketplaceEnabled) {
    return Response.json(
      { error: "Exchange center is disabled in platform settings." },
      { status: 409 },
    );
  }

  const distribution = (distSetting?.value ?? {}) as Record<string, number>;
  const distributedListings = distributeTokenPool(
    pool.poolValue.toString(),
    distribution,
  ).filter((listing) => listing.quantity.gt(0));

  const existingListings = await prisma.marketplaceListing.findMany({
    where: { listingDate: today },
    select: { id: true, priceTier: true, remainingQty: true, totalQuantity: true },
  });

  const listingMap = new Map(
    existingListings.map((listing) => [Number(listing.priceTier).toFixed(2), listing]),
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

  return Response.json({ success: true, date: today.toISOString(), listings });
}
