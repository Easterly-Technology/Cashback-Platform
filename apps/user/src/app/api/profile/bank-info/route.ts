import { Prisma, prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { bankInfoSchema } from "@cashback/shared";
import { auth } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bankInfoSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        bankInfo: parsed.data as Prisma.InputJsonValue,
      },
    });

    await writeAuditLog(prisma, {
      actorType: "USER",
      actorId: userId,
      action: "UPDATE_PAYOUT_DETAILS",
      resourceType: "USER",
      resourceId: userId,
      details: {
        bankName: parsed.data.bankName,
        accountNumberLast4: parsed.data.accountNumber.slice(-4),
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({ success: true, bankInfo: parsed.data });
  } catch (error) {
    console.error("[USER] Failed to update payout details:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
