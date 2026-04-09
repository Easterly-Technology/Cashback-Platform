import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const DEFAULT_DISTRIBUTION = {
  "0.10": 0.25,
  "0.20": 0.2,
  "0.30": 0.15,
  "0.40": 0.1,
  "0.50": 0.08,
  "0.60": 0.07,
  "0.70": 0.05,
  "0.80": 0.04,
  "0.90": 0.03,
  "1.00": 0.03,
};

const DEFAULT_POOL_VALUE = 1500;
const DEFAULT_TOTAL_SPENDING = 1500;
const DEFAULT_ENTITLED_TOKENS = 3000;
const DEFAULT_RELEASED_TOKENS = 1800;
const DEFAULT_AVAILABLE_TOKENS = 1200;

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function ensureWorkspaceEnv() {
  if (process.env.DATABASE_URL) return;

  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, ".env.development.local"),
    path.join(cwd, ".env.local"),
    path.join(cwd, ".env.development"),
    path.join(cwd, ".env"),
  ];

  for (const candidate of candidates) loadEnvFile(candidate);
}

function getDateOnly(date) {
  return new Date(date.toISOString().split("T")[0]);
}

function toPositiveNumber(rawValue, fallbackValue) {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function normalizeDistribution(rawValue) {
  if (!rawValue || typeof rawValue !== "object" || Array.isArray(rawValue)) {
    return DEFAULT_DISTRIBUTION;
  }

  const entries = Object.entries(rawValue)
    .map(([priceTier, pct]) => [priceTier, Number(pct)])
    .filter(([, pct]) => Number.isFinite(pct) && pct > 0);

  const totalPct = entries.reduce((sum, [, pct]) => sum + pct, 0);

  if (!entries.length || Math.abs(totalPct - 1) > 0.000001) {
    return DEFAULT_DISTRIBUTION;
  }

  return Object.fromEntries(entries);
}

ensureWorkspaceEnv();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Load your local or dev database env first.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const today = getDateOnly(new Date());
  const poolValue = toPositiveNumber(
    process.env.EXCHANGE_SEED_POOL_VALUE,
    DEFAULT_POOL_VALUE,
  );
  const minTotalSpending = toPositiveNumber(
    process.env.EXCHANGE_SEED_TOTAL_SPENDING,
    DEFAULT_TOTAL_SPENDING,
  );
  const minEntitledTokens = toPositiveNumber(
    process.env.EXCHANGE_SEED_ENTITLED_TOKENS,
    DEFAULT_ENTITLED_TOKENS,
  );
  const minReleasedTokens = toPositiveNumber(
    process.env.EXCHANGE_SEED_RELEASED_TOKENS,
    DEFAULT_RELEASED_TOKENS,
  );
  const minAvailableTokens = toPositiveNumber(
    process.env.EXCHANGE_SEED_AVAILABLE_TOKENS,
    DEFAULT_AVAILABLE_TOKENS,
  );

  const [activeUsers, distributionSetting, existingListings] = await Promise.all([
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      include: { tokenEntitlement: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.platformSetting.findUnique({
      where: { key: "marketplace_distribution" },
    }),
    prisma.marketplaceListing.findMany({
      where: { listingDate: today },
      orderBy: { priceTier: "asc" },
    }),
  ]);

  if (activeUsers.length === 0) {
    throw new Error("No active users found. Run `pnpm db:seed` first.");
  }

  const distribution = normalizeDistribution(distributionSetting?.value);
  const listingMap = new Map(
    existingListings.map((listing) => [Number(listing.priceTier).toFixed(2), listing]),
  );

  await prisma.platformSetting.upsert({
    where: { key: "marketplace_enabled" },
    update: {
      value: true,
      description: "Whether the marketplace is active",
    },
    create: {
      key: "marketplace_enabled",
      value: true,
      description: "Whether the marketplace is active",
    },
  });

  await prisma.platformSetting.upsert({
    where: { key: "marketplace_distribution" },
    update: {
      value: distribution,
      description: "Distribution of token pool across price tiers",
    },
    create: {
      key: "marketplace_distribution",
      value: distribution,
      description: "Distribution of token pool across price tiers",
    },
  });

  await prisma.dailyTokenPool.upsert({
    where: { poolDate: today },
    update: {
      poolValue,
      totalSpending: minTotalSpending * activeUsers.length,
    },
    create: {
      poolDate: today,
      poolValue,
      totalSpending: minTotalSpending * activeUsers.length,
    },
  });

  const seededUsers = [];
  for (const user of activeUsers) {
    const nextAvailable = Math.max(
      Number(user.tokenEntitlement?.availableTokens ?? 0),
      minAvailableTokens,
    );
    const nextReleased = Math.max(
      Number(user.tokenEntitlement?.releasedTokens ?? 0),
      minReleasedTokens,
      nextAvailable,
    );
    const nextEntitled = Math.max(
      Number(user.tokenEntitlement?.entitledTokens ?? 0),
      minEntitledTokens,
      nextReleased,
    );
    const nextSpending = Math.max(
      Number(user.tokenEntitlement?.totalSpending ?? 0),
      minTotalSpending,
    );

    await prisma.userTokenEntitlement.upsert({
      where: { userId: user.id },
      update: {
        totalSpending: nextSpending,
        entitledTokens: nextEntitled,
        releasedTokens: nextReleased,
        availableTokens: nextAvailable,
        releaseStartDate: user.tokenEntitlement?.releaseStartDate ?? today,
      },
      create: {
        userId: user.id,
        totalSpending: nextSpending,
        entitledTokens: nextEntitled,
        releasedTokens: nextReleased,
        availableTokens: nextAvailable,
        releaseStartDate: today,
      },
    });

    seededUsers.push({
      email: user.email,
      availableTokens: nextAvailable,
      releasedTokens: nextReleased,
      entitledTokens: nextEntitled,
    });
  }

  const seededListings = [];
  for (const [priceTier, pct] of Object.entries(distribution)) {
    const targetRemainingQty = Math.floor((poolValue * pct) / Number(priceTier));
    if (targetRemainingQty <= 0) continue;

    const existing = listingMap.get(Number(priceTier).toFixed(2));

    if (existing) {
      const consumedQty = Math.max(
        Number(existing.totalQuantity) - Number(existing.remainingQty),
        0,
      );

      const updated = await prisma.marketplaceListing.update({
        where: { id: existing.id },
        data: {
          totalQuantity: consumedQty + targetRemainingQty,
          remainingQty: targetRemainingQty,
          status: targetRemainingQty > 0 ? "ACTIVE" : "EXHAUSTED",
        },
      });

      seededListings.push({
        priceTier: Number(updated.priceTier),
        remainingQty: Number(updated.remainingQty),
        totalQuantity: Number(updated.totalQuantity),
        action: "refilled",
      });
      continue;
    }

    const created = await prisma.marketplaceListing.create({
      data: {
        listingDate: today,
        priceTier: Number(priceTier),
        totalQuantity: targetRemainingQty,
        remainingQty: targetRemainingQty,
        status: "ACTIVE",
      },
    });

    seededListings.push({
      priceTier: Number(created.priceTier),
      remainingQty: Number(created.remainingQty),
      totalQuantity: Number(created.totalQuantity),
      action: "created",
    });
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        date: today.toISOString().split("T")[0],
        poolValue,
        usersSeeded: seededUsers,
        listingsSeeded: seededListings,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
