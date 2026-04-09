import Decimal from "decimal.js";
import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import {
  parseBankInfo,
  withdrawalRequestSchema,
} from "@cashback/shared";
import { auth } from "@/lib/auth";
import { getUserCashSummary } from "@/lib/cash-summary";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = withdrawalRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const amount = new Decimal(parsed.data.amount);

    const createdRequest = await prisma.$transaction(async (tx) => {
      const [user, orderStats, openWithdrawalStats, completedWithdrawalStats] =
        await Promise.all([
          tx.user.findUnique({
            where: { id: userId },
            select: { bankInfo: true },
          }),
          tx.marketplaceOrder.aggregate({
            where: { userId },
            _sum: { cashValue: true },
          }),
          tx.withdrawalRequest.aggregate({
            where: {
              userId,
              status: { in: ["PENDING", "APPROVED"] },
            },
            _sum: { amount: true },
          }),
          tx.withdrawalRequest.aggregate({
            where: { userId, status: "COMPLETED" },
            _sum: { amount: true },
          }),
        ]);

      const bankInfo = parseBankInfo(user?.bankInfo ?? null);
      if (!bankInfo) {
        throw new Error("Add payout details before requesting a withdrawal");
      }

      const lifetimeProceeds = new Decimal(orderStats._sum.cashValue ?? 0);
      const openWithdrawalAmount = new Decimal(
        openWithdrawalStats._sum.amount ?? 0,
      );
      const withdrawnToDate = new Decimal(
        completedWithdrawalStats._sum.amount ?? 0,
      );
      const availableToWithdraw = Decimal.max(
        lifetimeProceeds.minus(openWithdrawalAmount).minus(withdrawnToDate),
        0,
      );

      if (amount.gt(availableToWithdraw)) {
        throw new Error("Withdrawal amount exceeds available cash");
      }

      return tx.withdrawalRequest.create({
        data: {
          userId,
          amount: amount.toNumber(),
          status: "PENDING",
        },
      });
    });

    const cashSummary = await getUserCashSummary(userId);

    await writeAuditLog(prisma, {
      actorType: "USER",
      actorId: userId,
      action: "REQUEST_WITHDRAWAL",
      resourceType: "WITHDRAWAL_REQUEST",
      resourceId: createdRequest.id,
      details: {
        amount: amount.toNumber(),
        status: createdRequest.status,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({
      success: true,
      request: {
        id: createdRequest.id,
        amount: Number(createdRequest.amount),
        status: createdRequest.status,
        createdAt: createdRequest.createdAt.toISOString(),
      },
      cashSummary,
    });
  } catch (error: any) {
    console.error("[USER] Failed to create withdrawal request:", error);
    const message = error?.message ?? "Internal server error";
    const status =
      message.includes("payout") || message.includes("exceeds")
        ? 400
        : 500;
    return Response.json({ error: message }, { status });
  }
}
