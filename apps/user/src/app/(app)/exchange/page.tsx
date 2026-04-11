import { redirect } from "next/navigation";
import { ExchangeClient } from "./exchange-client";
import { auth } from "@/lib/auth";
import { getExchangeSnapshot } from "@/lib/exchange-snapshot";

export default async function ExchangePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login?callbackUrl=%2Fexchange");
  }

  const initialData = await getExchangeSnapshot(userId);

  return <ExchangeClient initialData={initialData} />;
}
