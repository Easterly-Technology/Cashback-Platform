import { cache } from "react";
import { prisma } from "@cashback/database";

export type MerchantProductRow = {
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
};

export async function getMerchantProductsUncached(
  merchantId: string,
): Promise<MerchantProductRow[]> {
  const products = await prisma.product.findMany({
    where: { merchantId },
    include: { inventory: true },
    orderBy: { createdAt: "desc" },
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: Number(product.price),
    status: product.status as MerchantProductRow["status"],
    inventory: product.inventory
      ? {
          quantity: Number(product.inventory.quantity),
          lowStockThreshold: Number(product.inventory.lowStockThreshold),
        }
      : null,
  }));
}

export const getMerchantProducts = cache(getMerchantProductsUncached);
