"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  MarketplaceIcon,
  ExchangeIcon,
  TokensIcon,
  ProfileIcon,
} from "@/components/icons";

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/marketplace", label: "Marketplace", icon: MarketplaceIcon },
  { href: "/exchange", label: "Exchange", icon: ExchangeIcon },
  { href: "/tokens", label: "Tokens", icon: TokensIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
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
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-[11px] font-bold text-white shadow-sm">
      {initials}
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="material-surface mx-auto flex max-w-xl items-center gap-1 rounded-[24px] px-1.5 py-1.5">
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
              className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-1 text-center text-[11px] leading-none transition-all ${
                isActive
                  ? "material-button-tonal font-semibold shadow-sm"
                  : "font-medium text-slate-500 hover:bg-white/70 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
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

export function TopBar({ user }: { user: UserIdentity | null }) {
  const userName = user?.name?.trim() || "Cashback Member";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-2.5 pt-2.5">
      <div className="material-surface mx-auto flex max-w-xl items-center justify-between rounded-[24px] px-3.5 py-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 shadow-sm">
            <span className="text-sm font-bold text-white">CB</span>
          </div>
          <p className="text-sm font-bold tracking-tight text-slate-950">
            Cashback
          </p>
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-[14px] text-slate-500 transition hover:bg-blue-50 hover:text-slate-700"
            aria-label="Notifications"
          >
            <BellIcon className="h-[18px] w-[18px]" />
          </button>
          <Link href="/profile">
            <UserAvatar name={userName} />
          </Link>
        </div>
      </div>
    </header>
  );
}
