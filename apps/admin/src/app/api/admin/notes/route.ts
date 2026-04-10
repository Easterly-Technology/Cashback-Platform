import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { adminNoteCreateSchema } from "@cashback/shared";
import { requireAdminSession } from "@/lib/admin-session";

export async function POST(request: Request) {
  const session = await requireAdminSession();

  if (!session.ok) {
    return session.response;
  }

  try {
    const body = await request.json();
    const parsed = adminNoteCreateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const note = await prisma.adminNote.create({
      data: {
        resourceType: parsed.data.resourceType,
        resourceId: parsed.data.resourceId,
        body: parsed.data.body,
        createdBy: session.admin.id,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await writeAuditLog(prisma, {
      actorType: "ADMIN",
      actorId: session.admin.id,
      action: "CREATE_ADMIN_NOTE",
      resourceType: parsed.data.resourceType,
      resourceId: parsed.data.resourceId,
      details: {
        noteId: note.id,
        preview: parsed.data.body.slice(0, 120),
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({
      success: true,
      note: {
        id: note.id,
        body: note.body,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        author: {
          id: note.author.id,
          email: note.author.email,
          role: note.author.role,
        },
      },
    });
  } catch (error) {
    console.error("[ADMIN] Failed to create admin note:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
