"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";

/* ── inline icons (24×24 stroke) ────────────────────────── */

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
      <path d="m21 21-4.35-4.35" />
    </svg>
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

/* ── title map ───────────────────────────────────────────── */

const titleMap: [string, string][] = [
  ["/search", "Search"],
  ["/announcements", "Announcements"],
  ["/settlements", "Settlements"],
  ["/ops", "Operations Inbox"],
  ["/withdrawals", "Withdrawals"],
  ["/transactions", "Transactions"],
  ["/marketplace", "Exchange"],
  ["/audit-log", "Audit Log"],
  ["/merchants", "Merchants"],
  ["/settings", "Settings"],
  ["/tokens", "Tokens"],
  ["/users", "Users"],
  ["/", "Dashboard"],
];

function getPageTitle(pathname: string) {
  for (const [path, title] of titleMap) {
    if (path === "/" ? pathname === "/" : pathname.startsWith(path)) {
      return title;
    }
  }
  return "Dashboard";
}

/* ── user avatar ─────────────────────────────────────────── */

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-400 text-[11px] font-bold text-white shadow-sm">
      {initials}
    </div>
  );
}

/* ── types ────────────────────────────────────────────────── */

export type TopBarUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

/* ── component ───────────────────────────────────────────── */

export function TopBar({
  user,
  onMenuToggle,
}: {
  user: TopBarUser | null;
  onMenuToggle: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageTitle = getPageTitle(pathname);
  const userName = user?.name?.trim() || "Admin";
  const userEmail = user?.email?.trim() || "";
  const userRole = user?.role?.trim() || "admin";
  const currentSearch = searchParams.get("q") ?? "";

  // close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [dropdownOpen]);

  // close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    if (dropdownOpen) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [dropdownOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 lg:left-72 lg:px-6 lg:pt-4">
      <div className="material-surface flex items-center gap-3 rounded-[24px] px-4 py-2.5">
        {/* hamburger — mobile only */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-[14px] transition hover:bg-indigo-50 lg:hidden"
          aria-label="Toggle navigation"
        >
          <MenuIcon className="h-5 w-5 text-slate-700" />
        </button>

        {/* page title */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-tight text-slate-950">
            {pageTitle}
          </p>
        </div>

        {/* right actions */}
        <div className="flex items-center gap-1.5">
          <form
            action="/search"
            method="get"
            className="hidden items-center gap-2 rounded-[18px] border border-slate-200 bg-white px-3 py-1.5 sm:flex"
          >
            <SearchIcon className="h-[18px] w-[18px] text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={currentSearch}
              placeholder="Search users, merchants, transactions..."
              className="w-56 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </form>

          <Link
            href="/search"
            className="flex h-9 w-9 items-center justify-center rounded-[14px] text-slate-500 transition hover:bg-indigo-50 hover:text-slate-700 sm:hidden"
            aria-label="Search"
          >
            <SearchIcon className="h-[18px] w-[18px]" />
          </Link>

          {/* bell */}
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-[14px] text-slate-500 transition hover:bg-indigo-50 hover:text-slate-700"
            aria-label="Notifications"
          >
            <BellIcon className="h-[18px] w-[18px]" />
          </button>

          {/* user menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-[18px] py-1.5 pl-3 pr-1.5 transition hover:bg-indigo-50"
            >
              <span className="hidden text-sm font-semibold text-slate-700 lg:block">
                {userName}
              </span>
              <UserAvatar name={userName} />
            </button>

            {dropdownOpen && (
              <div className="material-surface absolute right-0 top-full mt-2 w-56 rounded-[18px] p-2 shadow-lg">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-950">
                    {userName}
                  </p>
                  {userEmail && (
                    <p className="text-xs text-slate-500">{userEmail}</p>
                  )}
                  <span className="material-chip mt-1.5">{userRole}</span>
                </div>
                <div className="pt-1.5">
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="block rounded-[14px] px-3 py-2 text-sm text-slate-600 transition hover:bg-indigo-50"
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => void signOut({ callbackUrl: "/login" })}
                    className="block w-full rounded-[14px] px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
