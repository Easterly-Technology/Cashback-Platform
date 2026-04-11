import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import {
  formatCurrency,
  getTokenSettingsSnapshot,
  parseBankInfo,
} from "@cashback/shared";
import { auth } from "@/lib/auth";
import { getUserCashSummary } from "@/lib/cash-summary";
import { BankInfoForm } from "../bank-info-form";
import { SubPageHeader } from "../sub-page-header";
import { WithdrawalRequestForm } from "../withdrawal-request-form";

/* ---------- Skeletons ---------- */
function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2].map((i) => (
        <div key={i} className="material-card animate-pulse px-4 py-4">
          <div className="h-3 w-16 rounded bg-slate-200" />
          <div className="mt-3 h-6 w-20 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton({ title }: { title: string }) {
  return (
    <div className="material-card animate-pulse overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="h-4 w-24 rounded bg-slate-200" />
      </div>
      <div className="space-y-0 divide-y divide-slate-100/70">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between px-5 py-3">
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-3 w-36 rounded bg-slate-100" />
            </div>
            <div className="h-4 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Async Components ---------- */
async function AssetOverview({ userId }: { userId: string }) {
  const [tokenEntitlement, cashSummary] = await Promise.all([
    prisma.userTokenEntitlement.findUnique({ where: { userId } }),
    getUserCashSummary(userId),
  ]);

  const available = Number(tokenEntitlement?.availableTokens ?? 0);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="material-card px-4 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Cash Balance
        </p>
        <p className="mt-2 text-xl font-bold text-emerald-700">
          {formatCurrency(cashSummary.availableToWithdraw)}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">Available to withdraw</p>
      </div>
      <div className="material-card px-4 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">
          Token Balance
        </p>
        <p className="mt-2 text-xl font-bold text-blue-700">
          {available.toLocaleString()}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">Available tokens</p>
      </div>
    </div>
  );
}

async function TokenSummary({ userId }: { userId: string }) {
  const [tokenEntitlement, orderStats] = await Promise.all([
    prisma.userTokenEntitlement.findUnique({ where: { userId } }),
    prisma.marketplaceOrder.aggregate({
      where: { userId },
      _sum: { cashValue: true },
      _count: true,
    }),
  ]);

  const entitled = Number(tokenEntitlement?.entitledTokens ?? 0);
  const released = Number(tokenEntitlement?.releasedTokens ?? 0);
  const available = Number(tokenEntitlement?.availableTokens ?? 0);
  const totalSold = Number(orderStats._sum.cashValue ?? 0);

  return (
    <div className="material-card p-5">
      <h2 className="text-sm font-semibold text-slate-950">Token Summary</h2>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Entitled Tokens</span>
          <span className="font-semibold text-slate-900">{entitled.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Released Tokens</span>
          <span className="font-semibold text-slate-900">{released.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Available to Trade</span>
          <span className="font-semibold text-blue-700">{available.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Total Sold Value</span>
          <span className="font-semibold text-emerald-700">{formatCurrency(totalSold)}</span>
        </div>
      </div>
    </div>
  );
}

async function CashWallet({ userId }: { userId: string }) {
  const [user, cashSummary] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getUserCashSummary(userId),
  ]);

  const bankInfo = parseBankInfo(user?.bankInfo ?? null);

  return (
    <div id="cash-wallet" className="material-card p-5">
      <h2 className="text-sm font-semibold text-slate-950">Cash Wallet</h2>
      <p className="mt-1 text-xs text-slate-500">
        Cash credited from completed token sales.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Available</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">{formatCurrency(cashSummary.availableToWithdraw)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">Pending</p>
          <p className="mt-1 text-lg font-bold text-amber-700">{formatCurrency(cashSummary.pendingWithdrawalAmount)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Withdrawn</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(cashSummary.withdrawnToDate)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Lifetime Sold</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(cashSummary.lifetimeProceeds)}</p>
        </div>
      </div>

      <div id="payout-details" className="mt-5 border-t border-slate-200 pt-5">
        <h3 className="text-sm font-semibold text-slate-950">Payout Details</h3>
        <p className="mt-1 text-xs text-slate-500">
          Save the bank account details used for manual withdrawal payouts.
        </p>
        <div className="mt-3">
          <BankInfoForm initialBankInfo={bankInfo} />
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <h3 className="text-sm font-semibold text-slate-950">Request Withdrawal</h3>
        <p className="mt-1 text-xs text-slate-500">
          Requests are reviewed manually by the admin team before payout.
        </p>
        <div className="mt-3">
          <WithdrawalRequestForm
            availableToWithdraw={cashSummary.availableToWithdraw}
            bankInfo={bankInfo}
          />
        </div>
      </div>
    </div>
  );
}

function withdrawalStatusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "status-badge status-badge-success";
    case "APPROVED":
      return "status-badge status-badge-info";
    case "REJECTED":
      return "status-badge status-badge-danger";
    default:
      return "status-badge status-badge-warning";
  }
}

async function WithdrawalHistory({ userId }: { userId: string }) {
  const withdrawalRequests = await prisma.withdrawalRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="material-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-sm font-semibold text-slate-950">Withdrawal History</h2>
      </div>
      {withdrawalRequests.length === 0 ? (
        <div className="px-5 pb-5 text-sm text-slate-400">No withdrawal requests yet</div>
      ) : (
        <div className="divide-y divide-slate-100/70">
          {withdrawalRequests.map((request) => (
            <div key={request.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(Number(request.amount))}</p>
                <p className="text-[11px] text-slate-500">Requested {request.createdAt.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400">
                  {request.processedAt ? `Updated ${request.processedAt.toLocaleString()}` : "Awaiting admin review"}
                </p>
              </div>
              <span className={withdrawalStatusClass(request.status)}>{request.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function Purchases({ userId }: { userId: string }) {
  const [transactions, settings] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      include: { merchant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.platformSetting.findMany({
      where: { key: { in: ["token_multiplier"] } },
    }),
  ]);

  const tokenSettings = getTokenSettingsSnapshot(settings);

  return (
    <div className="material-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-sm font-semibold text-slate-950">Purchases</h2>
      </div>
      {transactions.length === 0 ? (
        <div className="px-5 pb-5 text-sm text-slate-400">No purchases yet</div>
      ) : (
        <div className="divide-y divide-slate-100/70">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{tx.merchant.name}</p>
                <p className="text-[11px] text-slate-500">{tx.createdAt.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(Number(tx.totalAmount))}</p>
                <p className="text-[11px] font-medium text-emerald-600">
                  +{(Number(tx.totalAmount) * tokenSettings.multiplier).toLocaleString()} tokens
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function TokenTrades({ userId }: { userId: string }) {
  const marketplaceOrders = await prisma.marketplaceOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="material-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-sm font-semibold text-slate-950">Token Trades</h2>
      </div>
      {marketplaceOrders.length === 0 ? (
        <div className="px-5 pb-5 text-sm text-slate-400">No token trades yet</div>
      ) : (
        <div className="divide-y divide-slate-100/70">
          {marketplaceOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Sold at RM{Number(order.pricePerToken).toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-500">{order.createdAt.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-rose-500">
                  -{Number(order.tokenAmount).toLocaleString()} tokens
                </p>
                <p className="text-[11px] font-semibold text-emerald-600">
                  {formatCurrency(Number(order.cashValue))} credited
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Main Page ---------- */
export default async function AssetPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <SubPageHeader title="Asset" />

      <Suspense fallback={<OverviewSkeleton />}>
        <AssetOverview userId={userId} />
      </Suspense>

      <Suspense fallback={<ListSkeleton title="Token Summary" />}>
        <TokenSummary userId={userId} />
      </Suspense>

      <Suspense fallback={<ListSkeleton title="Cash Wallet" />}>
        <CashWallet userId={userId} />
      </Suspense>

      <Suspense fallback={<ListSkeleton title="Withdrawal History" />}>
        <WithdrawalHistory userId={userId} />
      </Suspense>

      <Suspense fallback={<ListSkeleton title="Purchases" />}>
        <Purchases userId={userId} />
      </Suspense>

      <Suspense fallback={<ListSkeleton title="Token Trades" />}>
        <TokenTrades userId={userId} />
      </Suspense>
    </div>
  );
}
