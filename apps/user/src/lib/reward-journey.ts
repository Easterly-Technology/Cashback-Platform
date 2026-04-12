import {
  calculateDailyRelease,
  daysUntilFullRelease,
} from "@cashback/shared";

export type JourneyStepStatus = "complete" | "current" | "upcoming";

export interface RewardJourneyInput {
  totalSpending: number;
  entitledTokens: number;
  releasedTokens: number;
  availableTokens: number;
  availableToWithdraw: number;
  dailyRelease: number;
  tradeCount?: number;
  pendingWithdrawalCount?: number;
  completedWithdrawalCount?: number;
}

export interface NextRewardAction {
  href: string;
  title: string;
  description: string;
  cta: string;
}

export interface RewardJourneyStep {
  href: string;
  label: string;
  description: string;
  status: JourneyStepStatus;
}

export interface ReleaseForecast {
  nextRelease: number;
  nextSevenDays: number;
  nextThirtyDays: number;
  remainingTokens: number;
  daysRemaining: number;
}

export function formatTokenAmount(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: value < 10 ? 2 : 0,
  });
}

export function getNextRewardAction(
  input: RewardJourneyInput,
): NextRewardAction {
  if (input.availableToWithdraw > 0) {
    return {
      href: "/profile/withdrawal",
      title: "Withdraw ready cash",
      description: `You have RM${input.availableToWithdraw.toLocaleString(
        undefined,
        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
      )} available after selling tokens.`,
      cta: "Withdraw",
    };
  }

  if ((input.pendingWithdrawalCount ?? 0) > 0) {
    return {
      href: "/profile/withdrawal",
      title: "Track your withdrawal",
      description:
        "Your cash request is in progress. Check the wallet for the latest status.",
      cta: "View status",
    };
  }

  if (input.availableTokens > 0) {
    return {
      href: "/trade",
      title: "Trade released tokens",
      description: `${formatTokenAmount(
        input.availableTokens,
      )} tokens are ready to sell for cash value.`,
      cta: "Trade",
    };
  }

  if (
    input.entitledTokens > input.releasedTokens &&
    input.dailyRelease > 0
  ) {
    return {
      href: "/wallet",
      title: "Track the next release",
      description: `About ${formatTokenAmount(
        input.dailyRelease,
      )} tokens are expected in the next daily release.`,
      cta: "Track",
    };
  }

  if (input.totalSpending <= 0) {
    return {
      href: "/discover",
      title: "Start your cashback journey",
      description:
        "Discover partners, shop in store, then confirm the merchant QR to earn tokens.",
      cta: "Discover",
    };
  }

  if ((input.completedWithdrawalCount ?? 0) > 0) {
    return {
      href: "/discover",
      title: "Earn on the next purchase",
      description:
        "Your previous reward cycle is complete. Make another purchase to grow the next one.",
      cta: "Shop again",
    };
  }

  return {
    href: "/wallet/history",
    title: "Review reward activity",
    description:
      "Check purchases, token releases, trades, and cash movement in one timeline.",
    cta: "Review",
  };
}

export function buildRewardJourney(
  input: RewardJourneyInput,
): RewardJourneyStep[] {
  const currentIndex = getCurrentJourneyIndex(input);
  const steps = [
    {
      href: "/discover",
      label: "Shop",
      description: "Pay at a participating merchant.",
    },
    {
      href: "/wallet/history",
      label: "Confirm",
      description: "Scan the merchant QR and save the purchase.",
    },
    {
      href: "/wallet",
      label: "Release",
      description: "Tokens become usable day by day.",
    },
    {
      href: "/trade",
      label: "Cash out",
      description: "Sell tokens, then request withdrawal.",
    },
  ];

  return steps.map((step, index) => ({
    ...step,
    status:
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));
}

export function getReleaseForecast({
  entitledTokens,
  releasedTokens,
  releaseRate,
}: {
  entitledTokens: number;
  releasedTokens: number;
  releaseRate: number;
}): ReleaseForecast {
  let projectedReleased = releasedTokens;
  let nextSevenDays = 0;
  let nextThirtyDays = 0;

  for (let day = 1; day <= 30; day += 1) {
    const release = calculateDailyRelease(
      entitledTokens,
      projectedReleased,
      releaseRate,
    ).toNumber();

    projectedReleased += release;

    if (day <= 7) {
      nextSevenDays += release;
    }

    nextThirtyDays += release;

    if (release <= 0) {
      break;
    }
  }

  return {
    nextRelease: calculateDailyRelease(
      entitledTokens,
      releasedTokens,
      releaseRate,
    ).toNumber(),
    nextSevenDays,
    nextThirtyDays,
    remainingTokens: Math.max(entitledTokens - releasedTokens, 0),
    daysRemaining: daysUntilFullRelease(
      entitledTokens,
      releasedTokens,
      releaseRate,
    ),
  };
}

function getCurrentJourneyIndex(input: RewardJourneyInput): number {
  if (
    (input.completedWithdrawalCount ?? 0) > 0 &&
    input.availableToWithdraw <= 0 &&
    input.availableTokens <= 0 &&
    (input.pendingWithdrawalCount ?? 0) === 0 &&
    input.entitledTokens <= input.releasedTokens
  ) {
    return 4;
  }

  if (
    input.availableToWithdraw > 0 ||
    (input.pendingWithdrawalCount ?? 0) > 0 ||
    (input.completedWithdrawalCount ?? 0) > 0
  ) {
    return 3;
  }

  if (input.availableTokens > 0 || (input.tradeCount ?? 0) > 0) {
    return 3;
  }

  if (
    input.entitledTokens > input.releasedTokens &&
    input.dailyRelease > 0
  ) {
    return 2;
  }

  if (input.totalSpending > 0) {
    return 2;
  }

  return 0;
}
