import AppShell from "@/components/app-shell";
import { auth } from "@/lib/auth";

export default async function MerchantAppLayout({
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
          ((session.user as Record<string, unknown>).merchantName as string) ??
          null,
      }
    : null;

  return <AppShell initialUser={initialUser}>{children}</AppShell>;
}
