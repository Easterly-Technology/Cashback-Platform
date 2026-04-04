"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/merchants", label: "Merchants" },
  { href: "/users", label: "Users" },
  { href: "/transactions", label: "Transactions" },
  { href: "/tokens", label: "Tokens" },
  { href: "/marketplace", label: "Exchange" },
  { href: "/audit-log", label: "Audit Log" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/login")) {
    return null;
  }

  const navLinks = navItems.map((item) => {
    const isActive =
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={`block rounded-[18px] border px-4 py-3 text-sm transition-all ${
          isActive
            ? "border-indigo-100 bg-indigo-50 font-semibold text-indigo-700 shadow-sm"
            : "border-transparent text-slate-600 hover:bg-white/80 hover:text-slate-950"
        }`}
      >
        {item.label}
      </Link>
    );
  });

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 px-4 pt-4 lg:hidden">
        <div className="material-surface flex items-center justify-between rounded-[28px] px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-700/80">
              Cashback
            </p>
            <p className="text-sm font-semibold text-slate-950">Admin Portal</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="material-button-tonal px-4 py-2 text-sm font-semibold"
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px] transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/70 bg-white/90 text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.28)] backdrop-blur-2xl transition-transform lg:w-72 lg:rounded-r-[32px] lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-slate-200/80 px-6 py-6">
          <span className="material-chip">Operations</span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Cashback Admin
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Platform controls, audit trails, and oversight.
          </p>
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5">
          {navLinks}
        </nav>
        <div className="border-t border-slate-200/80 px-6 py-5 text-xs text-slate-500">
          Platform v0.1
        </div>
      </aside>
    </>
  );
}
