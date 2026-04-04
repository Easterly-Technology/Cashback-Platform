import Decimal from "decimal.js";

// Configure Decimal.js for financial math
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

function assertPositiveFiniteNumber(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number`);
  }
}

function assertRate(value: number, name: string) {
  assertPositiveFiniteNumber(value, name);

  if (value > 1) {
    throw new Error(`${name} must be less than or equal to 1`);
  }
}

/**
 * Calculate entitled tokens from total spending.
 * entitled_tokens = total_spending × TOKEN_MULTIPLIER (default 2)
 */
export function calculateEntitledTokens(
  totalSpending: Decimal.Value,
  multiplier: number = 2,
): Decimal {
  assertPositiveFiniteNumber(multiplier, "Token multiplier");
  return new Decimal(totalSpending).mul(multiplier);
}

/**
 * Calculate daily token release amount.
 * daily_release = entitled_tokens × release_rate (default 0.5%)
 * Capped so cumulative never exceeds entitled.
 */
export function calculateDailyRelease(
  entitledTokens: Decimal.Value,
  releasedTokens: Decimal.Value,
  releaseRate: number = 0.005,
): Decimal {
  assertRate(releaseRate, "Token release rate");
  const entitled = new Decimal(entitledTokens);
  const released = new Decimal(releasedTokens);
  const remaining = entitled.minus(released);

  if (remaining.lte(0)) return new Decimal(0);

  const dailyAmount = entitled.mul(releaseRate);
  return Decimal.min(dailyAmount, remaining);
}

/**
 * Calculate rebate amount for a transaction.
 * rebate = total_amount × rebate_pct
 */
export function calculateRebate(
  totalAmount: Decimal.Value,
  rebatePct: Decimal.Value,
): Decimal {
  return new Decimal(totalAmount).mul(rebatePct);
}

/**
 * Calculate platform service fee for a transaction.
 * fee = total_amount × service_fee_pct
 */
export function calculateServiceFee(
  totalAmount: Decimal.Value,
  serviceFeePct: Decimal.Value,
): Decimal {
  return new Decimal(totalAmount).mul(serviceFeePct);
}

/**
 * Calculate daily token pool value.
 * pool = SUM(transaction_amount × merchant_rebate_pct) for each merchant
 */
export function calculateTokenPoolValue(
  merchantTransactions: Array<{
    totalAmount: Decimal.Value;
    rebatePct: Decimal.Value;
  }>,
): Decimal {
  return merchantTransactions.reduce(
    (sum, tx) => sum.plus(new Decimal(tx.totalAmount).mul(tx.rebatePct)),
    new Decimal(0),
  );
}

/**
 * Distribute pool value across marketplace price tiers.
 */
export function distributeTokenPool(
  poolValue: Decimal.Value,
  distribution: Record<string, number>,
): Array<{ priceTier: Decimal; quantity: Decimal }> {
  const pool = new Decimal(poolValue);
  const entries = Object.entries(distribution);

  if (entries.length === 0) return [];

  const totalDistribution = entries.reduce((sum, [, pct]) => {
    assertRate(pct, "Distribution percentage");
    return sum.plus(pct);
  }, new Decimal(0));

  if (!totalDistribution.equals(1)) {
    throw new Error("Distribution percentages must sum to 1");
  }

  return entries.map(([tier, pct]) => {
    const priceTier = new Decimal(tier);

    if (!priceTier.isFinite() || priceTier.lte(0)) {
      throw new Error("Price tier must be greater than 0");
    }

    return {
      priceTier,
      quantity: pool.mul(pct).div(priceTier).floor(),
    };
  });
}

/**
 * Calculate cash value from marketplace purchase.
 * cash_value = token_amount × price_per_token
 */
export function calculateCashValue(
  tokenAmount: Decimal.Value,
  pricePerToken: Decimal.Value,
): Decimal {
  return new Decimal(tokenAmount).mul(pricePerToken);
}

/**
 * Calculate how many days until tokens are fully released.
 */
export function daysUntilFullRelease(
  entitledTokens: Decimal.Value,
  releasedTokens: Decimal.Value,
  releaseRate: number = 0.005,
): number {
  assertRate(releaseRate, "Token release rate");
  const entitled = new Decimal(entitledTokens);
  const released = new Decimal(releasedTokens);
  const remaining = entitled.minus(released);

  if (remaining.lte(0)) return 0;
  if (entitled.lte(0)) return 0;

  const dailyAmount = entitled.mul(releaseRate);
  return remaining.div(dailyAmount).ceil().toNumber();
}
