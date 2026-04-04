"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

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
}

export default function QrCodesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [generated, setGenerated] = useState<GeneratedQr | null>(null);
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();
      setProducts(data.filter((product: Product) => (product.inventory?.quantity ?? 0) > 0));
      setLoading(false);
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
        width: 240,
        margin: 1,
      });
      setQrImage(dataUrl);
    }

    void generateImage();
  }, [generated]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  function addToCart(product: Product) {
    setGenerated(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const quantityInCart = existing?.quantity ?? 0;
      const available = product.inventory?.quantity ?? 0;

      if (quantityInCart >= available) return prev;

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
    setGenerated(null);
    if (nextQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: nextQuantity } : item,
      ),
    );
  }

  async function handleGenerate() {
    setSubmitting(true);
    setError("");

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
      setError("Failed to generate QR code");
      setSubmitting(false);
      return;
    }

    const data = await res.json();
    setGenerated(data);
    setSubmitting(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          New Transaction
        </h1>
        <p className="text-sm text-slate-500">
          Build a cart, generate a signed QR, and let the customer confirm it on their device.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-3">Select Products</h2>
          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-gray-400">Loading products...</p>
            ) : products.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-10 text-center shadow-sm">
                <p className="text-base font-medium text-slate-700">
                  No in-stock products available.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Add stock in the products page before generating a new transaction QR.
                </p>
              </div>
            ) : (
              products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex min-h-16 w-full items-center justify-between rounded-2xl border bg-white p-4 text-sm transition-colors hover:border-emerald-300"
                >
                  <span className="text-left">
                    <span className="font-medium block">{product.name}</span>
                    <span className="text-xs text-gray-400">
                      Stock {product.inventory?.quantity ?? 0}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    RM{Number(product.price).toFixed(2)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Cart</h2>
          {cart.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
              <p className="text-base font-medium text-slate-700">
                No items selected.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Tap products on the left to build a cart and generate a signed QR.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border bg-white p-4 shadow-sm">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-3 border-b py-3 last:border-0"
                >
                  <div>
                    <span className="font-medium text-sm">{item.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium"
                      >
                        -
                      </button>
                      <span className="text-xs text-gray-500">× {item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <span className="text-sm">
                    RM{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-2 border-t font-bold">
                <span>Total</span>
                <span>RM{total.toFixed(2)}</span>
              </div>
              <button
                onClick={() => void handleGenerate()}
                disabled={cart.length === 0 || submitting}
                className="mt-4 min-h-11 w-full rounded-xl bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Generating..." : "Generate QR Code"}
              </button>
            </div>
          )}

          {generated ? (
            <div className="mt-4 rounded-3xl border bg-white p-6 text-center shadow-sm">
              {qrImage ? (
                <img src={qrImage} alt="Transaction QR code" className="mx-auto" />
              ) : (
                <div className="w-48 h-48 bg-gray-100 mx-auto animate-pulse rounded-lg" />
              )}
              <p className="text-sm text-gray-700 mt-3 break-all">{generated.qrUrl}</p>
              <p className="text-xs text-gray-500 mt-1">
                Expires at {new Date(generated.expiresAt).toLocaleString()}
              </p>
              <div className="mt-4 grid gap-2 text-left text-sm sm:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-gray-500">Total</p>
                  <p className="font-semibold">RM{generated.totalAmount.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-gray-500">Rebate</p>
                  <p className="font-semibold">RM{generated.rebateAmount.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-gray-500">Fee</p>
                  <p className="font-semibold">RM{generated.serviceFee.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
