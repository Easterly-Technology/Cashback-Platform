import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireUserId(callbackUrl?: string) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    const loginUrl = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login";

    redirect(loginUrl);
  }

  return userId;
}
