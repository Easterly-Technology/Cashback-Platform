import { SecurityPageContent } from "@/features/profile/components/security-page-content";
import { requireUserId } from "@/lib/require-user";

export default async function SecurityPage() {
  await requireUserId();

  return <SecurityPageContent />;
}
