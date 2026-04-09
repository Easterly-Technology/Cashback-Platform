import Link from "next/link";
import { formatCurrency } from "@cashback/shared";
import type { UserCashSummary } from "@/lib/cash-summary";

interface SummaryHeaderProps {
  totalSpending: number;
  availableTokens: number;
  dailyRelease: number;
  availableToWithdraw: number;
  releaseProgress: number;
}

export function HomeSummaryHeader({
  totalSpending,
  availableTokens,
  dailyRelease,
  availableToWithdraw,
  releaseProgress,
}: SummaryHeaderProps) {
  return (
    <div className="material-hero overflow-hidden px-5 pb-4 pt-5 text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-blue-100/80">
            Total Spending
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {formatCurrency(totalSpending)}
          </p>
        </div>
        <Link
          href="/profile/asset"
          className="shrink-0 rounded-full border border-white/20 bg-white/12 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/18"
        >
          Cash Wallet
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">
          <span className="text-blue-100/70">Tokens:</span>
          <span className="text-amber-200">{availableTokens.toLocaleString()}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">
          <span className="text-blue-100/70">Releasing:</span>
          <span>+{dailyRelease.toLocaleString()}/day</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">
          <span className="text-blue-100/70">Withdraw:</span>
          <span className="text-emerald-200">{formatCurrency(availableToWithdraw)}</span>
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-gradient-to-r from-white/80 to-white/50 transition-all"
          style={{ width: `${releaseProgress}%` }}
        />
      </div>
    </div>
  );
}

export function HomeSummaryHeaderSkeleton() {
  return (
    <div className="material-hero animate-pulse overflow-hidden px-5 pb-4 pt-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-3 w-20 rounded bg-white/15" />
          <div className="mt-2 h-8 w-36 rounded bg-white/20" />
        </div>
        <div className="h-7 w-20 rounded-full bg-white/15" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-7 w-24 rounded-full bg-white/10" />
        <div className="h-7 w-28 rounded-full bg-white/10" />
        <div className="h-7 w-26 rounded-full bg-white/10" />
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-white/10" />
    </div>
  );
}
