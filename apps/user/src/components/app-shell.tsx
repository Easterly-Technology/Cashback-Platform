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
    <>
      <TopBar user={initialUser} />
      <main className="mx-auto max-w-xl px-4 pb-28 pt-16 sm:px-5">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
