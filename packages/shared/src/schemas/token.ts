import { z } from "zod";

export const tokenSettingsSchema = z.object({
  tokenMultiplier: z.number().positive().optional(),
  tokenReleaseRate: z.number().positive().max(1).optional(),
  marketplaceEnabled: z.boolean().optional(),
});

export type TokenSettingsInput = z.infer<typeof tokenSettingsSchema>;

export const adminTokenSettingsSchema = z.object({
  multiplier: z.number().positive().max(100),
  releaseRate: z.number().positive().max(100),
  marketplaceEnabled: z.boolean(),
});

export type AdminTokenSettingsInput = z.infer<typeof adminTokenSettingsSchema>;
