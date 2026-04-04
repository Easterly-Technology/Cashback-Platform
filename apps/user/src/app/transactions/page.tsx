import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import { getTokenSettingsSnapshot } from "@cashback/shared";
import { auth } from "@/lib/auth";

function formatCurrency(value: number) {
  return `RM${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function TransactionsPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  const [transactions, marketplaceOrders, settings] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      include: { merchant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.marketplaceOrder.findMany({
      where: { userId },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.platformSetting.findMany({
      where: {
        key: {
          in: ["token_multiplier"],
        },
      },
    }),
  ]);
  const tokenSettings = getTokenSettingsSnapshot(settings);

  return (
    <div className="py-4">
      <h1 className="text-xl font-bold mb-4">Transaction History</h1>

      <h2 className="font-semibold mb-2 text-sm text-gray-500">Purchases</h2>
      <div className="bg-white rounded-xl border mb-6">
        {transactions.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">No purchases yet</p>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex justify-between items-center p-3 border-b last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{tx.merchant.name}</p>
                <p className="text-xs text-gray-400">{tx.createdAt.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatCurrency(Number(tx.totalAmount))}
                </p>
                <p className="text-xs text-green-500">
                  +
                  {(
                    Number(tx.totalAmount) * tokenSettings.multiplier
                  ).toLocaleString()}{" "}
                  tokens
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className="font-semibold mb-2 text-sm text-gray-500">
        Token Trades
      </h2>
      <div className="bg-white rounded-xl border">
        {marketplaceOrders.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">No token trades yet</p>
        ) : (
          marketplaceOrders.map((order) => (
            <div
              key={order.id}
              className="flex justify-between items-center p-3 border-b last:border-0"
            >
              <div>
                <p className="text-sm font-medium">
                  Sold at RM{Number(order.pricePerToken).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  {order.createdAt.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-500">
                  -{Number(order.tokenAmount).toLocaleString()} tokens
                </p>
                <p className="text-xs text-green-600 font-medium">
                  {formatCurrency(Number(order.cashValue))} received
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
