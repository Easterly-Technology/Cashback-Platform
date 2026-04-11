import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@cashback/database";
import { formatCurrency } from "@cashback/shared";
import { auth } from "@/lib/auth";
import { getUserCashSummary } from "@/lib/cash-summary";
import { SignOutButton } from "./sign-out-button";

function ChevronRight() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

interface MenuItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const menuItems: MenuItem[] = [
  {
    href: "/profile/account-details",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 19c1.2-2.6 3.6-4 6.5-4s5.3 1.4 6.5 4" />
      </svg>
    ),
    label: "Account Details",
    description: "Contact details, beneficiary & bank info",
  },
  {
    href: "/profile/security",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        <circle cx="12" cy="16.5" r="1" />
      </svg>
    ),
    label: "Account Security",
    description: "Login password & transaction password",
  },
  {
    href: "/profile/address",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    label: "Address Setting",
    description: "Billing address & shipping address",
  },
  {
    href: "/profile/asset",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="2" y="6" width="20" height="13" rx="2" />
        <path d="M14 12.5a2.5 2.5 0 1 0 0-0.01" />
        <path d="M2 10h20" />
      </svg>
    ),
    label: "Asset",
    description: "Cash wallet, tokens & transaction history",
  },
  {
    href: "/profile/news",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
        <path d="M7 8h6" />
        <path d="M7 12h10" />
        <path d="M7 16h8" />
      </svg>
    ),
    label: "Our News",
    description: "Announcements & updates from admin",
  },
  {
    href: "/profile/documents",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    ),
    label: "Documents",
    description: "Your uploaded documents",
  },
  {
    href: "/profile/policy",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 2 3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    label: "Policy",
    description: "Terms of service & privacy policy",
  },
  {
    href: "/profile/settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1.08H21a2 2 0 0 1 0 4h-.09c-.658.08-1.25.476-1.51 1.08z" />
      </svg>
    ),
    label: "App Setting",
    description: "Language & currency preferences",
  },
];

/* ---------- Skeleton shown while stats load ---------- */
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="material-card px-4 py-3 text-center">
          <div className="mx-auto h-3 w-12 animate-pulse rounded bg-slate-200" />
          <div className="mx-auto mt-2 h-4 w-16 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function UserCardSkeleton() {
  return (
    <div className="material-card flex items-center gap-4 p-5">
      <div className="h-14 w-14 animate-pulse rounded-full bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

/* ---------- Async data components ---------- */
async function UserCard({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  return (
    <div className="material-card p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-lg font-bold text-white shadow-sm">
          {(user?.name ?? "?")
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-slate-950">
            {user?.name}
          </p>
          <p className="truncate text-sm text-slate-500">{user?.email}</p>
          <p className="mt-1 text-xs text-slate-400">
            Member since{" "}
            {user?.createdAt.toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

async function QuickStats({ userId }: { userId: string }) {
  const [transactionStats, orderStats, cashSummary] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.marketplaceOrder.aggregate({
      where: { userId },
      _sum: { cashValue: true },
      _count: true,
    }),
    getUserCashSummary(userId),
  ]);

  const totalSpending = Number(transactionStats._sum.totalAmount ?? 0);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="material-card px-4 py-3 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Spending
        </p>
        <p className="mt-1 text-sm font-bold text-slate-950">
          {formatCurrency(totalSpending)}
        </p>
      </div>
      <div className="material-card px-4 py-3 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Trades
        </p>
        <p className="mt-1 text-sm font-bold text-slate-950">
          {orderStats._count}
        </p>
      </div>
      <div className="material-card px-4 py-3 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Wallet
        </p>
        <p className="mt-1 text-sm font-bold text-emerald-700">
          {formatCurrency(cashSummary.availableToWithdraw)}
        </p>
      </div>
    </div>
  );
}

/* ---------- Main page (renders instantly) ---------- */
export default async function ProfilePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="space-y-4 py-4">
      {/* User Info — streams in */}
      <Suspense fallback={<UserCardSkeleton />}>
        <UserCard userId={userId} />
      </Suspense>

      {/* Quick Stats — streams in */}
      <Suspense fallback={<StatsSkeleton />}>
        <QuickStats userId={userId} />
      </Suspense>

      {/* Menu Items — renders immediately */}
      <div className="material-card overflow-hidden">
        <div className="divide-y divide-slate-100/70">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-950">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.description}
                </p>
              </div>
              <ChevronRight />
            </Link>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <SignOutButton />
    </div>
  );
}
