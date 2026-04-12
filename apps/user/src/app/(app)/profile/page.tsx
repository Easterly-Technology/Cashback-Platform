import { ProfileMenu } from "@/features/profile/components/profile-menu";
import { requireUserId } from "@/lib/require-user";

export default async function ProfilePage() {
  await requireUserId();

  return <ProfileMenu />;
}
