import { DiscoverPageContent } from "@/features/discover/components/discover-page-content";
import { requireUserId } from "@/lib/require-user";

export default async function DiscoverPage() {
  await requireUserId();

  return <DiscoverPageContent />;
}
