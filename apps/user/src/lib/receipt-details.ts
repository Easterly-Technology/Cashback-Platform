import { prisma } from "@cashback/database";
import { calculateEntitledTokens } from "@cashback/shared";

export type ReceiptDetails = {
  qrCodeId: string;
  status: string;
  expiresAt: string;
  merchant: string;
  totalAmount: number;
  tokensEntitled: number;
};

export type ReceiptLookupResult =
  | { details: ReceiptDetails; error: null; status: 200 }
  | { details: null; error: string; status: 400 | 404 };

export async function getReceiptDetails(
  id: string,
  signature: string | null | undefined,
): Promise<ReceiptLookupResult> {
  if (!signature) {
    return { details: null, error: "Missing signature", status: 400 };
  }

  const qrCode = await prisma.transactionQrCode.findUnique({
    where: { id },
    include: { merchant: { select: { name: true } } },
  });

  if (!qrCode) {
    return { details: null, error: "QR code not found", status: 404 };
  }

  const payload = qrCode.payload as {
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
    return { details: null, error: "Invalid signature", status: 400 };
  }

  return {
    details: {
      qrCodeId: qrCode.id,
      status: qrCode.status,
      expiresAt: qrCode.expiresAt.toISOString(),
      merchant: qrCode.merchant.name,
      totalAmount: payload.totalAmount,
      tokensEntitled: calculateEntitledTokens(payload.totalAmount).toNumber(),
    },
    error: null,
    status: 200,
  };
}
