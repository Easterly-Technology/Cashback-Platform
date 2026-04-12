import { Prisma, prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { accountDetailsSchema } from "@cashback/shared";
import { auth } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = accountDetailsSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: {
        email: parsed.data.email,
        NOT: { id: userId },
      },
      select: { id: true },
    });

    if (existing) {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    await writeAuditLog(prisma, {
      actorType: "USER",
      actorId: userId,
      action: "UPDATE_ACCOUNT_DETAILS",
      resourceType: "USER",
      resourceId: userId,
      details: {
        email: updatedUser.email,
        phoneSet: Boolean(updatedUser.phone),
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("[USER] Failed to update account details:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
