import { SettingsPageContent } from "@/features/profile/components/settings-page-content";
import { requireUserId } from "@/lib/require-user";

export default async function SettingsPage() {
  await requireUserId();

  return <SettingsPageContent />;
}
