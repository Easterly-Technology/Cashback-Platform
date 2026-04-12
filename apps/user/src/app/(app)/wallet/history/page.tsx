import { WalletHistoryPageContent } from "@/features/wallet/components/wallet-history-page-content";
import { requireUserId } from "@/lib/require-user";

export default async function WalletHistoryPage() {
  const userId = await requireUserId();

  return <WalletHistoryPageContent userId={userId} />;
}
