import { prisma } from "@cashback/database";
import { csvResponse, toCsv } from "@/lib/csv";
import { requireAdminSession } from "@/lib/admin-session";

function buildWithdrawalWhere(params: URLSearchParams) {
  const where: Record<string, unknown> = {};
  const status = params.get("status");
  const view = params.get("view");

  if (status && status !== "all") {
    where.status = status;
  } else if (view === "needs-review") {
    where.status = "PENDING";
  } else if (view === "approved") {
    where.status = "APPROVED";
  } else if (view === "completed") {
    where.status = "COMPLETED";
  } else if (view === "stale") {
    const staleCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    where.status = "PENDING";
    where.createdAt = { lt: staleCutoff };
  }

  return where;
}

export async function GET(request: Request) {
  const session = await requireAdminSession();

  if (!session.ok) {
    return session.response;
  }

  const params = new URL(request.url).searchParams;
  const requests = await prisma.withdrawalRequest.findMany({
    where: buildWithdrawalWhere(params),
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    take: 5000,
  });

  return csvResponse(
    "withdrawals.csv",
    toCsv(
      [
        "id",
        "status",
        "user_name",
        "user_email",
        "amount",
        "processed_at",
        "created_at",
      ],
      requests.map((requestEntry) => [
        requestEntry.id,
        requestEntry.status,
        requestEntry.user.name,
        requestEntry.user.email,
        Number(requestEntry.amount),
        requestEntry.processedAt?.toISOString() ?? "",
        requestEntry.createdAt.toISOString(),
      ]),
    ),
  );
}
