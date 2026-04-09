import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();
const seedLockId = 46847001;

// Simple hash for seed data only — production uses bcrypt
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

async function withSeedLock<T>(callback: () => Promise<T>) {
  await prisma.$executeRawUnsafe(`SELECT pg_advisory_lock(${seedLockId})`);

  try {
    return await callback();
  } finally {
    await prisma.$executeRawUnsafe(`SELECT pg_advisory_unlock(${seedLockId})`);
  }
}

async function main() {
  await withSeedLock(async () => {
    console.log("Seeding database...");

    // Admin
    const admin = await prisma.admin.upsert({
      where: { email: "admin@cashback.dev" },
      update: {},
      create: {
        email: "admin@cashback.dev",
        passwordHash: hashPassword("admin123"),
        role: "SUPER_ADMIN",
      },
    });
    console.log(`Admin: ${admin.email}`);

    // Merchants
    const merchant1 = await prisma.merchant.upsert({
      where: { contactEmail: "merchant1@cashback.dev" },
      update: {},
      create: {
        name: "Coffee House",
        contactEmail: "merchant1@cashback.dev",
        passwordHash: hashPassword("merchant123"),
        rebatePct: 0.10,
        serviceFeePct: 0.03,
        status: "ACTIVE",
      },
    });

    const merchant2 = await prisma.merchant.upsert({
      where: { contactEmail: "merchant2@cashback.dev" },
      update: {},
      create: {
        name: "Book Store",
        contactEmail: "merchant2@cashback.dev",
        passwordHash: hashPassword("merchant123"),
        rebatePct: 0.10,
        serviceFeePct: 0.03,
        status: "ACTIVE",
      },
    });
    console.log(`Merchants: ${merchant1.name}, ${merchant2.name}`);

    // Products + Inventory
    const products = [
      { merchantId: merchant1.id, name: "Latte", price: 28.0, category: "Drinks" },
      { merchantId: merchant1.id, name: "Cappuccino", price: 32.0, category: "Drinks" },
      { merchantId: merchant1.id, name: "Croissant", price: 18.0, category: "Food" },
      { merchantId: merchant1.id, name: "Sandwich", price: 35.0, category: "Food" },
      { merchantId: merchant1.id, name: "Cheesecake", price: 42.0, category: "Food" },
      { merchantId: merchant2.id, name: "Novel - Fiction", price: 45.0, category: "Books" },
      { merchantId: merchant2.id, name: "Technical Book", price: 89.0, category: "Books" },
      { merchantId: merchant2.id, name: "Notebook", price: 15.0, category: "Stationery" },
      { merchantId: merchant2.id, name: "Pen Set", price: 25.0, category: "Stationery" },
      { merchantId: merchant2.id, name: "Bookmark", price: 8.0, category: "Accessories" },
    ];

    for (const p of products) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          merchantId: p.merchantId,
          name: p.name,
        },
      });

      const product = existingProduct
        ? await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              price: p.price,
              category: p.category,
              status: "ACTIVE",
            },
          })
        : await prisma.product.create({
            data: {
              merchantId: p.merchantId,
              name: p.name,
              price: p.price,
              category: p.category,
              status: "ACTIVE",
            },
          });

      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: {
          quantity: 100,
          lowStockThreshold: 10,
        },
        create: {
          productId: product.id,
          quantity: 100,
          lowStockThreshold: 10,
        },
      });
    }
    console.log(`Products: ${products.length} ensured with inventory`);

    // Users
    const userEmails = [
      "user1@cashback.dev",
      "user2@cashback.dev",
      "user3@cashback.dev",
      "user4@cashback.dev",
      "user5@cashback.dev",
    ];

    for (let i = 0; i < userEmails.length; i++) {
      const user = await prisma.user.upsert({
        where: { email: userEmails[i] },
        update: {},
        create: {
          email: userEmails[i],
          name: `Test User ${i + 1}`,
          passwordHash: hashPassword("user123"),
          status: "ACTIVE",
          emailVerified: true,
        },
      });

      // Create token entitlement record
      await prisma.userTokenEntitlement.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          totalSpending: 0,
          entitledTokens: 0,
          releasedTokens: 0,
          availableTokens: 0,
        },
      });
    }
    console.log(`Users: ${userEmails.length} created`);

    // Platform Settings
    const settings = [
      {
        key: "default_rebate_pct",
        value: 0.10,
        description: "Default merchant rebate percentage",
      },
      {
        key: "default_service_fee_pct",
        value: 0.03,
        description: "Default platform service fee percentage",
      },
      {
        key: "token_multiplier",
        value: 2,
        description: "Token entitlement multiplier (spending × N)",
      },
      {
        key: "token_release_rate",
        value: 0.005,
        description: "Daily token release rate (0.5%)",
      },
      {
        key: "marketplace_price_tiers",
        value: [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00],
        description: "Marketplace price tiers in yuan",
      },
      {
        key: "marketplace_distribution",
        value: {
          "0.10": 0.25,
          "0.20": 0.20,
          "0.30": 0.15,
          "0.40": 0.10,
          "0.50": 0.08,
          "0.60": 0.07,
          "0.70": 0.05,
          "0.80": 0.04,
          "0.90": 0.03,
          "1.00": 0.03,
        },
        description: "Distribution of token pool across price tiers",
      },
      {
        key: "marketplace_enabled",
        value: true,
        description: "Whether the marketplace is active",
      },
    ];

    for (const s of settings) {
      await prisma.platformSetting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: {
          key: s.key,
          value: s.value,
          description: s.description,
        },
      });
    }
    console.log(`Platform settings: ${settings.length} created`);

    console.log("Seeding complete!");
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
