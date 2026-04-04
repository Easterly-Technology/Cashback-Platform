import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import {
  calculateEntitledTokens,
  calculateDailyRelease,
  calculateRebate,
  calculateServiceFee,
  calculateTokenPoolValue,
  distributeTokenPool,
  calculateCashValue,
  daysUntilFullRelease,
} from "../utils/token-math";

describe("calculateEntitledTokens", () => {
  it("returns spending × 2 by default", () => {
    expect(calculateEntitledTokens(1000).toString()).toBe("2000");
  });

  it("uses custom multiplier", () => {
    expect(calculateEntitledTokens(500, 3).toString()).toBe("1500");
  });

  it("handles zero spending", () => {
    expect(calculateEntitledTokens(0).toString()).toBe("0");
  });

  it("handles decimal spending", () => {
    expect(calculateEntitledTokens("99.99").toString()).toBe("199.98");
  });

  it("rejects invalid multipliers", () => {
    expect(() => calculateEntitledTokens(100, 0)).toThrow(
      "Token multiplier must be a positive finite number",
    );
  });
});

describe("calculateDailyRelease", () => {
  it("releases 0.5% of entitled tokens by default", () => {
    const result = calculateDailyRelease(2000, 0);
    expect(result.toString()).toBe("10");
  });

  it("caps release so cumulative never exceeds entitled", () => {
    // entitled=100, released=99 → remaining=1, daily would be 0.5 → min(0.5, 1) = 0.5
    const result = calculateDailyRelease(100, 99);
    expect(result.toString()).toBe("0.5");
  });

  it("returns 0 when fully released", () => {
    const result = calculateDailyRelease(2000, 2000);
    expect(result.toString()).toBe("0");
  });

  it("returns 0 when over-released", () => {
    const result = calculateDailyRelease(2000, 2100);
    expect(result.toString()).toBe("0");
  });

  it("uses custom release rate", () => {
    const result = calculateDailyRelease(2000, 0, 0.01);
    expect(result.toString()).toBe("20");
  });

  it("caps at remaining when daily exceeds remainder", () => {
    // entitled=1000, released=998 → remaining=2, daily=5 → min(5, 2) = 2
    const result = calculateDailyRelease(1000, 998);
    expect(result.toString()).toBe("2");
  });

  it("rejects invalid release rates", () => {
    expect(() => calculateDailyRelease(100, 0, 0)).toThrow(
      "Token release rate must be a positive finite number",
    );
    expect(() => calculateDailyRelease(100, 0, 1.1)).toThrow(
      "Token release rate must be less than or equal to 1",
    );
  });
});

describe("calculateRebate", () => {
  it("calculates rebate correctly", () => {
    expect(calculateRebate(1000, 0.05).toString()).toBe("50");
  });

  it("handles zero amount", () => {
    expect(calculateRebate(0, 0.05).toString()).toBe("0");
  });

  it("handles decimal amounts", () => {
    expect(calculateRebate("199.99", "0.03").toString()).toBe("5.9997");
  });
});

describe("calculateServiceFee", () => {
  it("calculates fee correctly", () => {
    expect(calculateServiceFee(1000, 0.02).toString()).toBe("20");
  });

  it("handles zero", () => {
    expect(calculateServiceFee(0, 0.02).toString()).toBe("0");
  });
});

describe("calculateTokenPoolValue", () => {
  it("sums rebate contributions from multiple merchants", () => {
    const result = calculateTokenPoolValue([
      { totalAmount: 1000, rebatePct: 0.05 },
      { totalAmount: 2000, rebatePct: 0.03 },
    ]);
    // 1000*0.05 + 2000*0.03 = 50 + 60 = 110
    expect(result.toString()).toBe("110");
  });

  it("returns 0 for empty array", () => {
    expect(calculateTokenPoolValue([]).toString()).toBe("0");
  });

  it("handles single merchant", () => {
    const result = calculateTokenPoolValue([
      { totalAmount: 500, rebatePct: 0.1 },
    ]);
    expect(result.toString()).toBe("50");
  });
});

describe("distributeTokenPool", () => {
  it("distributes pool across price tiers", () => {
    const result = distributeTokenPool(1000, {
      "0.10": 0.4,
      "0.50": 0.3,
      "1.00": 0.3,
    });

    expect(result).toHaveLength(3);

    // tier 0.10: 1000 * 0.4 / 0.10 = 4000 tokens
    expect(result[0].priceTier.toString()).toBe("0.1");
    expect(result[0].quantity.toString()).toBe("4000");

    // tier 0.50: 1000 * 0.3 / 0.50 = 600 tokens
    expect(result[1].priceTier.toString()).toBe("0.5");
    expect(result[1].quantity.toString()).toBe("600");

    // tier 1.00: 1000 * 0.3 / 1.00 = 300 tokens
    expect(result[2].priceTier.toString()).toBe("1");
    expect(result[2].quantity.toString()).toBe("300");
  });

  it("handles zero pool value", () => {
    const result = distributeTokenPool(0, { "0.10": 1.0 });
    expect(result[0].quantity.toString()).toBe("0");
  });

  it("rounds each tier down to whole-token quantities", () => {
    const result = distributeTokenPool(1.26, {
      "1.00": 1.0,
    });

    expect(result[0].quantity.toString()).toBe("1");
  });

  it("returns empty array for empty distribution", () => {
    expect(distributeTokenPool(100, {})).toEqual([]);
  });

  it("rejects distributions that do not sum to 1", () => {
    expect(() =>
      distributeTokenPool(100, {
        "0.10": 0.4,
        "0.50": 0.4,
      }),
    ).toThrow("Distribution percentages must sum to 1");
  });
});

describe("calculateCashValue", () => {
  it("returns tokens × price", () => {
    expect(calculateCashValue(100, 0.5).toString()).toBe("50");
  });

  it("handles fractional values", () => {
    expect(calculateCashValue(33, "0.30").toString()).toBe("9.9");
  });
});

describe("daysUntilFullRelease", () => {
  it("returns 200 for fresh entitlement at default rate", () => {
    expect(daysUntilFullRelease(2000, 0)).toBe(200);
  });

  it("returns 0 when fully released", () => {
    expect(daysUntilFullRelease(2000, 2000)).toBe(0);
  });

  it("returns 0 when entitled is 0", () => {
    expect(daysUntilFullRelease(0, 0)).toBe(0);
  });

  it("calculates partial remaining correctly", () => {
    // entitled=2000, released=1990, remaining=10, daily=10 → 1 day
    expect(daysUntilFullRelease(2000, 1990)).toBe(1);
  });

  it("rounds up fractional days", () => {
    // entitled=2000, released=1995, remaining=5, daily=10 → 0.5 → ceil = 1
    expect(daysUntilFullRelease(2000, 1995)).toBe(1);
  });

  it("uses custom release rate", () => {
    // entitled=1000, released=0, rate=0.01 → daily=10, remaining=1000 → 100 days
    expect(daysUntilFullRelease(1000, 0, 0.01)).toBe(100);
  });

  it("rejects invalid release rate input", () => {
    expect(() => daysUntilFullRelease(1000, 0, 2)).toThrow(
      "Token release rate must be less than or equal to 1",
    );
  });
});
