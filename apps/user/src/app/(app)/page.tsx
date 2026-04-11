import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserDashboardSummary } from "@/lib/dashboard-summary";
import {
  HomeSummaryHeader,
} from "@/components/home/home-summary-header";
import { HomeTabBar } from "@/components/home/home-tab-bar";
import { TabOverview } from "@/components/home/tab-overview";
import { TabActivity } from "@/components/home/tab-activity";
import { TabRewards } from "@/components/home/tab-rewards";
import { TabWallet } from "@/components/home/tab-wallet";
import {
  OverviewSkeleton,
  ActivitySkeleton,
  RewardsSkeleton,
  WalletSkeleton,
} from "@/components/home/tab-skeletons";

const VALID_TABS = ["overview", "activity", "rewards", "wallet"] as const;

export default async function UserDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  const params = await searchParams;
  const tab = VALID_TABS.includes(params.tab as (typeof VALID_TABS)[number])
    ? (params.tab as (typeof VALID_TABS)[number])
    : "overview";

  const summary = await getUserDashboardSummary(userId);

  return (
    <div className="space-y-3 py-4">
      <HomeSummaryHeader
        totalSpending={summary.totalSpending}
        availableTokens={summary.availableTokens}
        dailyRelease={summary.dailyRelease}
        availableToWithdraw={summary.cashSummary.availableToWithdraw}
        releaseProgress={summary.releaseProgress}
      />

      <HomeTabBar activeTab={tab} />

      {tab === "overview" && (
        <Suspense fallback={<OverviewSkeleton />}>
          <TabOverview summary={summary} userId={userId} />
        </Suspense>
      )}
      {tab === "activity" && (
        <Suspense fallback={<ActivitySkeleton />}>
          <TabActivity userId={userId} />
        </Suspense>
      )}
      {tab === "rewards" && (
        <Suspense fallback={<RewardsSkeleton />}>
          <TabRewards summary={summary} userId={userId} />
        </Suspense>
      )}
      {tab === "wallet" && (
        <Suspense fallback={<WalletSkeleton />}>
          <TabWallet userId={userId} cashSummary={summary.cashSummary} />
        </Suspense>
      )}
    </div>
  );
}
