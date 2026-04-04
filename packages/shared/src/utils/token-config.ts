export const DEFAULT_TOKEN_MULTIPLIER = 2;
export const DEFAULT_TOKEN_RELEASE_RATE = 0.005;
export const DEFAULT_MARKETPLACE_ENABLED = true;

export type TokenSettingsSnapshot = {
  multiplier: number;
  releaseRate: number;
  marketplaceEnabled: boolean;
};

type SettingRecord = {
  key: string;
  value: unknown;
};

function toFiniteNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toPositiveNumber(value: unknown, fallback: number) {
  const parsed = toFiniteNumber(value, fallback);
  return parsed > 0 ? parsed : fallback;
}

function toRate(value: unknown, fallback: number) {
  const parsed = toFiniteNumber(value, fallback);
  return parsed > 0 && parsed <= 1 ? parsed : fallback;
}

function toBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  return fallback;
}

export function getTokenSettingsSnapshot(
  settings: SettingRecord[],
): TokenSettingsSnapshot {
  const settingMap = new Map(settings.map((setting) => [setting.key, setting.value]));

  return {
    multiplier: toPositiveNumber(
      settingMap.get("token_multiplier"),
      DEFAULT_TOKEN_MULTIPLIER,
    ),
    releaseRate: toRate(
      settingMap.get("token_release_rate"),
      DEFAULT_TOKEN_RELEASE_RATE,
    ),
    marketplaceEnabled: toBoolean(
      settingMap.get("marketplace_enabled"),
      DEFAULT_MARKETPLACE_ENABLED,
    ),
  };
}
