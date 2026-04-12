"use client";

import { startTransition, useState } from "react";
import type { TradeSnapshot } from "@/features/trade/types";

const DEFAULT_PRICE_TIERS = Array.from({ length: 10 }, (_, index) =>
  Number(((index + 1) / 10).toFixed(2)),
);

type Tab = "trade" | "history";
type TradeSide = "buy" | "sell";

type DisplayRow = {
  price: number;
  id: string;
  marketSize: number;
};

function formatVolume(value: number) {
  return Math.max(0, Math.floor(value)).toLocaleString();
}

function formatCompactVolume(value: number) {
  return Math.max(0, Math.floor(value)).toLocaleString(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

function formatMoney(value: number) {
  return `RM${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPrice(value: number) {
  return value.toFixed(2);
}

function formatMarketTime(value: string | number | Date) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Kuching",
    year: "numeric",
  }).formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("day")}/${getPart("month")}/${getPart("year")}, ${getPart("hour")}:${getPart("minute")}:${getPart("second")}`;
}

export function TradeClient({
  initialData,
}: {
  initialData: TradeSnapshot;
}) {
  const [listings, setListings] = useState(initialData.listings);
  const [recentOrders, setRecentOrders] = useState(initialData.recentOrders);
  const [entitlement, setEntitlement] = useState(initialData.entitlement);
  const [cashSummary, setCashSummary] = useState(initialData.cashSummary);
  const [tradeEnabled, setTradeEnabled] = useState(
    initialData.tradeEnabled,
  );
  const [lastUpdate, setLastUpdate] = useState(() =>
    formatMarketTime(initialData.date),
  );
  const [activeTab, setActiveTab] = useState<Tab>("trade");
  const [tradeSide, setTradeSide] = useState<TradeSide>("sell");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [selling, setSelling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const tradeRes = await fetch("/api/trade", { cache: "no-store" });

      if (!tradeRes.ok) {
        setError("Unable to refresh market data.");
        return;
      }

      const tradeData = (await tradeRes.json()) as TradeSnapshot;
      setListings(tradeData.listings);
      setCashSummary(tradeData.cashSummary);
      setRecentOrders(tradeData.recentOrders);
      setEntitlement(tradeData.entitlement);
      setTradeEnabled(tradeData.tradeEnabled);
      setLastUpdate(formatMarketTime(new Date()));
    } catch {
      setError("Unable to refresh market data.");
    } finally {
      setLoading(false);
    }
  }

  const listingMap = new Map(
    listings.map((listing) => [Number(listing.priceTier).toFixed(2), listing]),
  );

  const displayRows: DisplayRow[] = DEFAULT_PRICE_TIERS.map((priceTier) => {
    const key = priceTier.toFixed(2);
    const listing = listingMap.get(key);

    return {
      price: priceTier,
      id: listing?.id ?? `empty-${key}`,
      marketSize: listing
        ? Math.max(0, Math.floor(Number(listing.remainingQty)))
        : 0,
    };
  }).sort((a, b) => b.price - a.price);

  const splitIndex = Math.max(1, Math.ceil(displayRows.length / 2));
  const askRows = displayRows.slice(0, splitIndex);
  const bidRows = displayRows.slice(splitIndex);
  const bestAskRow =
    [...askRows].reverse().find((row) => row.marketSize > 0) ?? null;
  const bestBidRow = bidRows.find((row) => row.marketSize > 0) ?? null;
  const bestAvailableRow = displayRows.find((row) => row.marketSize > 0);
  const maxMarketSize = Math.max(
    1,
    ...displayRows.map((row) => row.marketSize),
  );
  const volume = displayRows.reduce((sum, row) => sum + row.marketSize, 0);
  const listedCash = listings.reduce(
    (sum, listing) =>
      sum + Number(listing.priceTier) * Math.max(0, Number(listing.remainingQty)),
    0,
  );
  const highPrice =
    displayRows.find((row) => row.marketSize > 0)?.price ??
    bestAvailableRow?.price ??
    0;
  const lowPrice =
    [...displayRows].reverse().find((row) => row.marketSize > 0)?.price ??
    bestAvailableRow?.price ??
    0;
  const spread =
    bestAskRow && bestBidRow
      ? Math.max(0, bestAskRow.price - bestBidRow.price)
      : null;

  const selected =
    (selectedId ? listings.find((listing) => listing.id === selectedId) : null) ??
    (bestAvailableRow
      ? listings.find((listing) => listing.id === bestAvailableRow.id)
      : null);
  const selectedBookId = selected?.id ?? null;
  const selectedPrice = selected
    ? Number(selected.priceTier)
    : bestAvailableRow?.price ?? 0;
  const sellAmount = Math.max(0, Math.floor(Number(amount) || 0));
  const availableTokens = entitlement?.availableTokens ?? 0;
  const availableVolume = Math.max(0, Math.floor(availableTokens));
  const selectedRemaining = selected
    ? Math.max(0, Math.floor(Number(selected.remainingQty)))
    : 0;
  const executableVolume = selected
    ? Math.min(availableVolume, selectedRemaining)
    : 0;
  const cashValue = sellAmount * selectedPrice;
  const canSell =
    tradeSide === "sell" &&
    tradeEnabled &&
    Boolean(selected) &&
    !selling &&
    sellAmount > 0 &&
    sellAmount <= availableVolume &&
    sellAmount <= selectedRemaining;

  async function handleSell() {
    if (!selected || sellAmount <= 0 || tradeSide !== "sell") return;

    setSelling(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/trade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        listingId: selected.id,
        tokenAmount: sellAmount,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(data?.error ?? "Trade failed");
      setSelling(false);
      return;
    }

    const data = (await res.json()) as { cashValue: number };
    setSuccess(`Sold ${sellAmount} tokens for ${formatMoney(data.cashValue)}`);
    setAmount("");
    setSelectedId(null);
    startTransition(() => {
      void loadData();
    });
    setSelling(false);
  }

  function handleRowClick(row: DisplayRow) {
    if (row.marketSize <= 0) return;
    setSelectedId(row.id);
    setTradeSide("sell");
    setError("");
    setSuccess("");
  }

  function setPresetAmount(ratio: number) {
    if (!selected || tradeSide !== "sell") return;
    const max = executableVolume;
    const scaled = ratio >= 1 ? max : Math.floor(max * ratio);
    const nextAmount = ratio >= 1 ? max : scaled > 0 ? scaled : max > 0 ? 1 : 0;
    setAmount(nextAmount > 0 ? String(nextAmount) : "");
  }

  function renderDepthRow(row: DisplayRow, side: "ask" | "bid") {
    const isAsk = side === "ask";
    const hasMarketSize = row.marketSize > 0;
    const isSelected = row.id === selectedBookId;
    const depthPct = Math.min(100, (row.marketSize / maxMarketSize) * 100);

    return (
      <button
        key={`${side}-${row.id}`}
        type="button"
        onClick={() => handleRowClick(row)}
        disabled={!hasMarketSize}
        aria-pressed={isSelected}
        className={`relative grid min-h-7 w-full grid-cols-[1fr_1fr] overflow-hidden rounded-sm px-1.5 text-[11px] font-semibold leading-7 transition ${
          hasMarketSize ? "hover:bg-[#2b3139]" : "cursor-default opacity-35"
        } ${isSelected ? "ring-1 ring-inset ring-[#f0b90b]" : ""}`}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 right-0"
          style={{
            width: `${depthPct}%`,
            background: isAsk
              ? "rgba(246, 70, 93, 0.15)"
              : "rgba(14, 203, 129, 0.15)",
          }}
        />
        <span
          className={`relative text-left font-mono ${
            isAsk ? "text-[#f6465d]" : "text-[#0ecb81]"
          }`}
        >
          {formatPrice(row.price)}
        </span>
        <span className="relative text-right font-mono text-[#eaecef]">
          {hasMarketSize ? formatCompactVolume(row.marketSize) : "-"}
        </span>
      </button>
    );
  }

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-[#0b0e11] pb-8 text-[#eaecef]">
      <div className="border-b border-[#1e2329] px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                CBT/RM
              </h1>
              <span className="rounded bg-[#1e2329] px-1.5 py-0.5 text-[10px] font-semibold text-[#f0b90b]">
                Spot
              </span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-[#848e9c]">
              Last update {lastUpdate}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#2b3139] text-[#f0b90b] transition hover:bg-[#181a20] disabled:opacity-50"
            aria-label="Refresh market"
          >
            <svg
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M3 21v-5h5" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">
          <div>
            <p className="text-[#848e9c]">Last</p>
            <p className="mt-0.5 font-mono font-bold text-[#0ecb81]">
              {formatPrice(
                recentOrders[0]?.pricePerToken ?? bestAvailableRow?.price ?? 0,
              )}
            </p>
          </div>
          <div>
            <p className="text-[#848e9c]">High</p>
            <p className="mt-0.5 font-mono font-semibold text-[#eaecef]">
              {formatPrice(highPrice)}
            </p>
          </div>
          <div>
            <p className="text-[#848e9c]">Low</p>
            <p className="mt-0.5 font-mono font-semibold text-[#eaecef]">
              {formatPrice(lowPrice)}
            </p>
          </div>
          <div>
            <p className="text-[#848e9c]">Vol</p>
            <p className="mt-0.5 font-mono font-semibold text-[#eaecef]">
              {formatCompactVolume(volume)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-[#1e2329] px-3 py-2 text-xs">
        <div className="min-w-0">
          <p className="font-medium text-[#848e9c]">Cash Wallet</p>
          <p className="mt-0.5 font-mono text-sm font-bold text-white">
            {formatMoney(cashSummary?.availableToWithdraw ?? 0)}
          </p>
        </div>
        <span className="rounded-md border border-[#2b3139] px-3 py-2 text-xs font-bold text-[#f0b90b]">
          Spot
        </span>
      </div>

      <div className="grid grid-cols-2 border-b border-[#1e2329] text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("trade")}
          className={`min-h-11 border-b-2 transition ${
            activeTab === "trade"
              ? "border-[#f0b90b] text-white"
              : "border-transparent text-[#848e9c]"
          }`}
        >
          Trade
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`min-h-11 border-b-2 transition ${
            activeTab === "history"
              ? "border-[#f0b90b] text-white"
              : "border-transparent text-[#848e9c]"
          }`}
        >
          History
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-80 items-center justify-center px-6 text-sm text-[#848e9c]">
          Loading market...
        </div>
      ) : !tradeEnabled ? (
        <div className="px-6 py-16 text-center">
          <p className="text-base font-semibold text-[#f0b90b]">
            Trade is paused.
          </p>
          <p className="mt-2 text-sm text-[#848e9c]">
            Trading has been disabled by the admin team.
          </p>
        </div>
      ) : activeTab === "trade" ? (
        <>
          <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-2 px-3 py-3">
            <section className="min-w-0">
              <div className="grid grid-cols-2 gap-1 rounded-md bg-[#1e2329] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setTradeSide("buy");
                    setError("");
                    setSuccess("");
                  }}
                  className={`min-h-9 rounded px-3 text-sm font-bold transition ${
                    tradeSide === "buy"
                      ? "bg-[#0ecb81] text-white"
                      : "text-[#848e9c]"
                  }`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTradeSide("sell");
                    setError("");
                    setSuccess("");
                  }}
                  className={`min-h-9 rounded px-3 text-sm font-bold transition ${
                    tradeSide === "sell"
                      ? "bg-[#f6465d] text-white"
                      : "text-[#848e9c]"
                  }`}
                >
                  Sell
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-md border border-[#2b3139] bg-[#181a20] px-3 py-2 text-xs">
                <span className="font-semibold text-white">Limit</span>
                <span className="text-[#848e9c]">Available book</span>
              </div>

              <label className="mt-3 block">
                <span className="text-[11px] font-medium text-[#848e9c]">
                  Price
                </span>
                <div className="mt-1 flex min-h-10 items-center justify-between rounded-md border border-[#2b3139] bg-[#181a20] px-3">
                  <span className="font-mono text-sm font-semibold text-white">
                    {selected ? formatPrice(selectedPrice) : "Select"}
                  </span>
                  <span className="text-xs text-[#848e9c]">RM</span>
                </div>
              </label>

              <label className="mt-3 block">
                <span className="text-[11px] font-medium text-[#848e9c]">
                  Amount
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "") {
                      setAmount("");
                      return;
                    }
                    const next = Number(value);
                    if (Number.isNaN(next)) return;
                    setAmount(String(Math.max(0, Math.floor(next))));
                  }}
                  placeholder="0"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  max={executableVolume}
                  disabled={tradeSide === "buy"}
                  className="mt-1 !min-h-10 !rounded-md !border-[#2b3139] !bg-[#181a20] px-3 font-mono text-sm font-semibold text-white placeholder:text-[#5e6673] disabled:opacity-60"
                />
              </label>

              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[
                  { label: "25%", value: 0.25 },
                  { label: "50%", value: 0.5 },
                  { label: "75%", value: 0.75 },
                  { label: "100%", value: 1 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPresetAmount(preset.value)}
                    disabled={tradeSide === "buy" || !selected}
                    className="min-h-7 rounded bg-[#2b3139] px-1 text-[11px] font-semibold text-[#eaecef] transition hover:bg-[#3a414c] disabled:opacity-45"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-[#848e9c]">
                  <span>Available</span>
                  <span className="font-mono text-[#eaecef]">
                    {formatVolume(availableVolume)} CBT
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#848e9c]">
                  <span>Max sell</span>
                  <span className="font-mono text-[#eaecef]">
                    {formatVolume(executableVolume)} CBT
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#848e9c]">
                  <span>Proceeds</span>
                  <span className="font-mono font-semibold text-[#0ecb81]">
                    {formatMoney(cashValue)}
                  </span>
                </div>
              </div>

              {tradeSide === "buy" ? (
                <p className="mt-3 rounded-md border border-[#2b3139] bg-[#181a20] px-3 py-2 text-xs text-[#f0b90b]">
                  Buy flow is coming soon.
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={!canSell}
                className={`mt-3 min-h-11 w-full rounded-md px-4 text-sm font-bold text-white transition disabled:opacity-45 ${
                  tradeSide === "buy"
                    ? "bg-[#0ecb81]"
                    : "bg-[#f6465d] hover:bg-[#d83b50]"
                }`}
              >
                {tradeSide === "buy"
                  ? "Buy CBT"
                  : selling
                    ? "Selling..."
                    : "Sell CBT"}
              </button>
            </section>

            <section className="min-w-0">
              <div className="grid grid-cols-2 px-1.5 text-[10px] font-medium text-[#848e9c]">
                <span>Price</span>
                <span className="text-right">Amount</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {askRows.map((row) => renderDepthRow(row, "ask"))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (bestAvailableRow) handleRowClick(bestAvailableRow);
                }}
                className="my-1.5 w-full rounded-md bg-[#181a20] px-2 py-2 text-left transition hover:bg-[#1e2329]"
              >
                <p className="font-mono text-base font-bold text-[#0ecb81]">
                  {formatPrice(bestAvailableRow?.price ?? 0)}
                </p>
                <p className="text-[10px] text-[#848e9c]">
                  Spread {spread === null ? "-" : formatPrice(spread)}
                </p>
              </button>
              <div className="space-y-0.5">
                {bidRows.map((row) => renderDepthRow(row, "bid"))}
              </div>
            </section>
          </div>

          <div className="border-t border-[#1e2329] px-3 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Open Orders</h2>
              <p className="text-xs text-[#848e9c]">
                Listed {formatMoney(listedCash)}
              </p>
            </div>
            <div className="mt-3 rounded-md border border-[#1e2329] bg-[#181a20] px-4 py-6 text-center text-sm text-[#848e9c]">
              No open orders.
            </div>
          </div>
        </>
      ) : (
        <div className="px-3 py-3">
          <div className="grid grid-cols-[1fr_0.7fr_0.7fr] border-b border-[#1e2329] pb-2 text-[11px] font-medium text-[#848e9c]">
            <span>Time</span>
            <span className="text-center">Price</span>
            <span className="text-right">Amount</span>
          </div>

          {recentOrders.length === 0 ? (
            <div className="rounded-md border border-[#1e2329] bg-[#181a20] px-4 py-12 text-center text-sm text-[#848e9c]">
              No trade history yet.
            </div>
          ) : (
            <div className="divide-y divide-[#1e2329]">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-[1fr_0.7fr_0.7fr] py-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {order.userName}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#848e9c]">
                      {formatMarketTime(order.createdAt)}
                    </p>
                  </div>
                  <span className="text-center font-mono font-semibold text-[#0ecb81]">
                    {formatPrice(order.pricePerToken)}
                  </span>
                  <span className="text-right font-mono text-[#eaecef]">
                    {formatVolume(order.tokenAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "trade" && error && (
        <div className="mx-3 mt-3 rounded-md border border-[#f6465d]/40 bg-[#2d171f] px-3 py-2 text-sm text-[#f6465d]">
          {error}
        </div>
      )}
      {activeTab === "trade" && success && (
        <div className="mx-3 mt-3 rounded-md border border-[#0ecb81]/40 bg-[#10261f] px-3 py-2 text-sm text-[#0ecb81]">
          {success}
        </div>
      )}

      {confirming && selected ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-lg border border-[#2b3139] bg-[#181a20] p-5 shadow-xl">
            <h3 className="text-lg font-bold text-white">Confirm Sell</h3>
            <p className="mt-2 text-sm leading-6 text-[#b7bdc6]">
              Sell{" "}
              <span className="font-semibold text-white">
                {sellAmount.toLocaleString()} CBT
              </span>{" "}
              at{" "}
              <span className="font-mono font-semibold text-white">
                {formatPrice(Number(selected.priceTier))}
              </span>{" "}
              for{" "}
              <span className="font-semibold text-[#0ecb81]">
                {formatMoney(cashValue)}
              </span>
              .
            </p>
            <p className="mt-1 text-xs text-[#848e9c]">
              This action cannot be undone.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="min-h-10 rounded-md border border-[#2b3139] px-4 text-sm font-semibold text-[#eaecef]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  void handleSell();
                }}
                className="min-h-10 rounded-md bg-[#f6465d] px-4 text-sm font-bold text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
