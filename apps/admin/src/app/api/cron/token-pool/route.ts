import { prisma } from "@cashback/database";
import { calculateTokenPoolValue } from "@cashback/shared";

function getDateOnly(date: Date) {
  return new Date(date.toISOString().split("T")[0]);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfDay = getDateOnly(yesterday);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      status: "CONFIRMED",
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
    include: { merchant: { select: { rebatePct: true } } },
  });

  const totalSpending = transactions.reduce(
    (sum, tx) => sum + Number(tx.totalAmount),
    0,
  );
  const poolValue = calculateTokenPoolValue(
    transactions.map((tx) => ({
      totalAmount: tx.totalAmount.toString(),
      rebatePct: tx.merchant.rebatePct.toString(),
    })),
  ).toNumber();

  const poolDate = getDateOnly(startOfDay);

  await prisma.dailyTokenPool.upsert({
    where: { poolDate },
    update: { totalSpending, poolValue },
    create: { poolDate, totalSpending, poolValue },
  });

  return Response.json({ success: true, poolDate: poolDate.toISOString(), totalSpending, poolValue });
}
