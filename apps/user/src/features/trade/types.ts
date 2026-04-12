export type TradeListing = {
  id: string;
  priceTier: number;
  totalQty: number;
  remainingQty: number;
  status: string;
};

export type TradeEntitlement = {
  availableTokens: number;
  releasedTokens: number;
  entitledTokens: number;
  totalSpending: number;
  nextReleaseAmount: number;
  estimatedDaysRemaining: number;
};

export type TradeCashSummary = {
  availableToWithdraw: number;
  pendingWithdrawalAmount: number;
  withdrawnToDate: number;
  lifetimeProceeds: number;
};

export type TradeRecentOrder = {
  id: string;
  userName: string;
  tokenAmount: number;
  cashValue: number;
  pricePerToken: number;
  createdAt: string;
};

export type TradeSnapshot = {
  date: string;
  tradeEnabled: boolean;
  listings: TradeListing[];
  entitlement: TradeEntitlement;
  cashSummary: TradeCashSummary | null;
  recentOrders: TradeRecentOrder[];
};
