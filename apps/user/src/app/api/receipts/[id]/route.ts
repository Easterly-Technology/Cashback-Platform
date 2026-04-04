import { prisma } from "@cashback/database";
import { calculateEntitledTokens } from "@cashback/shared";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const signature = searchParams.get("sig");

  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  const qrCode = await prisma.transactionQrCode.findUnique({
    where: { id },
    include: { merchant: { select: { name: true } } },
  });

  if (!qrCode) {
    return Response.json({ error: "QR code not found" }, { status: 404 });
  }

  const payload = qrCode.payload as {
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    totalAmount: number;
  };

  const normalizedSignature = signature.trim().toLowerCase();
  const normalizedStoredHmac = qrCode.hmac.trim().toLowerCase();

  if (normalizedSignature !== normalizedStoredHmac) {
    console.error("[USER] QR signature mismatch", {
      id,
      signature,
      stored: qrCode.hmac,
    });
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  return Response.json({
    qrCodeId: qrCode.id,
    status: qrCode.status,
    expiresAt: qrCode.expiresAt.toISOString(),
    merchant: qrCode.merchant.name,
    items: payload.items,
    totalAmount: payload.totalAmount,
    tokensEntitled: calculateEntitledTokens(payload.totalAmount).toNumber(),
  });
}
