import { NextRequest } from "next/server";
import { Prisma, prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import {
  calculateCashValue,
  getTokenSettingsSnapshot,
  marketplaceBuySchema,
  marketplaceIdempotencyKeySchema,
} from "@cashback/shared";
import Decimal from "decimal.js";
import { auth } from "@/lib/auth";

function getDateOnly(date: Date) {
  return new Date(date.toISOString().split("T")[0]);
}

export async function GET() {
  const today = getDateOnly(new Date());

  const [listings, recentOrders, settings] = await Promise.all([
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
          in: ["marketplace_enabled"],
        },
      },
    }),
  ]);

  const normalizedListings = listings
    .map((listing) => ({
      id: listing.id,
      priceTier: Number(listing.priceTier),
      totalQty: Math.max(0, Math.floor(Number(listing.totalQuantity))),
      remainingQty: Math.max(0, Math.floor(Number(listing.remainingQty))),
      status: listing.status,
    }))
    .filter((listing) => listing.totalQty > 0 && listing.remainingQty > 0);

  return Response.json({
    date: today.toISOString(),
    marketplaceEnabled: getTokenSettingsSnapshot(settings).marketplaceEnabled,
    exchangeEnabled: getTokenSettingsSnapshot(settings).marketplaceEnabled,
    listings: normalizedListings,
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      userName: order.user.name,
      tokenAmount: Number(order.tokenAmount),
      cashValue: Number(order.cashValue),
      pricePerToken: Number(order.pricePerToken),
      createdAt: order.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = marketplaceBuySchema.safeParse(body);
    const idempotencyKeyHeader = request.headers.get("idempotency-key");
    const parsedIdempotencyKey = idempotencyKeyHeader
      ? marketplaceIdempotencyKeySchema.safeParse(idempotencyKeyHeader)
      : null;

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    if (parsedIdempotencyKey && !parsedIdempotencyKey.success) {
      return Response.json({ error: "Invalid idempotency key" }, { status: 400 });
    }

    const idempotencyKey = parsedIdempotencyKey?.success
      ? parsedIdempotencyKey.data
      : undefined;
    const { listingId, tokenAmount } = parsed.data;
    const amount = new Decimal(tokenAmount);

    const settings = await prisma.platformSetting.findMany({
      where: {
        key: {
          in: ["marketplace_enabled"],
        },
      },
    });

    if (!getTokenSettingsSnapshot(settings).marketplaceEnabled) {
      return Response.json(
        { error: "Exchange center is currently disabled" },
        { status: 409 },
      );
    }

    if (idempotencyKey) {
      const existingOrderWhere: Prisma.MarketplaceOrderWhereUniqueInput = {
        userId_idempotencyKey: {
          userId,
          idempotencyKey,
        },
      };
      const existingOrder = await prisma.marketplaceOrder.findUnique({
        where: existingOrderWhere,
      });

      if (existingOrder) {
        return Response.json({
          order: existingOrder,
          cashValue: Number(existingOrder.cashValue),
          idempotentReplay: true,
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const listings = await tx.$queryRaw<
        Array<{
          id: string;
          status: string;
          remaining_qty: Prisma.Decimal;
          price_tier: Prisma.Decimal;
        }>
      >(
        Prisma.sql`SELECT id, status, remaining_qty, price_tier FROM marketplace_listings WHERE id = ${listingId}::uuid FOR UPDATE`,
      );

      const listing = listings[0];
      if (!listing) throw new Error("Listing not found");
      if (listing.status !== "ACTIVE") throw new Error("Listing not active");

      const remaining = new Decimal(listing.remaining_qty.toString());
      if (remaining.lt(amount)) {
        throw new Error("Insufficient listing quantity");
      }

      const entitlement = await tx.userTokenEntitlement.findUnique({
        where: { userId },
      });

      if (!entitlement) throw new Error("User entitlement not found");

      const available = new Decimal(entitlement.availableTokens.toString());
      if (available.lt(amount)) {
        throw new Error("Insufficient token balance");
      }

      const pricePerToken = new Decimal(listing.price_tier.toString());
      const cashValue = calculateCashValue(amount, pricePerToken);
      const newRemaining = remaining.minus(amount);

      await tx.marketplaceListing.update({
        where: { id: listingId },
        data: {
          remainingQty: newRemaining.toNumber(),
          status: newRemaining.lte(0) ? "EXHAUSTED" : "ACTIVE",
        },
      });

      await tx.userTokenEntitlement.update({
        where: { userId },
        data: {
          availableTokens: { decrement: amount.toNumber() },
        },
      });

      const orderCreateData: Prisma.MarketplaceOrderUncheckedCreateInput = {
        userId,
        listingId,
        idempotencyKey,
        tokenAmount: amount.toNumber(),
        pricePerToken: pricePerToken.toNumber(),
        cashValue: cashValue.toNumber(),
        status: "FILLED",
      };

      const order = await tx.marketplaceOrder.create({
        data: orderCreateData,
      });

      return { order, cashValue: cashValue.toNumber() };
    });

    await writeAuditLog(prisma, {
      actorType: "USER",
      actorId: userId,
      action: "SELL_TOKENS_FOR_CASH",
      resourceType: "MARKETPLACE_ORDER",
      resourceId: result.order.id,
      details: {
        listingId,
        tokenAmount,
        cashValue: result.cashValue,
        idempotencyKey,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json(result);
  } catch (error: any) {
    console.error("[USER] Exchange center trade failed:", error);
    const message = error?.message ?? "Internal server error";
    const status =
      error?.code === "P2002"
        ? 409
        : message.includes("Insufficient") || message.includes("not found")
          ? 400
          : 500;
    return Response.json({ error: message }, { status });
  }
}
