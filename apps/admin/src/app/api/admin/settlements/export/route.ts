import { SettlementStatus, prisma } from "@cashback/database";
import { csvResponse, toCsv } from "@/lib/csv";
import { requireAdminSession } from "@/lib/admin-session";

export async function GET(request: Request) {
  const session = await requireAdminSession();

  if (!session.ok) {
    return session.response;
  }

  const params = new URL(request.url).searchParams;
  const selectedStatus = params.get("status") ?? "open";
  let where: Record<string, unknown> = {};

  if (selectedStatus === "open") {
    where = {
      status: { in: [SettlementStatus.PENDING, SettlementStatus.INVOICED] },
    };
  } else if (
    selectedStatus === SettlementStatus.PENDING ||
    selectedStatus === SettlementStatus.INVOICED ||
    selectedStatus === SettlementStatus.PAID
  ) {
    where = { status: selectedStatus };
  }

  const settlements = await prisma.merchantSettlement.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      merchant: {
        select: {
          name: true,
          contactEmail: true,
        },
      },
    },
    take: 5000,
  });

  return csvResponse(
    "settlements.csv",
    toCsv(
      [
        "id",
        "merchant_name",
        "merchant_email",
        "period_start",
        "period_end",
        "status",
        "invoice_reference",
        "total_rebate",
        "total_service_fee",
        "total_owed",
        "paid_at",
        "created_at",
      ],
      settlements.map((settlement) => [
        settlement.id,
        settlement.merchant.name,
        settlement.merchant.contactEmail,
        settlement.periodStart.toISOString().split("T")[0],
        settlement.periodEnd.toISOString().split("T")[0],
        settlement.status,
        settlement.invoiceReference ?? "",
        Number(settlement.totalRebate),
        Number(settlement.totalServiceFee),
        Number(settlement.totalOwed),
        settlement.paidAt?.toISOString() ?? "",
        settlement.createdAt.toISOString(),
      ]),
    ),
  );
}
