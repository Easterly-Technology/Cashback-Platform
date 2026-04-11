"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { formatCurrency } from "@cashback/shared/client";
import type { MerchantProductRow as ProductRow } from "@/lib/products";

type FilterValue = "all" | "ACTIVE" | "INACTIVE" | "low-stock" | "out-of-stock";

type CreateFormState = {
  name: string;
  description: string;
  category: string;
  price: string;
  initialStock: string;
  lowStockThreshold: string;
};

type EditFormState = {
  name: string;
  description: string;
  category: string;
  price: string;
  quantity: string;
  lowStockThreshold: string;
  status: ProductRow["status"];
};

const emptyCreateForm: CreateFormState = {
  name: "",
  description: "",
  category: "",
  price: "",
  initialStock: "0",
  lowStockThreshold: "10",
};

const emptyEditForm: EditFormState = {
  name: "",
  description: "",
  category: "",
  price: "",
  quantity: "0",
  lowStockThreshold: "10",
  status: "ACTIVE",
};

const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: "All Products", value: "all" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Low Stock", value: "low-stock" },
  { label: "Out of Stock", value: "out-of-stock" },
];

function toEditForm(product: ProductRow): EditFormState {
  return {
    name: product.name,
    description: product.description ?? "",
    category: product.category ?? "",
    price: String(Number(product.price)),
    quantity: String(product.inventory?.quantity ?? 0),
    lowStockThreshold: String(product.inventory?.lowStockThreshold ?? 10),
    status: product.status,
  };
}

function isLowStock(product: ProductRow) {
  const stock = product.inventory?.quantity ?? 0;
  const threshold = product.inventory?.lowStockThreshold ?? 10;

  return stock <= threshold;
}

function inventoryTone(product: ProductRow) {
  const stock = product.inventory?.quantity ?? 0;

  if (stock === 0) {
    return "bg-rose-50 text-rose-700";
  }

  if (isLowStock(product)) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

export function ProductsManager({
  initialProducts,
}: {
  initialProducts: ProductRow[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingIntent, setSavingIntent] = useState<"create" | "edit" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm);
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);

  const editingProduct =
    products.find((product) => product.id === editingProductId) ?? null;

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load products");
      }

      const data = (await res.json()) as ProductRow[];
      setProducts(data);
    } catch (loadError) {
      console.error(loadError);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!editingProduct) {
      setEditForm(emptyEditForm);
      return;
    }

    setEditForm(toEditForm(editingProduct));
  }, [editingProduct]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        query.length === 0 ||
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query);

      if (!matchesQuery) {
        return false;
      }

      if (filter === "all") {
        return true;
      }

      if (filter === "ACTIVE" || filter === "INACTIVE") {
        return product.status === filter;
      }

      const stock = product.inventory?.quantity ?? 0;

      if (filter === "out-of-stock") {
        return stock === 0;
      }

      return isLowStock(product);
    });
  }, [filter, products, search]);

  const activeCount = useMemo(
    () => products.filter((product) => product.status === "ACTIVE").length,
    [products],
  );
  const lowStockCount = useMemo(
    () => products.filter((product) => isLowStock(product)).length,
    [products],
  );
  const outOfStockCount = useMemo(
    () => products.filter((product) => (product.inventory?.quantity ?? 0) === 0).length,
    [products],
  );
  const totalUnits = useMemo(
    () => products.reduce((sum, product) => sum + (product.inventory?.quantity ?? 0), 0),
    [products],
  );

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setSavingIntent("create");
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description || undefined,
          category: createForm.category || undefined,
          price: Number(createForm.price),
          initialStock: Number(createForm.initialStock),
          lowStockThreshold: Number(createForm.lowStockThreshold),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create product");
      }

      setCreateForm(emptyCreateForm);
      setShowCreateForm(false);
      setNotice("Product added successfully.");
      await loadProducts();
    } catch (createError) {
      console.error(createError);
      setError("Failed to create product");
    } finally {
      setSavingIntent(null);
    }
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault();

    if (!editingProduct) {
      return;
    }

    setSavingIntent("edit");
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: editingProduct.id,
          product: {
            name: editForm.name,
            description: editForm.description || undefined,
            category: editForm.category || undefined,
            price: Number(editForm.price),
            status: editForm.status,
          },
          inventory: {
            quantity: Number(editForm.quantity),
            lowStockThreshold: Number(editForm.lowStockThreshold),
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update product");
      }

      setEditingProductId(null);
      setNotice(`Updated ${editingProduct.name}.`);
      await loadProducts();
    } catch (editError) {
      console.error(editError);
      setError("Failed to update product");
    } finally {
      setSavingIntent(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        <div className="material-card p-6">
          <span className="material-chip">Catalog Control</span>
          <h1 className="material-title mt-4 text-slate-950">
            Products & Inventory
          </h1>
          <p className="material-subtitle mt-3">
            Keep pricing accurate, spot low-stock pressure early, and update inventory without leaving the flow of daily selling.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="material-stat p-5">
            <p className="text-sm text-slate-500">Active Products</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {activeCount.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {products.length.toLocaleString()} total products in catalog
            </p>
          </div>
          <div className="material-stat p-5">
            <p className="text-sm text-slate-500">Inventory Watch</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {lowStockCount.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {outOfStockCount.toLocaleString()} are out of stock right now
            </p>
          </div>
          <div className="material-stat p-5 sm:col-span-2">
            <p className="text-sm text-slate-500">Units On Hand</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {totalUnits.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Total inventory units across the current merchant catalog
            </p>
          </div>
        </div>
      </div>

      <div className="material-card p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products, categories, or descriptions..."
            className="px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              setShowCreateForm((current) => !current);
              setEditingProductId(null);
              setNotice("");
              setError("");
            }}
            className="material-button-primary min-h-11 px-5 py-3 text-sm font-semibold transition hover:translate-y-[-1px]"
          >
            {showCreateForm ? "Close Form" : "Add Product"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                filter === option.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="material-alert material-alert-danger text-sm">{error}</div>
      ) : null}

      {notice ? (
        <div className="material-alert material-alert-info text-sm">{notice}</div>
      ) : null}

      {showCreateForm ? (
        <form onSubmit={handleCreate} className="material-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Add Product</h2>
              <p className="mt-1 text-sm text-slate-500">
                Create a new catalog item and define starting stock in one step.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Product Name
              </label>
              <input
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, name: event.target.value }))
                }
                className="px-3 py-2 text-sm"
                placeholder="e.g. Signature Latte"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Price (RM)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={createForm.price}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, price: event.target.value }))
                }
                className="px-3 py-2 text-sm"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Category
              </label>
              <input
                value={createForm.category}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, category: event.target.value }))
                }
                className="px-3 py-2 text-sm"
                placeholder="e.g. Coffee"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Initial Stock
              </label>
              <input
                type="number"
                min="0"
                value={createForm.initialStock}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    initialStock: event.target.value,
                  }))
                }
                className="px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="px-3 py-2 text-sm"
                placeholder="Optional product description"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                value={createForm.lowStockThreshold}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    lowStockThreshold: event.target.value,
                  }))
                }
                className="px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingIntent === "create"}
            className="material-button-primary mt-5 min-h-11 w-full px-4 py-2 text-sm font-semibold transition hover:translate-y-[-1px] disabled:opacity-50 sm:w-auto"
          >
            {savingIntent === "create" ? "Saving..." : "Save Product"}
          </button>
        </form>
      ) : null}

      {editingProduct ? (
        <form onSubmit={handleSaveEdit} className="material-card-flat p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Edit {editingProduct.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update catalog details, stock quantity, threshold, and publishing status from one panel.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingProductId(null)}
              className="text-sm font-semibold text-slate-500 hover:text-slate-900"
            >
              Close
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Product Name
              </label>
              <input
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, name: event.target.value }))
                }
                className="px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Price (RM)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={editForm.price}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, price: event.target.value }))
                }
                className="px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Category
              </label>
              <input
                value={editForm.category}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, category: event.target.value }))
                }
                className="px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={editForm.status}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    status: event.target.value as ProductRow["status"],
                  }))
                }
                className="px-3 py-2 text-sm"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={editForm.quantity}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, quantity: event.target.value }))
                }
                className="px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                value={editForm.lowStockThreshold}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    lowStockThreshold: event.target.value,
                  }))
                }
                className="px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingIntent === "edit"}
            className="material-button-primary mt-5 min-h-11 w-full px-4 py-2 text-sm font-semibold transition hover:translate-y-[-1px] disabled:opacity-50 sm:w-auto"
          >
            {savingIntent === "edit" ? "Saving..." : "Save Changes"}
          </button>
        </form>
      ) : null}

      <div className="space-y-4 lg:hidden">
        {loading ? (
          <div className="material-card px-6 py-12 text-center text-sm text-slate-400">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="material-empty border-emerald-200 px-6 py-12 text-center">
            <p className="text-base font-medium text-slate-700">
              No products match the current filters.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Adjust your search, switch filters, or add a new product to refresh the catalog view.
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const stock = product.inventory?.quantity ?? 0;

            return (
              <div key={product.id} className="material-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{product.name}</p>
                    {product.description ? (
                      <p className="mt-1 text-sm text-slate-500">{product.description}</p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      product.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
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
                      {formatCurrency(Number(product.price))}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-slate-950 p-3 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-slate-300">Stock</p>
                        <p className="mt-1 text-lg font-semibold">{stock}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${inventoryTone(
                          product,
                        )}`}
                      >
                        Threshold {product.inventory?.lowStockThreshold ?? 10}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProductId(product.id);
                    setShowCreateForm(false);
                    setNotice("");
                    setError("");
                  }}
                  className="material-button-outlined mt-4 min-h-11 w-full px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Edit Product
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
              <tr className="border-b text-left text-slate-500">
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No products match the current filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stock = product.inventory?.quantity ?? 0;

                  return (
                    <tr key={product.id} className="border-b border-slate-100">
                      <td className="p-4">
                        <p className="font-medium text-slate-900">{product.name}</p>
                        {product.description ? (
                          <p className="mt-1 text-xs text-slate-400">
                            {product.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="p-4 text-slate-500">{product.category ?? "-"}</td>
                      <td className="p-4">{formatCurrency(Number(product.price))}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{stock}</span>
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${inventoryTone(
                              product,
                            )}`}
                          >
                            threshold {product.inventory?.lowStockThreshold ?? 10}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            product.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProductId(product.id);
                            setShowCreateForm(false);
                            setNotice("");
                            setError("");
                          }}
                          className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          Edit product
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
