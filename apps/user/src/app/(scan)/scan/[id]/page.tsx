import { ScanConfirmClient } from "./scan-confirm-client";
import { getReceiptDetails } from "@/lib/receipt-details";

export default async function ScanConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sig?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const signature = query.sig ?? null;
  const result = await getReceiptDetails(id, signature);

  return (
    <ScanConfirmClient
      callbackUrl={`/scan/${id}${signature ? `?sig=${encodeURIComponent(signature)}` : ""}`}
      details={result.details}
      initialError={result.error ?? ""}
      qrCodeId={id}
      signature={signature}
    />
  );
}
