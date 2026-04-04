import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@cashback/database";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

type MarketplacePageProps = {
  searchParams: Promise<{
    category?: string;
    merchant?: string;
  }>;
};

function buildMarketplaceHref(filters: {
  category?: string | null;
  merchant?: string | null;
}) {
  const params = new URLSearchParams();

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.merchant) {
    params.set("merchant", filters.merchant);
  }

  const query = params.toString();
  return query ? `/marketplace?${query}` : "/marketplace";
}

export default async function MarketplacePage({
  searchParams,
}: MarketplacePageProps) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  const params = await searchParams;
  const catalogWhere = {
    status: "ACTIVE" as const,
    merchant: { status: "ACTIVE" as const },
  };

  const [products, allProducts, merchants] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...catalogWhere,
        ...(params.category ? { category: params.category } : {}),
        ...(params.merchant ? { merchantId: params.merchant } : {}),
      },
      include: {
        merchant: { select: { id: true, name: true } },
        inventory: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.product.findMany({
      where: catalogWhere,
      select: {
        category: true,
        merchantId: true,
      },
    }),
    prisma.merchant.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const categories = Array.from(
    new Set(
      allProducts
        .map((product) => product.category)
        .filter((category): category is string => Boolean(category)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const activeMerchantIds = new Set(allProducts.map((product) => product.merchantId));
  const catalogMerchants = merchants.filter((merchant) =>
    activeMerchantIds.has(merchant.id),
  );

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <span className="material-chip">Marketplace</span>
        <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">
          Marketplace
        </p>
        <h1 className="material-title mt-2 text-slate-950">
          Product Catalog
        </h1>
        <p className="material-subtitle mt-3">
          Browse what partner merchants are offering before you visit. Complete your purchase in-store, then scan the receipt to earn tokens.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="material-stat p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Products
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {allProducts.length.toLocaleString()}
            </p>
          </div>
          <div className="material-stat p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Merchants
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {catalogMerchants.length.toLocaleString()}
            </p>
          </div>
          <div className="material-stat p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Categories
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {categories.length.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="material-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/marketplace"
            className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
              !params.category && !params.merchant
                ? "material-button-primary"
                : "material-button-outlined"
            }`}
          >
            All Products
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={buildMarketplaceHref({
                category,
                merchant: params.merchant ?? null,
              })}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                params.category === category
                  ? "material-button-primary"
                  : "material-button-outlined"
              }`}
            >
              {category}
            </Link>
          ))}
        </div>

        {catalogMerchants.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {catalogMerchants.map((merchant) => (
              <Link
                key={merchant.id}
                href={buildMarketplaceHref({
                  category: params.category ?? null,
                  merchant: merchant.id,
                })}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  params.merchant === merchant.id
                    ? "material-button-tonal"
                    : "material-button-outlined"
                }`}
              >
                {merchant.name}
              </Link>
            ))}
            {params.merchant ? (
              <Link
                href={buildMarketplaceHref({
                  category: params.category ?? null,
                })}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                Clear merchant
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {products.length === 0 ? (
        <div className="material-empty px-6 py-12 text-center">
          <p className="text-base font-medium text-slate-700">
            No products match the current filters.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Try a different category or merchant to widen the catalog.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((product) => {
            const stock = product.inventory?.quantity ?? 0;
            const stockTone =
              stock <= 0
                ? "bg-red-50 text-red-600"
                : stock <= (product.inventory?.lowStockThreshold ?? 10)
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700";

            return (
              <div
                key={product.id}
                className="material-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {product.category ?? "General"}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">
                      {product.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {product.merchant.name}
                    </p>
                  </div>
                  <div className="rounded-[22px] bg-slate-950 px-3 py-2 text-right text-white shadow-lg shadow-slate-900/10">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Price
                    </p>
                    <p className="text-lg font-semibold">
                      RM{Number(product.price).toFixed(2)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 min-h-12 text-sm leading-6 text-slate-600">
                  {product.description?.trim() ||
                    "Available in-store from this partner merchant. Scan your receipt after checkout to receive token rewards."}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className={`rounded-full px-3 py-2 text-xs font-semibold ${stockTone}`}>
                    {stock <= 0
                      ? "Sold out"
                      : `${stock.toLocaleString()} in stock`}
                  </span>
                  <Link
                    href="/exchange"
                    className="material-button-outlined px-3 py-2 text-xs font-semibold"
                  >
                    Go to Exchange
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
