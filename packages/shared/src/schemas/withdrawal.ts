import { z } from "zod";

export const bankInfoSchema = z.object({
  accountHolderName: z.string().trim().min(1).max(100),
  bankName: z.string().trim().min(1).max(120),
  accountNumber: z
    .string()
    .trim()
    .min(4)
    .max(34)
    .regex(/^[A-Za-z0-9 -]+$/, "Account number contains invalid characters"),
});

export type BankInfoInput = z.infer<typeof bankInfoSchema>;

export function parseBankInfo(value: unknown): BankInfoInput | null {
  const parsed = bankInfoSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export const withdrawalRequestSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .refine(
      (value) => Math.round(value * 100) === value * 100,
      "Amount must use at most 2 decimal places",
    ),
});

export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;

export const withdrawalStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
]);

export type WithdrawalStatusValue = z.infer<typeof withdrawalStatusSchema>;

export const withdrawalStatusUpdateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "COMPLETED"]),
});

export type WithdrawalStatusUpdateInput = z.infer<
  typeof withdrawalStatusUpdateSchema
>;
