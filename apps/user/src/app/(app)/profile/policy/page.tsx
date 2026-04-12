import { PolicyPageContent } from "@/features/profile/components/policy-page-content";
import { requireUserId } from "@/lib/require-user";

export default async function PolicyPage() {
  await requireUserId();

  return <PolicyPageContent />;
}
