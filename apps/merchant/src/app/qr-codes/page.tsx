"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { formatCurrency } from "@cashback/shared";

interface Product {
  id: string;
  name: string;
  price: number;
  inventory: {
    quantity: number;
  } | null;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface GeneratedQr {
  qrCodeId: string;
  qrUrl: string;
  totalAmount: number;
  rebateAmount: number;
  serviceFee: number;
  expiresAt: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}

export default function QrCodesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [generated, setGenerated] = useState<GeneratedQr | null>(null);
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load products");
        }
        const data = (await res.json()) as Product[];
        setProducts(data.filter((product) => (product.inventory?.quantity ?? 0) > 0));
      } catch (loadError) {
        console.error(loadError);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    void loadProducts();
  }, []);

  useEffect(() => {
    async function generateImage() {
      if (!generated?.qrUrl) {
        setQrImage("");
        return;
      }

      const dataUrl = await QRCode.toDataURL(generated.qrUrl, {
        width: 280,
        margin: 1,
      });
      setQrImage(dataUrl);
    }

    void generateImage();
  }, [generated]);

  const availableStockByProduct = useMemo(
    () =>
      new Map(
        products.map((product) => [product.id, product.inventory?.quantity ?? 0]),
      ),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => product.name.toLowerCase().includes(query));
  }, [products, search]);

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  function resetGenerated() {
    setGenerated(null);
    setCopied(false);
  }

  function addToCart(product: Product) {
    resetGenerated();
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const quantityInCart = existing?.quantity ?? 0;
      const available = product.inventory?.quantity ?? 0;

      if (quantityInCart >= available) {
        return prev;
      }

      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
        },
      ];
    });
  }

  function updateQuantity(productId: string, nextQuantity: number) {
    resetGenerated();

    const max = availableStockByProduct.get(productId) ?? 0;
    const safeQuantity = Math.min(Math.max(nextQuantity, 0), max);

    if (safeQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: safeQuantity } : item,
      ),
    );
  }

  async function handleGenerate() {
    setSubmitting(true);
    setError("");
    setCopied(false);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate QR code");
      }

      const data = (await res.json()) as GeneratedQr;
      setGenerated(data);
    } catch (generateError) {
      console.error(generateError);
      setError("Failed to generate QR code");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyQrUrl() {
    if (!generated?.qrUrl || typeof navigator === "undefined") {
      return;
    }

    await navigator.clipboard.writeText(generated.qrUrl);
    setCopied(true);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="material-card p-6">
          <span className="material-chip">Counter Checkout</span>
          <h1 className="material-title mt-4 text-slate-950">New Transaction</h1>
          <p className="material-subtitle mt-3">
            Build a cart, generate a signed customer QR, and hand off confirmation without losing visibility on totals or fees.
          </p>
        </div>

        <div className="material-card-flat p-5">
          <p className="text-sm font-semibold text-slate-950">Checkout Snapshot</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                In-stock products
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {products.length.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cart items
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {itemCount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Cart total
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {formatCurrency(total)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="material-alert material-alert-danger text-sm">{error}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <section className="space-y-4">
          <div className="material-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Select Products</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tap products to add them to the live cart.
                </p>
              </div>
              <span className="material-chip material-chip-muted">
                {filteredProducts.length.toLocaleString()} visible
              </span>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search in-stock products..."
              className="mt-4 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="material-card px-6 py-12 text-center text-sm text-slate-400">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="material-empty border-emerald-200 px-6 py-10 text-center">
                <p className="text-base font-medium text-slate-700">
                  {search.trim()
                    ? "No products match this search."
                    : "No in-stock products available."}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {search.trim()
                    ? "Try another search term or clear the query to see the full in-stock list."
                    : "Add stock in the products page before generating a new transaction QR."}
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  className="material-card-flat flex min-h-20 w-full items-center justify-between gap-4 p-4 text-left transition hover:-translate-y-0.5"
                >
                  <span>
                    <span className="block font-medium text-slate-900">
                      {product.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      Stock {product.inventory?.quantity ?? 0}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {formatCurrency(Number(product.price))}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="material-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Cart</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Adjust quantities, then generate a signed QR for the customer.
                </p>
              </div>
              {cart.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    resetGenerated();
                  }}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-900"
                >
                  Clear cart
                </button>
              ) : null}
            </div>

            {cart.length === 0 ? (
              <div className="material-empty mt-4 px-6 py-10 text-center">
                <p className="text-base font-medium text-slate-700">
                  No items selected.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Choose products from the left to build the next checkout.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  {cart.map((item) => {
                    const max = availableStockByProduct.get(item.productId) ?? item.quantity;

                    return (
                      <div
                        key={item.productId}
                        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              Max available: {max}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-slate-700">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold"
                          >
                            -
                          </button>
                          <span className="min-w-16 text-center text-sm font-medium text-slate-600">
                            x {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Items
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {itemCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estimated rebate
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {generated
                        ? formatCurrency(generated.rebateAmount)
                        : "Calculated on QR"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-950 p-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Total
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {formatCurrency(total)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={cart.length === 0 || submitting}
                  className="material-button-primary mt-4 min-h-11 w-full px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px] disabled:opacity-50"
                >
                  {submitting ? "Generating..." : "Generate QR Code"}
                </button>
              </>
            )}
          </div>

          {generated ? (
            <div className="material-card-flat p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Ready to Scan</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Share this QR with the customer before it expires.
                  </p>
                </div>
                <span className="material-chip material-chip-muted">
                  Expires {new Date(generated.expiresAt).toLocaleTimeString()}
                </span>
              </div>

              <div className="mt-5 rounded-[28px] bg-white p-4 shadow-sm">
                {qrImage ? (
                  <img src={qrImage} alt="Transaction QR code" className="mx-auto" />
                ) : (
                  <div className="mx-auto h-[280px] w-[280px] animate-pulse rounded-2xl bg-slate-100" />
                )}
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Share Link
                </p>
                <p className="mt-2 break-all text-sm text-slate-700">
                  {generated.qrUrl}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCurrency(generated.totalAmount)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rebate
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCurrency(generated.rebateAmount)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Service Fee
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCurrency(generated.serviceFee)}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Checkout contents</p>
                {generated.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-3 text-sm text-slate-600"
                  >
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyQrUrl()}
                  className="material-button-primary min-h-11 px-4 py-2 text-sm font-semibold text-white"
                >
                  {copied ? "Copied" : "Copy Link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    resetGenerated();
                  }}
                  className="material-button-outlined min-h-11 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Start New Cart
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
