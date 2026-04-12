import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "./sign-out-button";

function ChevronRight() {
  return (
    <svg
      className="h-4 w-4 text-[#848e9c]"
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

type MenuItem = {
  href: string;
  icon: ReactNode;
  label: string;
  description: string;
};

const menuItems: MenuItem[] = [
  {
    href: "/profile/account-details",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 19c1.2-2.6 3.6-4 6.5-4s5.3 1.4 6.5 4" />
      </svg>
    ),
    label: "Account Details",
    description: "Full name, email and phone number",
  },
  {
    href: "/profile/withdrawal",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M15 15h2" />
      </svg>
    ),
    label: "Request Withdrawal",
    description: "Payout details, request form and history",
  },
  {
    href: "/profile/security",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        <circle cx="12" cy="16.5" r="1" />
      </svg>
    ),
    label: "Account Security",
    description: "Login password and transaction password",
  },
  {
    href: "/profile/address",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    label: "Address Setting",
    description: "Billing address and shipping address",
  },
  {
    href: "/profile/news",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
        <path d="M7 8h6" />
        <path d="M7 12h10" />
        <path d="M7 16h8" />
      </svg>
    ),
    label: "Our News",
    description: "Announcements and updates from admin",
  },
  {
    href: "/profile/documents",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
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
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M12 2 3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    label: "Policy",
    description: "Terms of service and privacy policy",
  },
  {
    href: "/profile/settings",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1.08H21a2 2 0 0 1 0 4h-.09c-.658.08-1.25.476-1.51 1.08z" />
      </svg>
    ),
    label: "App Setting",
    description: "Language and currency preferences",
  },
];

export function ProfileMenu() {
  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-3 bg-[#0b0e11] pb-8 text-[#eaecef]">
      <div className="rounded-lg border border-[#1e2329] bg-[#181a20] p-4">
        <p className="text-xs font-semibold uppercase text-[#848e9c]">
          Avatar Menu
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white">
          Profile
        </h1>
        <p className="mt-1 text-xs text-[#848e9c]">
          Account, payout, security and app preferences.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#1e2329] bg-[#181a20]">
        <div className="divide-y divide-[#1e2329]">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-[#1e2329]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2b3139] text-[#f0b90b]">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-[#848e9c]">
                  {item.description}
                </p>
              </div>
              <ChevronRight />
            </Link>
          ))}
        </div>
      </div>

      <SignOutButton />
    </div>
  );
}
