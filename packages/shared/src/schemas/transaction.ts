import { z } from "zod";

export const createTransactionSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const confirmTransactionSchema = z.object({
  qrCodeId: z.string().uuid(),
  signature: z.string().length(64),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type ConfirmTransactionInput = z.infer<typeof confirmTransactionSchema>;
