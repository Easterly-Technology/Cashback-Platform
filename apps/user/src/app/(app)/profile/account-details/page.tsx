import { AccountDetailsPageContent } from "@/features/profile/components/account-details-page-content";
import { requireUserId } from "@/lib/require-user";

export default async function AccountDetailsPage() {
  const userId = await requireUserId();

  return <AccountDetailsPageContent userId={userId} />;
}
