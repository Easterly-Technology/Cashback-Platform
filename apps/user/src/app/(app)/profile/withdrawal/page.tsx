import { WithdrawalPageContent } from "@/features/profile/components/withdrawal-page-content";
import { requireUserId } from "@/lib/require-user";

export default async function WithdrawalPage() {
  const userId = await requireUserId();

  return <WithdrawalPageContent userId={userId} />;
}
