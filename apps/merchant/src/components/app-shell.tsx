"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopBar, type TopBarUser } from "@/components/top-bar";

export default function AppShell({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: TopBarUser | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="merchant-shell">
      <TopBar
        user={initialUser ?? null}
        onMenuToggle={() => setSidebarOpen((v) => !v)}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className="mx-auto min-h-screen max-w-[1600px] px-4 pb-12 pt-24 sm:px-6 lg:ml-72 lg:px-8 lg:pt-24 xl:px-10"
      >
        {children}
      </main>
    </div>
  );
}
