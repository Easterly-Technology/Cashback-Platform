import { AddressPageContent } from "@/features/profile/components/address-page-content";
import { requireUserId } from "@/lib/require-user";

export default async function AddressPage() {
  await requireUserId();

  return <AddressPageContent />;
}
