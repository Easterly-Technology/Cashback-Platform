import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import { parseBankInfo } from "@cashback/shared";
import { auth } from "@/lib/auth";
import { SubPageHeader } from "../sub-page-header";
import { BankInfoForm } from "../bank-info-form";

export default async function AccountDetailsPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const bankInfo = parseBankInfo(user?.bankInfo ?? null);

  return (
    <div className="space-y-4">
      <SubPageHeader title="Account Details" />

      {/* Contact Details */}
      <div className="material-card p-5">
        <h2 className="text-sm font-semibold text-slate-950">
          Contact Details
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Your personal information on file.
        </p>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Full Name</span>
            <span className="font-semibold text-slate-900">
              {user?.name ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email</span>
            <span className="font-semibold text-slate-900">
              {user?.email ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Phone</span>
            <span className="font-semibold text-slate-900">
              {user?.phone ?? "Not set"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Member Since</span>
            <span className="font-semibold text-slate-900">
              {user?.createdAt.toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Beneficiary & Bank Information */}
      <div className="material-card p-5">
        <h2 className="text-sm font-semibold text-slate-950">
          Beneficiary & Bank Information
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Used for processing your withdrawal requests.
        </p>
        <div className="mt-4">
          <BankInfoForm initialBankInfo={bankInfo} />
        </div>
      </div>
    </div>
  );
}
