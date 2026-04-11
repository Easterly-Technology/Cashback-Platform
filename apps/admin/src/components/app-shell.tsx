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
    <>
      <TopBar
        user={initialUser ?? null}
        onMenuToggle={() => setSidebarOpen((v) => !v)}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={initialUser?.role ?? null}
      />
      <main
        className="min-h-screen px-4 pb-10 pt-20 sm:px-6 lg:ml-72 lg:px-10 lg:pt-20"
      >
        {children}
      </main>
    </>
  );
}
