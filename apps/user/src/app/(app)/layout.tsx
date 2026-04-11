import AppShell from "@/components/app-shell";
import { auth } from "@/lib/auth";

export default async function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const initialUser = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      }
    : null;

  return <AppShell initialUser={initialUser}>{children}</AppShell>;
}
