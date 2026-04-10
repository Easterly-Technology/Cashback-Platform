import MerchantListManager from "./merchant-list-manager";
import { prisma } from "@cashback/database";

export const dynamic = "force-dynamic";

export default async function MerchantsPage() {
  const merchants = await prisma.merchant.findMany({
    orderBy: { createdAt: "desc" },
  });

  const merchantsWithOwed = await Promise.all(
    merchants.map(async (merchant) => {
      const aggregate = await prisma.transaction.aggregate({
        where: { merchantId: merchant.id, status: "CONFIRMED" },
        _sum: { rebateAmount: true, serviceFee: true },
      });

      return {
        ...merchant,
        amountOwed:
          Number(aggregate._sum.rebateAmount ?? 0) +
          Number(aggregate._sum.serviceFee ?? 0),
      };
    }),
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Merchants
          </h1>
          <p className="text-sm text-slate-500">
            Review merchant status, fees, outstanding platform balances, and apply bulk lifecycle changes.
          </p>
        </div>
        <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
          Add Merchant
        </button>
      </div>

      <MerchantListManager
        merchants={merchantsWithOwed.map((merchant) => ({
          id: merchant.id,
          name: merchant.name,
          contactEmail: merchant.contactEmail,
          status: merchant.status,
          rebatePct: Number(merchant.rebatePct) * 100,
          serviceFeePct: Number(merchant.serviceFeePct) * 100,
          amountOwed: merchant.amountOwed,
        }))}
      />
    </div>
  );
}
