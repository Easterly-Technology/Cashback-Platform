import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import AppShell from "@/components/app-shell";
import { auth } from "@/lib/auth";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Merchant Portal - Cashback Platform",
  description: "Manage your store on the Cashback Platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const initialUser = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        merchantName:
          (session.user as Record<string, unknown>).merchantName as string ??
          null,
      }
    : null;

  return (
    <html lang="en">
      <body
        className={`${jakarta.variable} ${display.variable} ${jakarta.className} text-slate-900 antialiased`}
      >
        <AppShell initialUser={initialUser}>{children}</AppShell>
      </body>
    </html>
  );
}
