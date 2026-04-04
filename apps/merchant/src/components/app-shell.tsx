"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login");

  return (
    <>
      <Sidebar />
      <main
        className={
          isAuthPage
            ? "mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
            : "min-h-screen px-4 pb-10 pt-24 sm:px-6 lg:ml-72 lg:px-10 lg:pt-10"
        }
      >
        {children}
      </main>
    </>
  );
}
