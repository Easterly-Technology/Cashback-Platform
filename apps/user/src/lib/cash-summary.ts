import { prisma } from "@cashback/database";

export interface UserCashSummary {
  availableToWithdraw: number;
  pendingWithdrawalAmount: number;
  withdrawnToDate: number;
  lifetimeProceeds: number;
  tradeCount: number;
  pendingWithdrawalCount: number;
  completedWithdrawalCount: number;
}

export async function getUserCashSummary(
  userId: string,
): Promise<UserCashSummary> {
  const [orderStats, pendingWithdrawalStats, completedWithdrawalStats] =
    await Promise.all([
      prisma.marketplaceOrder.aggregate({
        where: { userId },
        _sum: { cashValue: true },
        _count: true,
      }),
      prisma.withdrawalRequest.aggregate({
        where: {
          userId,
          status: {
            in: ["PENDING", "APPROVED"],
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.withdrawalRequest.aggregate({
        where: { userId, status: "COMPLETED" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

  const lifetimeProceeds = Number(orderStats._sum.cashValue ?? 0);
  const pendingWithdrawalAmount = Number(
    pendingWithdrawalStats._sum.amount ?? 0,
  );
  const withdrawnToDate = Number(completedWithdrawalStats._sum.amount ?? 0);
  const availableToWithdraw = Math.max(
    lifetimeProceeds - pendingWithdrawalAmount - withdrawnToDate,
    0,
  );

  return {
    availableToWithdraw,
    pendingWithdrawalAmount,
    withdrawnToDate,
    lifetimeProceeds,
    tradeCount: orderStats._count,
    pendingWithdrawalCount: pendingWithdrawalStats._count,
    completedWithdrawalCount: completedWithdrawalStats._count,
  };
}
