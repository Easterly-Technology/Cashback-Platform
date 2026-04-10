import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { adminMerchantStatusUpdateSchema } from "@cashback/shared";
import { requireAdminSession } from "@/lib/admin-session";

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
    const parsed = adminMerchantStatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.merchant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        contactEmail: true,
        status: true,
      },
    });

    if (!existing) {
      return Response.json({ error: "Merchant not found" }, { status: 404 });
    }

    if (existing.status === parsed.data.status) {
      return Response.json(
        { error: "Merchant already has this status" },
        { status: 409 },
      );
    }

    const updated = await prisma.merchant.update({
      where: { id },
      data: {
        status: parsed.data.status,
      },
      select: {
        id: true,
        status: true,
      },
    });

    await writeAuditLog(prisma, {
      actorType: "ADMIN",
      actorId: session.admin.id,
      action: "UPDATE_MERCHANT_STATUS",
      resourceType: "MERCHANT",
      resourceId: updated.id,
      details: {
        previousStatus: existing.status,
        nextStatus: updated.status,
        email: existing.contactEmail,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({ success: true, merchant: updated });
  } catch (error) {
    console.error("[ADMIN] Failed to update merchant status:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
