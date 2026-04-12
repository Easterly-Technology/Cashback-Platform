import { prisma } from "@cashback/database";
import { AccountDetailsForm } from "@/features/profile/components/account-details-form";
import { SubPageHeader } from "@/features/profile/components/sub-page-header";

export async function AccountDetailsPageContent({
  userId,
}: {
  userId: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-4">
      <SubPageHeader title="Account Details" />

      <div className="material-card p-5">
        <h2 className="text-sm font-semibold text-slate-950">
          Contact Details
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Update the information used for your account.
        </p>
        <div className="mt-4">
          <AccountDetailsForm
            initialUser={{
              name: user?.name ?? "",
              email: user?.email ?? "",
              phone: user?.phone ?? "",
            }}
          />
        </div>
      </div>

      <div className="material-card p-5">
        <h2 className="text-sm font-semibold text-slate-950">
          Membership
        </h2>
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-slate-500">Member Since</span>
          <span className="font-semibold text-slate-900">
            {user?.createdAt.toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            }) ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
