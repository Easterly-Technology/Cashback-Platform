import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import { auth } from "@/lib/auth";
import { TransactionQrForm } from "@/components/transaction-qr-form";

export default async function QrCodesPage() {
  const session = await auth();
  const merchantId = (session?.user as { id?: string } | undefined)?.id;

  if (!merchantId) {
    redirect("/login?callbackUrl=%2Fqr-codes");
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      rebatePct: true,
      serviceFeePct: true,
    },
  });

  return (
    <TransactionQrForm
      rebatePct={Number(merchant?.rebatePct ?? 0)}
      serviceFeePct={Number(merchant?.serviceFeePct ?? 0)}
    />
  );
}
