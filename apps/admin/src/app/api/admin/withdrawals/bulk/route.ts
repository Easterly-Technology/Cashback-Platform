import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { adminWithdrawalBulkStatusUpdateSchema } from "@cashback/shared";
import { requireAdminSession } from "@/lib/admin-session";

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["COMPLETED", "REJECTED"],
};

export async function PATCH(request: Request) {
  const session = await requireAdminSession();

  if (!session.ok) {
    return session.response;
  }

  try {
    const body = await request.json();
    const parsed = adminWithdrawalBulkStatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existingRequests = await prisma.withdrawalRequest.findMany({
      where: { id: { in: parsed.data.ids } },
      select: { id: true, userId: true, amount: true, status: true },
    });

    if (existingRequests.length === 0) {
      return Response.json(
        { error: "No withdrawal requests found" },
        { status: 404 },
      );
    }

    const targetRequests = existingRequests.filter((requestEntry) =>
      (ALLOWED_STATUS_TRANSITIONS[requestEntry.status] ?? []).includes(
        parsed.data.status,
      ),
    );

    if (targetRequests.length === 0) {
      return Response.json(
        { error: "Selected withdrawals cannot move to this status" },
        { status: 409 },
      );
    }

    const processedAt = new Date();

    await prisma.$transaction(
      targetRequests.map((requestEntry) =>
        prisma.withdrawalRequest.update({
          where: { id: requestEntry.id },
          data: {
            status: parsed.data.status,
            processedAt,
          },
        }),
      ),
    );

    await Promise.all(
      targetRequests.map((requestEntry) =>
        writeAuditLog(prisma, {
          actorType: "ADMIN",
          actorId: session.admin.id,
          action: "BULK_UPDATE_WITHDRAWAL_STATUS",
          resourceType: "WITHDRAWAL_REQUEST",
          resourceId: requestEntry.id,
          details: {
            previousStatus: requestEntry.status,
            nextStatus: parsed.data.status,
            amount: Number(requestEntry.amount),
            userId: requestEntry.userId,
          },
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        }),
      ),
    );

    return Response.json({
      success: true,
      updatedCount: targetRequests.length,
      skippedCount: existingRequests.length - targetRequests.length,
    });
  } catch (error) {
    console.error("[ADMIN] Failed to bulk update withdrawals:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
