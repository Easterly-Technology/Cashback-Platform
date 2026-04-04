"use client";

import { startTransition, useEffect, useState } from "react";

interface Listing {
  id: string;
  priceTier: number;
  totalQty: number;
  remainingQty: number;
  status: string;
}

interface Entitlement {
  availableTokens: number;
}

interface RecentOrder {
  id: string;
  userName: string;
  tokenAmount: number;
  cashValue: number;
  pricePerToken: number;
  createdAt: string;
}

const DEFAULT_PRICE_TIERS = Array.from({ length: 10 }, (_, index) =>
  Number(((index + 1) / 10).toFixed(2)),
);

function formatVolume(value: number) {
  return Math.max(0, Math.floor(value)).toLocaleString();
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

type Tab = "market" | "history";

export default function ExchangePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [exchangeEnabled, setExchangeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("market");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    const [exchangeRes, entitlementRes] = await Promise.all([
      fetch("/api/exchange", { cache: "no-store" }),
      fetch("/api/tokens", { cache: "no-store" }),
    ]);

    if (exchangeRes.ok) {
      const exchangeData = (await exchangeRes.json()) as {
        exchangeEnabled: boolean;
        listings: Listing[];
        recentOrders: RecentOrder[];
      };
      setListings(exchangeData.listings);
      setRecentOrders(exchangeData.recentOrders);
      setExchangeEnabled(exchangeData.exchangeEnabled);
      setLastUpdate(new Date().toLocaleString());
    }

    if (entitlementRes.ok) {
      setEntitlement(await entitlementRes.json());
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  const listingMap = new Map(
    listings.map((listing) => [Number(listing.priceTier).toFixed(2), listing]),
  );

  const displayRows = DEFAULT_PRICE_TIERS.map((priceTier) => {
    const key = priceTier.toFixed(2);
    const listing = listingMap.get(key);
    return {
      price: priceTier,
      id: listing?.id ?? `empty-${key}`,
      buyQty: 0,
      sellQty: listing ? Math.max(0, Math.floor(Number(listing.remainingQty))) : 0,
      listing: listing ?? null,
    };
  }).sort((a, b) => b.price - a.price);

  const selected = listings.find((l) => l.id === selectedId);
  const sellAmount = Math.max(0, Math.floor(Number(amount) || 0));
  const availableTokens = entitlement?.availableTokens ?? 0;
  const availableVolume = Math.max(0, Math.floor(availableTokens));
  const cashValue = selected ? sellAmount * Number(selected.priceTier) : 0;

  const executableVolume = selected
    ? Math.min(
        availableVolume,
        Math.max(0, Math.floor(Number(selected.remainingQty))),
      )
    : 0;

  async function handleSell() {
    if (!selected || sellAmount <= 0) return;

    setSelling(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/exchange", {
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

  function handleRowClick(row: (typeof displayRows)[0]) {
    if (row.sellQty <= 0) return;
    if (selectedId === row.id) {
      setSelectedId(null);
      setAmount("");
    } else {
      setSelectedId(row.id);
      setAmount("");
      setError("");
      setSuccess("");
    }
  }

  function setPresetAmount(ratio: number) {
    if (!selected) return;
    const max = executableVolume;
    const scaled = ratio >= 1 ? max : Math.floor(max * ratio);
    const nextAmount = ratio >= 1 ? max : scaled > 0 ? scaled : max > 0 ? 1 : 0;
    setAmount(nextAmount > 0 ? String(nextAmount) : "");
  }

  return (
    <div className="space-y-4 py-4">
      {/* Tabs */}
      <div className="material-card overflow-hidden">
        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab("market")}
            className={`py-3 text-center text-sm font-semibold transition-colors ${
              activeTab === "market"
                ? "text-blue-700 border-b-[3px] border-blue-600"
                : "text-slate-400 border-b-[3px] border-transparent hover:text-slate-600"
            }`}
          >
            Exchange
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`py-3 text-center text-sm font-semibold transition-colors ${
              activeTab === "history"
                ? "text-blue-700 border-b-[3px] border-blue-600"
                : "text-slate-400 border-b-[3px] border-transparent hover:text-slate-600"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {loading ? (
        <div className="material-empty flex items-center justify-center px-6 py-16 text-sm text-slate-400">
          Loading exchange...
        </div>
      ) : !exchangeEnabled ? (
        <div className="material-empty px-6 py-16 text-center">
          <p className="text-base font-medium text-amber-800">Exchange is paused.</p>
          <p className="mt-2 text-sm text-amber-700">
            Trading has been disabled by the admin team.
          </p>
        </div>
      ) : activeTab === "market" ? (
        <>
          {/* Exchange Header */}
          <div>
            <h2 className="text-lg font-bold text-slate-950">Exchange Rates</h2>
            {lastUpdate && (
              <p className="mt-0.5 text-[11px] text-slate-500">
                Last Update: {lastUpdate}
              </p>
            )}
          </div>

          {/* Order Book */}
          <div className="material-card overflow-hidden px-5 py-1">
            <div className="grid grid-cols-3 border-b border-slate-200/60 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Price</span>
              <span className="text-center">Buy</span>
              <span className="text-right">Sell</span>
            </div>

            <div className="divide-y divide-slate-100/70">
              {displayRows.map((row) => {
                const isSelected = selectedId === row.id;
                const hasSell = row.sellQty > 0;

                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => handleRowClick(row)}
                    disabled={!hasSell}
                    className={`grid w-full grid-cols-3 py-2.5 text-sm transition-all ${
                      isSelected
                        ? "bg-blue-50/70 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                        : hasSell
                          ? "hover:bg-blue-50/40"
                          : ""
                    } ${!hasSell ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <span className="text-left font-medium text-slate-800">
                      {formatPrice(row.price)}
                    </span>
                    <span className="text-center font-mono text-blue-600">
                      {row.buyQty > 0 ? formatVolume(row.buyQty) : "0"}
                    </span>
                    <span
                      className={`text-right font-mono ${
                        hasSell ? "font-semibold text-rose-500" : "text-slate-300"
                      }`}
                    >
                      {hasSell ? formatVolume(row.sellQty) : "0"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </p>
          )}

          {/* Sell Panel */}
          {selected && (
            <div className="material-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Sell at
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-950">
                    {formatPrice(Number(selected.priceTier))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Available
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-blue-700">
                    {formatVolume(availableVolume)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setAmount("");
                  }}
                  className="ml-2 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") { setAmount(""); return; }
                  const n = Number(v);
                  if (Number.isNaN(n)) return;
                  setAmount(String(Math.max(0, Math.floor(n))));
                }}
                placeholder="Enter amount"
                min="1"
                step="1"
                inputMode="numeric"
                max={executableVolume}
              />

              <div className="mt-2 grid grid-cols-4 gap-2">
                {[
                  { label: "25%", value: 0.25 },
                  { label: "50%", value: 0.5 },
                  { label: "75%", value: 0.75 },
                  { label: "Max", value: 1 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPresetAmount(preset.value)}
                    className="material-button-outlined px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {sellAmount > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <span className="text-slate-500">Proceeds</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {formatMoney(cashValue)}
                  </span>
                </div>
              )}

              <button
                onClick={() => void handleSell()}
                disabled={
                  !exchangeEnabled ||
                  selling ||
                  sellAmount <= 0 ||
                  sellAmount > availableVolume ||
                  sellAmount > Math.max(0, Math.floor(Number(selected.remainingQty)))
                }
                className="material-button-primary mt-3 min-h-12 w-full px-4 py-3 text-sm font-semibold transition hover:translate-y-[-1px] disabled:opacity-50"
              >
                {selling ? "Executing..." : "Sell Tokens"}
              </button>
            </div>
          )}

          {/* Buy / Sell Buttons */}
          {!selected && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled
                className="material-button-tonal min-h-12 px-6 py-3 text-sm font-semibold opacity-50"
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => {
                  const firstAvailable = displayRows.find((r) => r.sellQty > 0);
                  if (firstAvailable) setSelectedId(firstAvailable.id);
                }}
                className="material-button-primary min-h-12 px-6 py-3 text-sm font-semibold transition hover:translate-y-[-1px]"
              >
                Sell
              </button>
            </div>
          )}
        </>
      ) : (
        /* History Tab */
        <>
          {recentOrders.length === 0 ? (
            <div className="material-empty px-6 py-16 text-center text-sm text-slate-400">
              No trade history yet.
            </div>
          ) : (
            <div className="material-card overflow-hidden">
              <div className="grid grid-cols-[1fr_0.8fr_0.8fr] border-b border-slate-200/60 bg-blue-50/40 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>Time</span>
                <span className="text-center">Price</span>
                <span className="text-right">Amount</span>
              </div>
              <div className="divide-y divide-slate-100/70">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="grid grid-cols-[1fr_0.8fr_0.8fr] px-5 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {order.userName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-center font-mono font-semibold text-emerald-600">
                      {formatPrice(order.pricePerToken)}
                    </span>
                    <span className="text-right font-mono text-slate-700">
                      {formatVolume(order.tokenAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
