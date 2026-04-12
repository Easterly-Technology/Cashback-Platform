import Link from "next/link";
import { formatCurrency } from "@cashback/shared";
import {
  TradeIcon,
  DiscoverIcon,
  HistoryIcon,
  TokensIcon,
} from "@/components/icons";

interface SummaryHeaderProps {
  estimatedAssets: number;
  availableTokens: number;
  dailyRelease: number;
  cashWallet: number;
  availableToWithdraw: number;
}

const walletActions = [
  { href: "/discover", label: "Discover", icon: DiscoverIcon },
  { href: "/trade", label: "Trade", icon: TradeIcon },
  { href: "/profile/withdrawal", label: "Withdraw", icon: TokensIcon },
  { href: "/wallet/history", label: "History", icon: HistoryIcon },
];

export function HomeSummaryHeader({
  estimatedAssets,
  availableTokens,
  dailyRelease,
  cashWallet,
  availableToWithdraw,
}: SummaryHeaderProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#1e2329] bg-[#181a20]">
      <div className="border-b border-[#1e2329] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/icon.svg"
              alt=""
              className="h-10 w-10 shrink-0 rounded-md bg-[#f0b90b] p-2"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase text-[#848e9c]">
                Estimated Assets
              </p>
              <p className="mt-1 truncate text-3xl font-bold text-white">
                {formatCurrency(estimatedAssets)}
              </p>
              <p className="mt-1 text-xs text-[#848e9c]">
                Cash + CBT at market value
              </p>
            </div>
          </div>
          <Link
            href="/wallet"
            className="shrink-0 rounded-md bg-[#f0b90b] px-3 py-2 text-xs font-bold text-[#181a20] transition hover:bg-[#f8d33a]"
          >
            Wallet
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-[#2b3139] bg-[#0b0e11] px-3 py-2">
            <p className="text-[10px] font-medium text-[#848e9c]">
              Cash Wallet
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-white">
              {formatCurrency(cashWallet)}
            </p>
          </div>
          <div className="rounded-md border border-[#2b3139] bg-[#0b0e11] px-3 py-2">
            <p className="text-[10px] font-medium text-[#848e9c]">
              CBT Wallet
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-[#f0b90b]">
              {availableTokens.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[10px] text-[#0ecb81]">
              +{dailyRelease.toLocaleString()}/day
            </p>
          </div>
          <div className="rounded-md border border-[#2b3139] bg-[#0b0e11] px-3 py-2">
            <p className="text-[10px] font-medium text-[#848e9c]">
              Withdrawable
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-white">
              {formatCurrency(availableToWithdraw)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 divide-x divide-[#1e2329]">
        {walletActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex min-h-20 flex-col items-center justify-center gap-2 px-2 py-3 text-center transition hover:bg-[#1e2329]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#2b3139] text-[#f0b90b]">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold text-[#eaecef]">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function HomeSummaryHeaderSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border border-[#1e2329] bg-[#181a20]">
      <div className="px-4 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-[#2b3139]" />
            <div>
              <div className="h-3 w-24 rounded bg-[#2b3139]" />
              <div className="mt-2 h-8 w-36 rounded bg-[#2b3139]" />
            </div>
          </div>
          <div className="h-8 w-16 rounded-md bg-[#2b3139]" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-14 rounded-md bg-[#10141a]" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 divide-x divide-[#1e2329] border-t border-[#1e2329]">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="flex min-h-20 items-center justify-center">
            <div className="h-9 w-9 rounded-md bg-[#2b3139]" />
          </div>
        ))}
      </div>
    </div>
  );
}
