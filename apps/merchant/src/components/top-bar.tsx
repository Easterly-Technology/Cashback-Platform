"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

const pageMap = [
  {
    path: "/transactions",
    title: "Transactions",
    subtitle: "Review recent customer checkouts, settlement fees, and transaction flow.",
    action: { href: "/qr-codes", label: "New Transaction" },
  },
  {
    path: "/settlements",
    title: "Settlements",
    subtitle: "Monitor what is owed to the platform and how recent payout periods are tracking.",
    action: { href: "/transactions", label: "View Sales" },
  },
  {
    path: "/qr-codes",
    title: "New Transaction",
    subtitle: "Enter the final transaction amount, generate a signed QR, and move the customer to confirmation quickly.",
    action: { href: "/transactions", label: "View Sales" },
  },
  {
    path: "/products",
    title: "Products",
    subtitle: "Keep your catalog active, your inventory healthy, and price changes under control.",
    action: { href: "/qr-codes", label: "Create Payment QR" },
  },
  {
    path: "/",
    title: "Dashboard",
    subtitle: "Your sales pulse, stock watchlist, and finance follow-up in one view.",
    action: { href: "/qr-codes", label: "Create Payment QR" },
  },
] as const;

function getPageConfig(pathname: string) {
  for (const config of pageMap) {
    if (config.path === "/" ? pathname === "/" : pathname.startsWith(config.path)) {
      return config;
    }
  }

  return pageMap[pageMap.length - 1];
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-emerald-400 text-[11px] font-bold text-white shadow-sm">
      {initials}
    </div>
  );
}

export type TopBarUser = {
  name?: string | null;
  email?: string | null;
  merchantName?: string | null;
};

export function TopBar({
  user,
  onMenuToggle,
}: {
  user: TopBarUser | null;
  onMenuToggle: () => void;
}) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const page = getPageConfig(pathname);
  const userName = user?.name?.trim() || "Merchant";
  const userEmail = user?.email?.trim() || "";
  const merchantName = user?.merchantName?.trim() || "";
  const todayLabel = new Intl.DateTimeFormat("en-MY", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (!dropdownOpen) {
      return;
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    if (!dropdownOpen) {
      return;
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [dropdownOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 lg:left-72 lg:px-6 lg:pt-4">
      <div className="material-surface flex min-h-[82px] items-center gap-3 rounded-[28px] border border-white/70 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={onMenuToggle}
          className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-white/70 text-slate-700 shadow-sm transition hover:bg-emerald-50 lg:hidden"
          aria-label="Toggle navigation"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="hidden rounded-full border border-emerald-100 bg-emerald-50/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 md:inline-flex">
              Merchant
            </span>
            <p className="merchant-page-title truncate text-lg font-bold text-slate-950 sm:text-[1.35rem]">
              {page.title}
            </p>
            {merchantName ? (
              <span className="material-chip hidden md:inline-flex">{merchantName}</span>
            ) : null}
          </div>
          <p className="mt-1 hidden max-w-3xl text-xs leading-5 text-slate-500 sm:block">
            {page.subtitle}
          </p>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/78 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
            <CalendarIcon className="h-3.5 w-3.5" />
            {todayLabel}
          </span>
          <Link
            href={page.action.href}
            className="material-button-primary inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
          >
            <LightningIcon className="h-4 w-4" />
            {page.action.label}
          </Link>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((open) => !open)}
            className="flex items-center gap-2.5 rounded-[18px] bg-white/56 py-1.5 pl-2 pr-1.5 shadow-sm transition hover:bg-emerald-50"
          >
            <div className="hidden text-right lg:block">
              <p className="max-w-[10rem] truncate text-sm font-semibold text-slate-700">
                {userName}
              </p>
              <p className="text-xs text-slate-400">Store session</p>
            </div>
            <UserAvatar name={userName} />
          </button>

          {dropdownOpen ? (
            <div className="material-surface absolute right-0 top-full mt-2 w-64 rounded-[22px] p-2 shadow-lg">
              <div className="border-b border-slate-100 px-3 py-3">
                <p className="text-sm font-semibold text-slate-950">{userName}</p>
                {userEmail ? <p className="mt-1 text-xs text-slate-500">{userEmail}</p> : null}
                {merchantName ? (
                  <span className="material-chip mt-2 inline-flex">{merchantName}</span>
                ) : null}
              </div>

              <div className="space-y-1 px-1 py-2">
                <Link
                  href="/qr-codes"
                  onClick={() => setDropdownOpen(false)}
                  className="block rounded-[14px] px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Create payment QR
                </Link>
                <Link
                  href="/products"
                  onClick={() => setDropdownOpen(false)}
                  className="block rounded-[14px] px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Review products
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut({ callbackUrl: "/login" })}
                  className="block w-full rounded-[14px] px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
