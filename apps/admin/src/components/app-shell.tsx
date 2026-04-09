"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { TopBar, type TopBarUser } from "@/components/top-bar";

export default function AppShell({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: TopBarUser | null;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <TopBar
        user={initialUser ?? null}
        onMenuToggle={() => setSidebarOpen((v) => !v)}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className={
          isAuthPage
            ? "mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
            : "min-h-screen px-4 pb-10 pt-20 sm:px-6 lg:ml-72 lg:px-10 lg:pt-20"
        }
      >
        {children}
      </main>
    </>
  );
}
