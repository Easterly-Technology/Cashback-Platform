import { prisma } from "@cashback/database";
import { registerSchema } from "@cashback/shared";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        phone: parsed.data.phone,
        passwordHash,
        status: "ACTIVE",
        emailVerified: false,
      },
    });

    // Create token entitlement record
    await prisma.userTokenEntitlement.create({
      data: {
        userId: user.id,
        totalSpending: 0,
        entitledTokens: 0,
        releasedTokens: 0,
        availableTokens: 0,
      },
    });

    return Response.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 },
    );
  } catch (error) {
    console.error("[USER] Registration failed:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
