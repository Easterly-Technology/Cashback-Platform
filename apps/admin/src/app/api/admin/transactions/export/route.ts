import { prisma } from "@cashback/database";
import { csvResponse, toCsv } from "@/lib/csv";
import { requireAdminSession } from "@/lib/admin-session";

function applyTransactionView(params: URLSearchParams) {
  const view = params.get("view");
  const now = new Date();

  if (view === "pending-review" && !params.get("status")) {
    return { status: { in: ["PENDING", "DISPUTED"] as const } };
  }

  if (view === "today" && !params.get("from") && !params.get("to")) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { createdAt: { gte: start, lt: end } };
  }

  if (view === "disputes" && !params.get("status")) {
    return { status: "DISPUTED" as const };
  }

  return {};
}

export async function GET(request: Request) {
  const session = await requireAdminSession();

  if (!session.ok) {
    return session.response;
  }

  const url = new URL(request.url);
  const params = url.searchParams;
  const where: Record<string, unknown> = applyTransactionView(params);

  const status = params.get("status");
  if (status && status !== "all") {
    where.status = status;
  }

  const from = params.get("from");
  const to = params.get("to");

  if (from) {
    where.createdAt = { ...(where.createdAt as object), gte: new Date(from) };
  }
  if (to) {
    where.createdAt = { ...(where.createdAt as object), lt: new Date(to) };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      merchant: { select: { name: true } },
    },
    take: 5000,
  });

  return csvResponse(
    "transactions.csv",
    toCsv(
      [
        "id",
        "status",
        "user_name",
        "user_email",
        "merchant_name",
        "total_amount",
        "rebate_amount",
        "service_fee",
        "confirmed_at",
        "created_at",
      ],
      transactions.map((transaction) => [
        transaction.id,
        transaction.status,
        transaction.user.name,
        transaction.user.email,
        transaction.merchant.name,
        Number(transaction.totalAmount),
        Number(transaction.rebateAmount),
        Number(transaction.serviceFee),
        transaction.confirmedAt?.toISOString() ?? "",
        transaction.createdAt.toISOString(),
      ]),
    ),
  );
}
