import { createHmac } from "node:crypto";

export interface QrPayload {
  merchantId: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  totalAmount: number;
  qrCodeId: string;
  expiresAt: string; // ISO date string
}

/**
 * Sign a QR code payload with HMAC-SHA256.
 */
export function signQrPayload(payload: QrPayload, secret: string): string {
  const data = JSON.stringify(payload);
  return createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Verify a QR code payload signature.
 */
export function verifyQrSignature(
  payload: QrPayload,
  signature: string,
  secret: string,
): boolean {
  const expected = signQrPayload(payload, secret);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Build the full QR code URL for user scanning.
 */
export function buildQrUrl(
  baseUrl: string,
  qrCodeId: string,
  hmac: string,
): string {
  return `${baseUrl}/scan/${qrCodeId}?sig=${hmac}`;
}
