"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

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

function IconBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3.5 10.5 12 4l8.5 6.5" />
      <path d="M6.5 9.5v10h11v-10" />
      <path d="M10 19.5v-5h4v5" />
    </IconBase>
  );
}

function MarketplaceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 8.5h16" />
      <path d="m6 8.5 1.2-3h9.6l1.2 3" />
      <path d="M5.5 8.5v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9" />
      <path d="M9 12.5h6" />
    </IconBase>
  );
}

function ExchangeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M7 7.5h10" />
      <path d="m14 4.5 3 3-3 3" />
      <path d="M17 16.5H7" />
      <path d="m10 13.5-3 3 3 3" />
    </IconBase>
  );
}

function TokensIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M9.5 10.5c0-1.1 1-2 2.5-2s2.5.7 2.5 1.8c0 2.8-5 1.1-5 3.9 0 1.1 1.1 1.8 2.5 1.8 1.7 0 2.7-.9 2.7-2" />
    </IconBase>
  );
}

function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8.5" r="3.25" />
      <path d="M5.5 19c1.2-2.6 3.6-4 6.5-4s5.3 1.4 6.5 4" />
    </IconBase>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-xs font-bold text-white shadow-sm">
      {initials}
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isScanPage = pathname.startsWith("/scan/");

  if (isAuthPage || isScanPage) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="material-surface mx-auto flex max-w-xl items-center gap-1 rounded-[28px] px-2 py-2">
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
              className={`flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-1 text-center text-[11px] leading-none transition-all ${
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

export function TopBar({ user }: { user: UserIdentity | null }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isScanPage = pathname.startsWith("/scan/");

  if (isAuthPage || isScanPage) {
    return null;
  }

  const userName = user?.name?.trim() || "Cashback Member";
  const userEmail = user?.email?.trim() || "Signed in";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div className="material-surface mx-auto flex max-w-xl items-center justify-between rounded-[28px] px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 shadow-sm">
            <span className="text-sm font-bold text-white">CB</span>
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-950">
              Cashback
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700/70">
              Rewards
            </p>
          </div>
        </Link>
        <Link href="/profile" className="flex items-center gap-3">
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-semibold text-slate-950">
              {userName}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {userEmail}
            </p>
          </div>
          <UserAvatar name={userName} />
        </Link>
      </div>
    </header>
  );
}
