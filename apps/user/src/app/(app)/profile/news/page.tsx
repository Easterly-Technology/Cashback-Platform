import { NewsPageContent } from "@/features/profile/components/news-page-content";
import { requireUserId } from "@/lib/require-user";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  await requireUserId();

  return <NewsPageContent />;
}
