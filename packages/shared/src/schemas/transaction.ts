import { z } from "zod";

export const createTransactionSchema = z.object({
  totalAmount: z
    .number()
    .positive("Amount must be greater than zero")
    .refine(
      (value) => Math.round(value * 100) === value * 100,
      "Amount must use at most 2 decimal places",
    ),
});

export const confirmTransactionSchema = z.object({
  qrCodeId: z.string().uuid(),
  signature: z.string().length(64),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type ConfirmTransactionInput = z.infer<typeof confirmTransactionSchema>;
