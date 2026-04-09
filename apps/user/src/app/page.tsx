import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import {
  calculateDailyRelease,
  getTokenSettingsSnapshot,
} from "@cashback/shared";
import { auth } from "@/lib/auth";
import { getUserCashSummary } from "@/lib/cash-summary";
import {
  HomeSummaryHeader,
  HomeSummaryHeaderSkeleton,
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

  // Fetch core data once at page level so the header doesn't re-fetch on tab switch
  const [entitlement, settings, cashSummary] = await Promise.all([
    prisma.userTokenEntitlement.findUnique({ where: { userId } }),
    prisma.platformSetting.findMany({
      where: {
        key: { in: ["token_multiplier", "token_release_rate"] },
      },
    }),
    getUserCashSummary(userId),
  ]);

  const tokenSettings = getTokenSettingsSnapshot(settings);
  const entitled = Number(entitlement?.entitledTokens ?? 0);
  const released = Number(entitlement?.releasedTokens ?? 0);
  const available = Number(entitlement?.availableTokens ?? 0);
  const totalSpending = Number(entitlement?.totalSpending ?? 0);
  const dailyRelease = calculateDailyRelease(
    entitled,
    released,
    tokenSettings.releaseRate,
  ).toNumber();
  const releaseProgress =
    entitled > 0 ? Math.min((released / entitled) * 100, 100) : 0;

  return (
    <div className="space-y-3 py-4">
      <HomeSummaryHeader
        totalSpending={totalSpending}
        availableTokens={available}
        dailyRelease={dailyRelease}
        availableToWithdraw={cashSummary.availableToWithdraw}
        releaseProgress={releaseProgress}
      />

      <HomeTabBar activeTab={tab} />

      {tab === "overview" && (
        <Suspense fallback={<OverviewSkeleton />}>
          <TabOverview userId={userId} />
        </Suspense>
      )}
      {tab === "activity" && (
        <Suspense fallback={<ActivitySkeleton />}>
          <TabActivity userId={userId} />
        </Suspense>
      )}
      {tab === "rewards" && (
        <Suspense fallback={<RewardsSkeleton />}>
          <TabRewards userId={userId} />
        </Suspense>
      )}
      {tab === "wallet" && (
        <Suspense fallback={<WalletSkeleton />}>
          <TabWallet userId={userId} cashSummary={cashSummary} />
        </Suspense>
      )}
    </div>
  );
}
