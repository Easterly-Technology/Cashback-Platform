import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { adminSettlementUpdateSchema } from "@cashback/shared";
import { requireAdminSession } from "@/lib/admin-session";

const ALLOWED_SETTLEMENT_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["INVOICED", "PAID"],
  INVOICED: ["PENDING", "PAID"],
  PAID: [],
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
    const parsed = adminSettlementUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.merchantSettlement.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        invoiceReference: true,
        paidAt: true,
        totalOwed: true,
        merchantId: true,
      },
    });

    if (!existing) {
      return Response.json({ error: "Settlement not found" }, { status: 404 });
    }

    const nextStatus = parsed.data.status ?? existing.status;

    if (nextStatus !== existing.status) {
      const allowedStatuses =
        ALLOWED_SETTLEMENT_TRANSITIONS[existing.status] ?? [];

      if (!allowedStatuses.includes(nextStatus)) {
        return Response.json(
          { error: "Status transition is not allowed" },
          { status: 409 },
        );
      }
    }

    const normalizedInvoiceReference =
      parsed.data.invoiceReference === undefined
        ? existing.invoiceReference
        : parsed.data.invoiceReference;

    if (
      nextStatus === existing.status &&
      normalizedInvoiceReference === existing.invoiceReference
    ) {
      return Response.json(
        { error: "Settlement already has these values" },
        { status: 409 },
      );
    }

    const updated = await prisma.merchantSettlement.update({
      where: { id },
      data: {
        status: nextStatus,
        invoiceReference: normalizedInvoiceReference,
        paidAt:
          nextStatus === "PAID"
            ? existing.paidAt ?? new Date()
            : nextStatus === "PENDING"
              ? null
              : existing.paidAt,
      },
      select: {
        id: true,
        status: true,
        invoiceReference: true,
        paidAt: true,
      },
    });

    await writeAuditLog(prisma, {
      actorType: "ADMIN",
      actorId: session.admin.id,
      action: "UPDATE_SETTLEMENT",
      resourceType: "SETTLEMENT",
      resourceId: updated.id,
      details: {
        previousStatus: existing.status,
        nextStatus: updated.status,
        previousInvoiceReference: existing.invoiceReference,
        nextInvoiceReference: updated.invoiceReference,
        merchantId: existing.merchantId,
        totalOwed: Number(existing.totalOwed),
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({
      success: true,
      settlement: {
        id: updated.id,
        status: updated.status,
        invoiceReference: updated.invoiceReference,
        paidAt: updated.paidAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("[ADMIN] Failed to update settlement:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
