"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/qr-codes", label: "New Transaction" },
  { href: "/transactions", label: "Transactions" },
  { href: "/settlements", label: "Settlements" },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

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
        onClick={onClose}
        className={`block rounded-[18px] border px-4 py-3 text-sm transition-all ${
          isActive
            ? "border-emerald-100 bg-emerald-50 font-semibold text-emerald-700 shadow-sm"
            : "border-transparent text-slate-600 hover:bg-white/80 hover:text-slate-950"
        }`}
      >
        {item.label}
      </Link>
    );
  });

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-slate-950/72 backdrop-blur-sm transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/70 bg-white/95 text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.32)] backdrop-blur-xl transition-transform lg:w-72 lg:rounded-r-[32px] lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-emerald-100 px-6 py-6">
          <span className="material-chip">Commerce</span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Merchant Portal
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Product, sales, and settlement control in one place.
          </p>
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5">
          {navLinks}
        </nav>
        <div className="border-t border-emerald-100 px-6 py-5 text-xs text-slate-500">
          Merchant Portal v0.1
        </div>
      </aside>
    </>
  );
}
