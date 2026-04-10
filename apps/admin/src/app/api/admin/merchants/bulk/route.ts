import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { adminMerchantBulkStatusUpdateSchema } from "@cashback/shared";
import { requireAdminSession } from "@/lib/admin-session";

export async function PATCH(request: Request) {
  const session = await requireAdminSession();

  if (!session.ok) {
    return session.response;
  }

  try {
    const body = await request.json();
    const parsed = adminMerchantBulkStatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existingMerchants = await prisma.merchant.findMany({
      where: { id: { in: parsed.data.ids } },
      select: { id: true, contactEmail: true, status: true },
    });

    if (existingMerchants.length === 0) {
      return Response.json({ error: "No merchants found" }, { status: 404 });
    }

    const targetMerchants = existingMerchants.filter(
      (merchant) => merchant.status !== parsed.data.status,
    );

    if (targetMerchants.length === 0) {
      return Response.json(
        { error: "Selected merchants already have this status" },
        { status: 409 },
      );
    }

    await prisma.merchant.updateMany({
      where: { id: { in: targetMerchants.map((merchant) => merchant.id) } },
      data: { status: parsed.data.status },
    });

    await Promise.all(
      targetMerchants.map((merchant) =>
        writeAuditLog(prisma, {
          actorType: "ADMIN",
          actorId: session.admin.id,
          action: "BULK_UPDATE_MERCHANT_STATUS",
          resourceType: "MERCHANT",
          resourceId: merchant.id,
          details: {
            previousStatus: merchant.status,
            nextStatus: parsed.data.status,
            email: merchant.contactEmail,
          },
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        }),
      ),
    );

    return Response.json({
      success: true,
      updatedCount: targetMerchants.length,
    });
  } catch (error) {
    console.error("[ADMIN] Failed to bulk update merchants:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
