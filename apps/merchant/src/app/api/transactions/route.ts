import { NextRequest } from "next/server";
import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { createTransactionSchema } from "@cashback/shared";
import { signQrPayload, buildQrUrl } from "@cashback/shared/server";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  const merchantId = (session?.user as { id?: string } | undefined)?.id;
  if (!merchantId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { merchantId },
    include: {
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json(transactions);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const session = await auth();
    const merchantId = (session?.user as { id?: string } | undefined)?.id;
    if (!merchantId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });
    if (!merchant) {
      return Response.json({ error: "Merchant not found" }, { status: 404 });
    }

    const totalAmount = parsed.data.totalAmount;
    const rebateAmount = totalAmount * Number(merchant.rebatePct);
    const serviceFee = totalAmount * Number(merchant.serviceFeePct);

    // Create QR code record
    const qrCodeId = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const payload = {
      merchantId,
      totalAmount,
      qrCodeId,
      expiresAt: expiresAt.toISOString(),
    };

    const secret = process.env.QR_HMAC_SECRET ?? "dev-secret";
    const hmac = signQrPayload(payload, secret);

    const qrCode = await prisma.transactionQrCode.create({
      data: {
        id: qrCodeId,
        merchantId,
        payload: payload as any,
        hmac,
        expiresAt,
        status: "PENDING",
      },
    });

    const baseUrl = process.env.USER_APP_URL ?? "http://localhost:3000";
    const qrUrl = buildQrUrl(baseUrl, qrCodeId, hmac);
    const qrImageDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 280,
      margin: 1,
    });

    await writeAuditLog(prisma, {
      actorType: "MERCHANT",
      actorId: merchantId,
      action: "CREATE_TRANSACTION_QR",
      resourceType: "TRANSACTION_QR",
      resourceId: qrCode.id,
      details: {
        totalAmount,
        expiresAt: expiresAt.toISOString(),
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({
      qrCodeId: qrCode.id,
      qrUrl,
      qrImageDataUrl,
      totalAmount,
      rebateAmount,
      serviceFee,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[MERCHANT] Transaction creation failed:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
