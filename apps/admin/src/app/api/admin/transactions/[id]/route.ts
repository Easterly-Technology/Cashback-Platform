import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { adminTransactionStatusUpdateSchema } from "@cashback/shared";
import { requireAdminSession } from "@/lib/admin-session";

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "DISPUTED", "CANCELLED"],
  CONFIRMED: ["DISPUTED", "CANCELLED"],
  DISPUTED: ["CONFIRMED", "CANCELLED"],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();

  if (!session.ok) {
    return session.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = adminTransactionStatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        confirmedAt: true,
        totalAmount: true,
        userId: true,
        merchantId: true,
      },
    });

    if (!existing) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (existing.status === parsed.data.status) {
      return Response.json(
        { error: "Transaction already has this status" },
        { status: 409 },
      );
    }

    const allowedStatuses = ALLOWED_STATUS_TRANSITIONS[existing.status] ?? [];

    if (!allowedStatuses.includes(parsed.data.status)) {
      return Response.json(
        { error: "Status transition is not allowed" },
        { status: 409 },
      );
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        status: parsed.data.status,
        confirmedAt:
          parsed.data.status === "CONFIRMED"
            ? existing.confirmedAt ?? new Date()
            : parsed.data.status === "CANCELLED"
              ? null
              : existing.confirmedAt,
      },
      select: {
        id: true,
        status: true,
        confirmedAt: true,
      },
    });

    await writeAuditLog(prisma, {
      actorType: "ADMIN",
      actorId: session.admin.id,
      action: "UPDATE_TRANSACTION_STATUS",
      resourceType: "TRANSACTION",
      resourceId: updated.id,
      details: {
        previousStatus: existing.status,
        nextStatus: updated.status,
        amount: Number(existing.totalAmount),
        userId: existing.userId,
        merchantId: existing.merchantId,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({
      success: true,
      transaction: {
        id: updated.id,
        status: updated.status,
        confirmedAt: updated.confirmedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("[ADMIN] Failed to update transaction status:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
