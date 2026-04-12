import { requireUserId } from "@/lib/require-user";
import { HomePageContent } from "@/features/home/components/home-page-content";

export default async function UserDashboard() {
  const userId = await requireUserId();

  return <HomePageContent userId={userId} />;
}
