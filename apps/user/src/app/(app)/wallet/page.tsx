import { WalletPageContent } from "@/features/wallet/components/wallet-page-content";
import { requireUserId } from "@/lib/require-user";

export default async function WalletPage() {
  const userId = await requireUserId();

  return <WalletPageContent userId={userId} />;
}
