import { DocumentsPageContent } from "@/features/profile/components/documents-page-content";
import { requireUserId } from "@/lib/require-user";

export default async function DocumentsPage() {
  await requireUserId();

  return <DocumentsPageContent />;
}
