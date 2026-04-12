import { prisma } from "@cashback/database";
import { formatCurrency, parseBankInfo } from "@cashback/shared";
import { BankInfoForm } from "@/features/profile/components/bank-info-form";
import { SubPageHeader } from "@/features/profile/components/sub-page-header";
import { WithdrawalRequestForm } from "@/features/profile/components/withdrawal-request-form";
import { getUserCashSummary } from "@/lib/cash-summary";

function withdrawalStatusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";
    case "APPROVED":
      return "bg-blue-50 text-blue-700";
    case "REJECTED":
      return "bg-rose-50 text-rose-600";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function formatWithdrawalDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export async function WithdrawalPageContent({ userId }: { userId: string }) {
  const [user, cashSummary, withdrawalRequests] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { bankInfo: true },
    }),
    getUserCashSummary(userId),
    prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const bankInfo = parseBankInfo(user?.bankInfo ?? null);

  return (
    <div className="space-y-4">
      <SubPageHeader title="Request Withdrawal" />

      <div className="material-card p-5">
        <p className="text-xs font-semibold uppercase text-emerald-700">
          Cash Wallet
        </p>
        <p className="mt-2 text-3xl font-bold text-slate-950">
          {formatCurrency(cashSummary.availableToWithdraw)}
        </p>
        <p className="mt-1 text-sm text-slate-500">Available to withdraw</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase text-slate-500">
              Pending
            </p>
            <p className="mt-1 text-sm font-bold text-amber-700">
              {formatCurrency(cashSummary.pendingWithdrawalAmount)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase text-slate-500">
              Withdrawn
            </p>
            <p className="mt-1 text-sm font-bold text-slate-950">
              {formatCurrency(cashSummary.withdrawnToDate)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase text-slate-500">
              Sold
            </p>
            <p className="mt-1 text-sm font-bold text-slate-950">
              {formatCurrency(cashSummary.lifetimeProceeds)}
            </p>
          </div>
        </div>
      </div>

      <div id="payout-details" className="material-card p-5">
        <h2 className="text-sm font-semibold text-slate-950">
          Payout Details
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Save the bank account used for withdrawal payouts.
        </p>
        <div className="mt-4">
          <BankInfoForm initialBankInfo={bankInfo} />
        </div>
      </div>

      <div className="material-card p-5">
        <h2 className="text-sm font-semibold text-slate-950">
          Submit Withdrawal Request
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Requests are reviewed before payout.
        </p>
        <div className="mt-4">
          <WithdrawalRequestForm
            availableToWithdraw={cashSummary.availableToWithdraw}
            bankInfo={bankInfo}
          />
        </div>
      </div>

      <div className="material-card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Withdrawal History
          </h2>
        </div>
        {withdrawalRequests.length === 0 ? (
          <div className="px-5 py-5 text-sm text-slate-400">
            No withdrawal requests yet
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {withdrawalRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between gap-3 px-5 py-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-950">
                    {formatCurrency(Number(request.amount))}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatWithdrawalDate(request.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded px-3 py-1 text-[10px] font-semibold uppercase ${withdrawalStatusClass(
                    request.status,
                  )}`}
                >
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
