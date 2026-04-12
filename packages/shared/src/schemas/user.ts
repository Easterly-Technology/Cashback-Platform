import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(100),
  phone: z.string().optional(),
});

export const accountDetailsSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => value || undefined),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type AccountDetailsInput = z.infer<typeof accountDetailsSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
