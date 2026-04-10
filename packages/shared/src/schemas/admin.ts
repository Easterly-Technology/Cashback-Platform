import { z } from "zod";

export const adminUserStatusSchema = z.enum([
  "ACTIVE",
  "SUSPENDED",
  "BANNED",
]);

export const adminUserStatusUpdateSchema = z.object({
  status: adminUserStatusSchema,
});

export type AdminUserStatusUpdateInput = z.infer<
  typeof adminUserStatusUpdateSchema
>;

export const adminMerchantStatusSchema = z.enum([
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
]);

export const adminMerchantStatusUpdateSchema = z.object({
  status: adminMerchantStatusSchema,
});

export type AdminMerchantStatusUpdateInput = z.infer<
  typeof adminMerchantStatusUpdateSchema
>;

export const adminTransactionStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "DISPUTED",
  "CANCELLED",
]);

export const adminTransactionStatusUpdateSchema = z.object({
  status: adminTransactionStatusSchema,
});

export type AdminTransactionStatusUpdateInput = z.infer<
  typeof adminTransactionStatusUpdateSchema
>;

export const adminSettlementStatusSchema = z.enum([
  "PENDING",
  "INVOICED",
  "PAID",
]);

export const adminSettlementUpdateSchema = z
  .object({
    status: adminSettlementStatusSchema.optional(),
    invoiceReference: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .nullable()
      .optional(),
  })
  .refine(
    (value) =>
      value.status !== undefined || value.invoiceReference !== undefined,
    {
      message: "At least one settlement field must be updated",
    },
  );

export type AdminSettlementUpdateInput = z.infer<
  typeof adminSettlementUpdateSchema
>;

export const adminResourceTypeSchema = z.enum([
  "USER",
  "MERCHANT",
  "TRANSACTION",
  "WITHDRAWAL_REQUEST",
  "ANNOUNCEMENT",
  "SETTLEMENT",
]);

export const adminNoteCreateSchema = z.object({
  resourceType: adminResourceTypeSchema,
  resourceId: z.string().uuid(),
  body: z.string().trim().min(2).max(2000),
});

export type AdminNoteCreateInput = z.infer<typeof adminNoteCreateSchema>;

export const bulkIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export const adminUserBulkStatusUpdateSchema = bulkIdsSchema.extend({
  status: adminUserStatusSchema,
});

export const adminMerchantBulkStatusUpdateSchema = bulkIdsSchema.extend({
  status: adminMerchantStatusSchema,
});

export const adminWithdrawalBulkStatusUpdateSchema = bulkIdsSchema.extend({
  status: z.enum(["APPROVED", "REJECTED", "COMPLETED"]),
});

export const announcementStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

export const announcementAudienceSchema = z.enum([
  "ALL_USERS",
  "ACTIVE_USERS",
  "MERCHANTS",
]);

const publishAtSchema = z.string().trim().min(1).max(40).nullable().optional();

export const announcementCreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(10).max(5000),
  audience: announcementAudienceSchema.optional().default("ALL_USERS"),
  isPinned: z.boolean().optional().default(false),
  publishNow: z.boolean().optional().default(false),
  publishAt: publishAtSchema,
});

export type AnnouncementCreateInput = z.infer<
  typeof announcementCreateSchema
>;

export const announcementUpdateSchema = z
  .object({
    status: announcementStatusSchema.optional(),
    title: z.string().trim().min(3).max(160).optional(),
    body: z.string().trim().min(10).max(5000).optional(),
    audience: announcementAudienceSchema.optional(),
    isPinned: z.boolean().optional(),
    publishNow: z.boolean().optional(),
    publishAt: publishAtSchema,
  })
  .refine(
    (value) =>
      value.status !== undefined ||
      value.title !== undefined ||
      value.body !== undefined ||
      value.audience !== undefined ||
      value.isPinned !== undefined ||
      value.publishNow !== undefined ||
      value.publishAt !== undefined,
    {
      message: "At least one announcement field must be updated",
    },
  );

export type AnnouncementUpdateInput = z.infer<
  typeof announcementUpdateSchema
>;

export const announcementBulkUpdateSchema = bulkIdsSchema.extend({
  action: z.enum(["publish", "archive", "restore", "pin", "unpin"]),
});

export type AnnouncementBulkUpdateInput = z.infer<
  typeof announcementBulkUpdateSchema
>;

export const adminRoleSchema = z.enum(["SUPER_ADMIN", "ADMIN"]);

export const adminPlatformSettingsSchema = z.object({
  defaultRebatePct: z.number().min(0).max(100),
  defaultServiceFeePct: z.number().min(0).max(100),
  tokenMultiplier: z.number().positive().max(100),
  tokenReleaseRate: z.number().positive().max(100),
  marketplaceEnabled: z.boolean(),
  marketplacePriceTiers: z.array(z.number().positive().max(100)).min(1).max(30),
  marketplaceDistribution: z.record(
    z.string(),
    z.number().min(0).max(1),
  ),
});

export type AdminPlatformSettingsInput = z.infer<
  typeof adminPlatformSettingsSchema
>;
