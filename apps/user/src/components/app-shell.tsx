"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNav, TopBar, type UserIdentity } from "@/components/nav";

function isAuthPage(pathname: string) {
  return pathname === "/login" || pathname === "/register";
}

function isScanPage(pathname: string) {
  return pathname.startsWith("/scan/");
}

export default function AppShell({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: UserIdentity | null;
}) {
  const pathname = usePathname();
  const authPage = isAuthPage(pathname);
  const scanPage = isScanPage(pathname);
  const hideChrome = authPage || scanPage;

  const mainClass = authPage
    ? "mx-auto max-w-5xl px-4 py-8 sm:px-5 lg:py-12"
    : scanPage
      ? "mx-auto max-w-2xl px-4 py-6 sm:px-5"
      : "mx-auto max-w-xl px-4 pb-28 pt-16 sm:px-5";

  return (
    <>
      {!hideChrome ? <TopBar user={initialUser} /> : null}
      <main className={mainClass}>{children}</main>
      {!hideChrome ? <BottomNav /> : null}
    </>
  );
}
