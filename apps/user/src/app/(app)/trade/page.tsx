import { TradeClient } from "@/features/trade/components/trade-client";
import { getTradeSnapshot } from "@/features/trade/server/trade-snapshot";
import { requireUserId } from "@/lib/require-user";

export default async function TradePage() {
  const userId = await requireUserId("/trade");
  const initialData = await getTradeSnapshot(userId);

  return <TradeClient initialData={initialData} />;
}
