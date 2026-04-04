"use client";

import { useEffect, useState } from "react";

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  status: "ACTIVE" | "INACTIVE";
  inventory: {
    quantity: number;
    lowStockThreshold: number;
  } | null;
}

const emptyForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  initialStock: "0",
  lowStockThreshold: "10",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  async function loadProducts() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/products", { cache: "no-store" });
    if (!res.ok) {
      setError("Failed to load products");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        price: Number(form.price),
        initialStock: Number(form.initialStock),
        lowStockThreshold: Number(form.lowStockThreshold),
      }),
    });

    if (!res.ok) {
      setError("Failed to create product");
      setSaving(false);
      return;
    }

    setForm(emptyForm);
    setShowForm(false);
    await loadProducts();
    setSaving(false);
  }

  async function handleQuickEdit(product: ProductRow) {
    const quantity = window.prompt(
      `Update stock quantity for ${product.name}`,
      String(product.inventory?.quantity ?? 0),
    );

    if (quantity === null) return;

    const lowStockThreshold = window.prompt(
      `Update low stock threshold for ${product.name}`,
      String(product.inventory?.lowStockThreshold ?? 10),
    );

    if (lowStockThreshold === null) return;

    const status = window.prompt(
      `Status for ${product.name} (ACTIVE or INACTIVE)`,
      product.status,
    );

    if (status === null) return;

    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        product: { status: status.toUpperCase() },
        inventory: {
          quantity: Number(quantity),
          lowStockThreshold: Number(lowStockThreshold),
        },
      }),
    });

    if (!res.ok) {
      setError("Failed to update product");
      return;
    }

    await loadProducts();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="material-card flex-1 p-6">
          <span className="material-chip">Catalog Control</span>
          <h1 className="material-title mt-4 text-slate-950">
            Products & Inventory
          </h1>
          <p className="material-subtitle mt-3">
            Keep catalog details fresh and stock levels ready for checkout.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="material-button-primary min-h-11 px-5 py-3 text-sm font-semibold transition hover:translate-y-[-1px] sm:w-auto"
        >
          {showForm ? "Cancel" : "Add Product"}
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleCreate}
          className="material-card mb-6 p-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 text-sm"
                placeholder="e.g. Latte"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (RM)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                className="px-3 py-2 text-sm"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 text-sm"
                placeholder="e.g. Drinks"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Stock
              </label>
              <input
                type="number"
                min="0"
                value={form.initialStock}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, initialStock: e.target.value }))
                }
                className="px-3 py-2 text-sm"
                placeholder="100"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="px-3 py-2 text-sm"
                placeholder="Optional product description"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, lowStockThreshold: e.target.value }))
                }
                className="px-3 py-2 text-sm"
                placeholder="10"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="material-button-primary mt-4 min-h-11 w-full px-4 py-2 text-sm font-semibold transition hover:translate-y-[-1px] disabled:opacity-50 sm:w-auto"
          >
            {saving ? "Saving..." : "Save Product"}
          </button>
        </form>
      ) : null}

      <div className="space-y-4 lg:hidden">
        {loading ? (
          <div className="material-card px-6 py-12 text-center text-sm text-slate-400">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="material-empty border-emerald-200 px-6 py-12 text-center">
            <p className="text-base font-medium text-slate-700">No products yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Add your first product to start building QR transactions.
            </p>
          </div>
        ) : (
          products.map((product) => {
            const stock = product.inventory?.quantity ?? 0;
            const lowStockThreshold = product.inventory?.lowStockThreshold ?? 10;

            return (
              <div
                key={product.id}
                className="material-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{product.name}</p>
                    {product.description ? (
                      <p className="mt-1 text-sm text-slate-500">
                        {product.description}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      product.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-slate-500">Category</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {product.category ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-slate-500">Price</p>
                    <p className="mt-1 font-medium text-slate-900">
                      RM{Number(product.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-slate-950 p-3 text-white">
                    <p className="text-slate-300">Stock</p>
                    <p
                      className={`mt-1 text-lg font-semibold ${
                        stock <= lowStockThreshold ? "text-rose-300" : "text-white"
                      }`}
                    >
                      {stock}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => void handleQuickEdit(product)}
                  className="material-button-outlined mt-4 min-h-11 w-full px-4 py-2 text-sm font-semibold transition hover:bg-slate-50"
                >
                  Update Stock / Status
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="material-table-shell hidden lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    No products yet
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const stock = product.inventory?.quantity ?? 0;
                  const lowStockThreshold =
                    product.inventory?.lowStockThreshold ?? 10;

                  return (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <p className="font-medium">{product.name}</p>
                        {product.description ? (
                          <p className="mt-1 text-xs text-gray-400">
                            {product.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="p-3 text-gray-500">
                        {product.category ?? "-"}
                      </td>
                      <td className="p-3">RM{Number(product.price).toFixed(2)}</td>
                      <td className="p-3">
                        <span
                          className={
                            stock <= lowStockThreshold
                              ? "font-medium text-red-600"
                              : ""
                          }
                        >
                          {stock}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            product.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => void handleQuickEdit(product)}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Update Stock / Status
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
