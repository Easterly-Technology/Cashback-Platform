import { redirect } from "next/navigation";
import { ProductsManager } from "./products-manager";
import { auth } from "@/lib/auth";
import { getMerchantProducts } from "@/lib/products";

export default async function ProductsPage() {
  const session = await auth();
  const merchantId = (session?.user as { id?: string } | undefined)?.id;

  if (!merchantId) {
    redirect("/login?callbackUrl=%2Fproducts");
  }

  const products = await getMerchantProducts(merchantId);

  return <ProductsManager initialProducts={products} />;
}
