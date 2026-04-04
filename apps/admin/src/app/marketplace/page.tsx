import { prisma } from "@cashback/database";
import { getTokenSettingsSnapshot } from "@cashback/shared";

export const dynamic = "force-dynamic";

function getDateOnly(date: Date) {
  return new Date(date.toISOString().split("T")[0]);
}

export default async function MarketplaceMonitoringPage() {
  const today = getDateOnly(new Date());

  const [settings, todayListings, recentOrders, todayPool] = await Promise.all([
    prisma.platformSetting.findMany({
      where: {
        key: {
          in: ["marketplace_enabled"],
        },
      },
    }),
    prisma.marketplaceListing.findMany({
      where: { listingDate: today },
      orderBy: { priceTier: "asc" },
    }),
    prisma.marketplaceOrder.findMany({
      take: 25,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        listing: { select: { priceTier: true, listingDate: true } },
      },
    }),
    prisma.dailyTokenPool.findUnique({
      where: { poolDate: today },
    }),
  ]);

  const { marketplaceEnabled } = getTokenSettingsSnapshot(settings);
  const totals = todayListings.reduce(
    (acc, listing) => {
      const totalQuantity = Number(listing.totalQuantity);
      const remainingQty = Number(listing.remainingQty);

      acc.totalQuantity += totalQuantity;
      acc.remainingQty += remainingQty;
      acc.cashValue += totalQuantity * Number(listing.priceTier);
      return acc;
    },
    { totalQuantity: 0, remainingQty: 0, cashValue: 0 },
  );
  const soldQuantity = totals.totalQuantity - totals.remainingQty;
  const filledPct =
    totals.totalQuantity > 0 ? (soldQuantity / totals.totalQuantity) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Exchange Monitoring
        </h1>
        <p className="text-sm text-slate-500">
          Track today&apos;s exchange listings, filled trades, and realized cash value.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Exchange Status</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {marketplaceEnabled ? "Active" : "Paused"}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Today&apos;s Pool</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            RM{Number(todayPool?.poolValue ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Tokens Sold</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {soldQuantity.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {filledPct.toFixed(1)}% of listed quantity
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Listed Cash Value</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            RM{totals.cashValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold">Today&apos;s Order Book</h2>
        </div>
        {todayListings.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            No listings generated for today yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  <th className="p-4">Price</th>
                  <th className="p-4">Total Qty</th>
                  <th className="p-4">Remaining</th>
                  <th className="p-4">Sold</th>
                  <th className="p-4">Fill %</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayListings.map((listing) => {
                  const totalQuantity = Number(listing.totalQuantity);
                  const remainingQty = Number(listing.remainingQty);
                  const sold = totalQuantity - remainingQty;
                  const fill = totalQuantity > 0 ? (sold / totalQuantity) * 100 : 0;

                  return (
                    <tr key={listing.id} className="border-b border-slate-100">
                      <td className="p-4 font-medium">
                        RM{Number(listing.priceTier).toFixed(2)}
                      </td>
                      <td className="p-4">{totalQuantity.toLocaleString()}</td>
                      <td className="p-4">{remainingQty.toLocaleString()}</td>
                      <td className="p-4 text-red-500">{sold.toLocaleString()}</td>
                      <td className="p-4">{fill.toFixed(1)}%</td>
                      <td className="p-4">{listing.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold">Recent Exchange Trades</h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            No exchange trades have been completed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  <th className="p-4">User</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Token Amount</th>
                  <th className="p-4">Cash Value</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100">
                    <td className="p-4">
                      <p className="font-medium text-slate-900">{order.user.name}</p>
                      <p className="text-xs text-slate-400">{order.user.email}</p>
                    </td>
                    <td className="p-4">RM{Number(order.pricePerToken).toFixed(2)}</td>
                    <td className="p-4 text-red-500">
                      -{Number(order.tokenAmount).toLocaleString()}
                    </td>
                    <td className="p-4 text-green-600">
                      RM{Number(order.cashValue).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-4 text-slate-400">
                      {order.createdAt.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
