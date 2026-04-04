import { NextRequest } from "next/server";
import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { confirmTransactionSchema } from "@cashback/shared";
import { calculateEntitledTokens } from "@cashback/shared";
import Decimal from "decimal.js";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = confirmTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { qrCodeId, signature } = parsed.data;

    const qrCode = await prisma.transactionQrCode.findUnique({
      where: { id: qrCodeId },
      include: { merchant: true },
    });

    if (!qrCode) {
      return Response.json({ error: "QR code not found" }, { status: 404 });
    }

    if (qrCode.status !== "PENDING") {
      return Response.json({ error: "QR code already used or expired" }, { status: 400 });
    }

    if (new Date() > qrCode.expiresAt) {
      await prisma.transactionQrCode.update({
        where: { id: qrCodeId },
        data: { status: "EXPIRED" },
      });
      return Response.json({ error: "QR code expired" }, { status: 400 });
    }

    // Verify HMAC signature
    const payload = qrCode.payload as any;
    const normalizedSignature = signature.trim().toLowerCase();
    const normalizedStoredHmac = qrCode.hmac.trim().toLowerCase();

    if (normalizedSignature !== normalizedStoredHmac) {
      console.error("[USER] Receipt confirmation signature mismatch", {
        qrCodeId,
        signature,
        stored: qrCode.hmac,
      });
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    const totalAmount = new Decimal(payload.totalAmount);
    const rebateAmount = totalAmount.mul(qrCode.merchant.rebatePct.toString());
    const serviceFee = totalAmount.mul(qrCode.merchant.serviceFeePct.toString());

    // Create transaction and update entitlements atomically
    const tokensEntitled = calculateEntitledTokens(totalAmount).toNumber();

    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          merchantId: qrCode.merchantId,
          qrCodeId,
          totalAmount: totalAmount.toNumber(),
          rebateAmount: rebateAmount.toNumber(),
          serviceFee: serviceFee.toNumber(),
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      });

      // Create transaction items
      for (const item of payload.items) {
        await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          },
        });
      }

      // Update QR code status
      await tx.transactionQrCode.update({
        where: { id: qrCodeId },
        data: { status: "CONFIRMED" },
      });

      // Update user token entitlement (entitled = totalSpending × 2)
      const entitlement = await tx.userTokenEntitlement.upsert({
        where: { userId },
        create: {
          userId,
          totalSpending: totalAmount.toNumber(),
          entitledTokens: tokensEntitled,
          releasedTokens: 0,
          availableTokens: 0,
          releaseStartDate: new Date(),
        },
        update: {
          totalSpending: { increment: totalAmount.toNumber() },
          entitledTokens: { increment: tokensEntitled },
        },
      });

      return { transaction, entitlement };
    });

    await writeAuditLog(prisma, {
      actorType: "USER",
      actorId: userId,
      action: "CONFIRM_TRANSACTION",
      resourceType: "TRANSACTION",
      resourceId: result.transaction.id,
      details: {
        qrCodeId,
        totalAmount: totalAmount.toNumber(),
        tokensEntitled,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({
      transactionId: result.transaction.id,
      totalAmount: totalAmount.toNumber(),
      tokensEntitled,
      totalEntitled: Number(result.entitlement.entitledTokens),
    });
  } catch (error) {
    console.error("[USER] Receipt confirmation failed:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
