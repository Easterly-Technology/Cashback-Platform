"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function IconBase({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </IconBase>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="m12 3.5 7 4v9l-7 4-7-4v-9l7-4Z" />
      <path d="m5 7.5 7 4 7-4" />
      <path d="M12 11.5v9" />
    </IconBase>
  );
}

function QrIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M5 5h5v5H5z" />
      <path d="M14 5h5v5h-5z" />
      <path d="M5 14h5v5H5z" />
      <path d="M14 14h2" />
      <path d="M18 14h1" />
      <path d="M14 18h5" />
      <path d="M16 16v1" />
    </IconBase>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </IconBase>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path d="M19 9h-4.5A1.5 1.5 0 0 0 13 10.5v2a1.5 1.5 0 0 0 1.5 1.5H19" />
      <path d="M16 11.5h.01" />
    </IconBase>
  );
}

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    description: "Daily pulse",
    icon: HomeIcon,
  },
  {
    href: "/products",
    label: "Products",
    description: "Catalog and stock",
    icon: BoxIcon,
  },
  {
    href: "/qr-codes",
    label: "New Transaction",
    description: "Amount-based QR",
    icon: QrIcon,
  },
  {
    href: "/transactions",
    label: "Transactions",
    description: "Sales history",
    icon: ReceiptIcon,
  },
  {
    href: "/settlements",
    label: "Settlements",
    description: "Fees and payout periods",
    icon: WalletIcon,
  },
] as const;

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-slate-950/72 backdrop-blur-sm transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`merchant-sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col transition-transform lg:w-72 lg:rounded-r-[36px] lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-6 py-6">
          <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-100">
            Commerce
          </span>
          <h1 className="merchant-page-title mt-3 text-2xl font-semibold tracking-tight text-white">
            Merchant Portal
          </h1>
          <p className="mt-2 text-sm leading-6 text-emerald-50/72">
            Payment QR, catalog, and settlement oversight tuned for daily store operations.
          </p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`merchant-nav-link flex items-center gap-3 px-4 py-3 text-sm ${
                  isActive
                    ? "merchant-nav-link-active font-semibold"
                    : "text-emerald-50/80 hover:bg-white/6 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                    isActive
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "bg-white/8 text-emerald-100"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{item.label}</span>
                  <span
                    className={`mt-0.5 block truncate text-xs font-medium ${
                      isActive ? "text-emerald-100/72" : "text-emerald-50/44"
                    }`}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-4">
          <div className="merchant-sidebar-card p-4">
            <p className="text-sm font-semibold text-white">Fast lane</p>
            <p className="mt-1 text-xs leading-5 text-emerald-50/66">
              Enter the next transaction total or jump into stock adjustments before the rush starts.
            </p>
            <div className="mt-3 grid gap-2">
              <Link
                href="/qr-codes"
                onClick={onClose}
                className="material-button-primary inline-flex min-h-10 items-center justify-center px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
              >
                Create Payment QR
              </Link>
              <Link
                href="/products"
                onClick={onClose}
                className="inline-flex min-h-10 items-center justify-center rounded-[18px] border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/12"
              >
                Review Inventory
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-5 text-xs text-emerald-50/44">
          Merchant Portal v0.2
        </div>
      </aside>
    </>
  );
}
