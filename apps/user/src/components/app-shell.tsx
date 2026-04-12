"use client";

import type { ReactNode } from "react";
import { BottomNav, TopBar, type UserIdentity } from "@/components/nav";

export default function AppShell({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: UserIdentity | null;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0e11] text-[#eaecef]">
      <TopBar user={initialUser} />
      <main className="mx-auto min-h-screen max-w-xl bg-[#0b0e11] px-3 pt-14 sm:border-x sm:border-[#1e2329] sm:px-4">
        <div className="min-h-[calc(100vh-8.5rem)] bg-[#0b0e11] pb-0 pt-3 text-[#eaecef]">
          {children}
        </div>
        <div className="h-24 bg-[#0b0e11]" aria-hidden="true" />
      </main>
      <BottomNav />
    </div>
  );
}
