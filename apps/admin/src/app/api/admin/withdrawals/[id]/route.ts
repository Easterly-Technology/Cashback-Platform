import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { withdrawalStatusUpdateSchema } from "@cashback/shared";
import { requireAdminSession } from "@/lib/admin-session";

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["COMPLETED", "REJECTED"],
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
    const parsed = withdrawalStatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.withdrawalRequest.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
      },
    });

    if (!existing) {
      return Response.json(
        { error: "Withdrawal request not found" },
        { status: 404 },
      );
    }

    const allowedStatuses =
      ALLOWED_STATUS_TRANSITIONS[existing.status] ?? [];

    if (!allowedStatuses.includes(parsed.data.status)) {
      return Response.json(
        { error: "Status transition is not allowed" },
        { status: 409 },
      );
    }

    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: parsed.data.status,
        processedAt: new Date(),
      },
    });

    await writeAuditLog(prisma, {
      actorType: "ADMIN",
      actorId: session.admin.id,
      action: "UPDATE_WITHDRAWAL_STATUS",
      resourceType: "WITHDRAWAL_REQUEST",
      resourceId: updated.id,
      details: {
        previousStatus: existing.status,
        nextStatus: updated.status,
        amount: Number(updated.amount),
        userId: existing.userId,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({
      success: true,
      request: {
        id: updated.id,
        status: updated.status,
        processedAt: updated.processedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("[ADMIN] Failed to update withdrawal status:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
