import {
  DEFAULT_MARKETPLACE_ENABLED,
  DEFAULT_TOKEN_MULTIPLIER,
  DEFAULT_TOKEN_RELEASE_RATE,
} from "@cashback/shared";

type SettingRecord = {
  key: string;
  value: unknown;
  description?: string | null;
};

export const DEFAULT_REBATE_PCT = 10;
export const DEFAULT_SERVICE_FEE_PCT = 3;
export const DEFAULT_MARKETPLACE_PRICE_TIERS = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
];
export const DEFAULT_MARKETPLACE_DISTRIBUTION: Record<string, number> = {
  "0.10": 0.25,
  "0.20": 0.2,
  "0.30": 0.15,
  "0.40": 0.1,
  "0.50": 0.08,
  "0.60": 0.07,
  "0.70": 0.05,
  "0.80": 0.04,
  "0.90": 0.03,
  "1.00": 0.03,
};

function toNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
}

function toNumberArray(value: unknown, fallback: number[]) {
  if (!Array.isArray(value)) return fallback;
  const numbers = value
    .map((entry) => toNumber(entry, Number.NaN))
    .filter((entry) => Number.isFinite(entry));

  return numbers.length > 0 ? numbers : fallback;
}

function toDistribution(
  value: unknown,
  fallback: Record<string, number>,
): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const distribution = Object.entries(value).reduce<Record<string, number>>(
    (accumulator, [key, entry]) => {
      const normalizedKey = Number(key).toFixed(2);
      const normalizedValue = toNumber(entry, Number.NaN);

      if (Number.isFinite(normalizedValue)) {
        accumulator[normalizedKey] = normalizedValue;
      }

      return accumulator;
    },
    {},
  );

  return Object.keys(distribution).length > 0 ? distribution : fallback;
}

export function getAdminPlatformSettingsSnapshot(
  settings: ReadonlyArray<SettingRecord>,
) {
  const settingMap = new Map(settings.map((setting) => [setting.key, setting.value]));

  return {
    defaultRebatePct:
      toNumber(settingMap.get("default_rebate_pct"), DEFAULT_REBATE_PCT / 100) *
      100,
    defaultServiceFeePct:
      toNumber(
        settingMap.get("default_service_fee_pct"),
        DEFAULT_SERVICE_FEE_PCT / 100,
      ) * 100,
    tokenMultiplier: toNumber(
      settingMap.get("token_multiplier"),
      DEFAULT_TOKEN_MULTIPLIER,
    ),
    tokenReleaseRate:
      toNumber(
        settingMap.get("token_release_rate"),
        DEFAULT_TOKEN_RELEASE_RATE,
      ) * 100,
    marketplaceEnabled: toBoolean(
      settingMap.get("marketplace_enabled"),
      DEFAULT_MARKETPLACE_ENABLED,
    ),
    marketplacePriceTiers: toNumberArray(
      settingMap.get("marketplace_price_tiers"),
      DEFAULT_MARKETPLACE_PRICE_TIERS,
    ),
    marketplaceDistribution: toDistribution(
      settingMap.get("marketplace_distribution"),
      DEFAULT_MARKETPLACE_DISTRIBUTION,
    ),
  };
}

export function toPlatformSettingUpdates(
  settings: ReturnType<typeof getAdminPlatformSettingsSnapshot>,
) {
  const distribution = Object.entries(settings.marketplaceDistribution).reduce<
    Record<string, number>
  >((accumulator, [key, value]) => {
    accumulator[Number(key).toFixed(2)] = value;
    return accumulator;
  }, {});

  return [
    {
      key: "default_rebate_pct",
      value: settings.defaultRebatePct / 100,
      description: "Default merchant rebate percentage",
    },
    {
      key: "default_service_fee_pct",
      value: settings.defaultServiceFeePct / 100,
      description: "Default platform service fee percentage",
    },
    {
      key: "token_multiplier",
      value: settings.tokenMultiplier,
      description: "Token entitlement multiplier (spending × N)",
    },
    {
      key: "token_release_rate",
      value: settings.tokenReleaseRate / 100,
      description: "Daily token release rate",
    },
    {
      key: "marketplace_enabled",
      value: settings.marketplaceEnabled,
      description: "Whether the marketplace is active",
    },
    {
      key: "marketplace_price_tiers",
      value: settings.marketplacePriceTiers.map((tier) =>
        Number(tier.toFixed(2)),
      ),
      description: "Marketplace price tiers in yuan",
    },
    {
      key: "marketplace_distribution",
      value: distribution,
      description: "Distribution of token pool across price tiers",
    },
  ] as const;
}
