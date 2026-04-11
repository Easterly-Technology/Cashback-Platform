import { NextRequest } from "next/server";
import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import {
  createProductSchema,
  updateInventorySchema,
  updateProductSchema,
} from "@cashback/shared";
import { auth } from "@/lib/auth";
import { getMerchantProductsUncached } from "@/lib/products";

export async function GET() {
  const session = await auth();
  const merchantId = (session?.user as { id?: string } | undefined)?.id;
  if (!merchantId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json(await getMerchantProductsUncached(merchantId));
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const merchantId = (session?.user as { id?: string } | undefined)?.id;
    if (!merchantId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        merchantId,
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        category: parsed.data.category,
        status: "ACTIVE",
      },
    });

    await prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: parsed.data.initialStock,
        lowStockThreshold: parsed.data.lowStockThreshold,
      },
    });

    await writeAuditLog(prisma, {
      actorType: "MERCHANT",
      actorId: merchantId,
      action: "CREATE_PRODUCT",
      resourceType: "PRODUCT",
      resourceId: product.id,
      details: {
        name: product.name,
        price: product.price.toString(),
        initialStock: parsed.data.initialStock,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json(product, { status: 201 });
  } catch (error) {
    console.error("[MERCHANT] Product creation failed:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    const merchantId = (session?.user as { id?: string } | undefined)?.id;
    if (!merchantId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body?.productId || typeof body.productId !== "string") {
      return Response.json({ error: "productId is required" }, { status: 400 });
    }

    const parsedProduct = body.product
      ? updateProductSchema.safeParse(body.product)
      : null;
    const parsedInventory = body.inventory
      ? updateInventorySchema.safeParse(body.inventory)
      : null;

    if (parsedProduct && !parsedProduct.success) {
      return Response.json({ error: parsedProduct.error.flatten() }, { status: 400 });
    }

    if (parsedInventory && !parsedInventory.success) {
      return Response.json({ error: parsedInventory.error.flatten() }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: body.productId, merchantId },
      include: { inventory: true },
    });

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedProduct = parsedProduct
        ? await tx.product.update({
            where: { id: product.id },
            data: parsedProduct.data,
          })
        : product;

      const updatedInventory = parsedInventory
        ? await tx.inventory.update({
            where: { productId: product.id },
            data: parsedInventory.data,
          })
        : product.inventory;

      return { updatedProduct, updatedInventory };
    });

    await writeAuditLog(prisma, {
      actorType: "MERCHANT",
      actorId: merchantId,
      action: "UPDATE_PRODUCT",
      resourceType: "PRODUCT",
      resourceId: product.id,
      details: {
        product: parsedProduct?.data ?? null,
        inventory: parsedInventory?.data ?? null,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({
      ...updated.updatedProduct,
      inventory: updated.updatedInventory,
    });
  } catch (error) {
    console.error("[MERCHANT] Product update failed:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
