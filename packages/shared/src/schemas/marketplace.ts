import { z } from "zod";

export const marketplaceBuySchema = z.object({
  listingId: z.string().uuid(),
  tokenAmount: z.number().int().positive(),
});

export type MarketplaceBuyInput = z.infer<typeof marketplaceBuySchema>;

export const marketplaceIdempotencyKeySchema = z
  .string()
  .min(8)
  .max(100)
  .regex(/^[A-Za-z0-9._:-]+$/);
