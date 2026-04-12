"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DiscoverIcon,
  HomeIcon,
  ScanIcon,
  TradeIcon,
  TokensIcon,
} from "@/components/icons";

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/discover", label: "Discover", icon: DiscoverIcon },
  { href: "/trade", label: "Trade", icon: TradeIcon },
  { href: "/wallet", label: "Wallet", icon: TokensIcon },
];

export type UserIdentity = {
  name?: string | null;
  email?: string | null;
};

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0b90b] text-[11px] font-bold text-[#0b0e11]">
      {initials}
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#1e2329] bg-[#0b0e11] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-xl items-center px-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-full flex-1 flex-col items-center justify-center gap-1 px-1 text-center text-[11px] leading-none transition-colors ${
                isActive
                  ? "font-semibold text-[#f0b90b]"
                  : "font-medium text-[#848e9c] hover:text-[#eaecef]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function BellIcon({ className }: { className?: string }) {
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
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function TopBar({ user }: { user: UserIdentity | null }) {
  const userName = user?.name?.trim() || "Cashback Member";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#1e2329] bg-[#0b0e11]">
      <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-3">
        <Link
          href="/profile"
          className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[#f0b90b]"
          aria-label="Open profile"
        >
          <UserAvatar name={userName} />
        </Link>

        <Link
          href="/discover"
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md bg-[#1e2329] px-3 text-sm font-medium text-[#848e9c] transition-colors hover:bg-[#2b3139] hover:text-[#eaecef]"
        >
          <SearchIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">Search</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md text-[#eaecef] transition-colors hover:bg-[#1e2329]"
            aria-label="Scan"
          >
            <ScanIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-[#eaecef] transition-colors hover:bg-[#1e2329]"
            aria-label="Notifications"
          >
            <BellIcon className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f0b90b]" />
          </button>
        </div>
      </div>
    </header>
  );
}
