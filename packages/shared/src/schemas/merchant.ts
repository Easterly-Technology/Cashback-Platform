import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().max(100).optional(),
  initialStock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().positive().default(10),
});

export const updateProductSchema = createProductSchema
  .omit({ initialStock: true, lowStockThreshold: true })
  .extend({
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .partial();

export const updateInventorySchema = z.object({
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().positive().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
