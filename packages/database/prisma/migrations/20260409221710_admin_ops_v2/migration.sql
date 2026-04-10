-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "announcement_audience" ADD VALUE 'ACTIVE_USERS';
ALTER TYPE "announcement_audience" ADD VALUE 'MERCHANTS';

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "is_pinned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "merchant_settlements" ADD COLUMN     "invoice_reference" VARCHAR(120);

-- CreateTable
CREATE TABLE "admin_notes" (
    "id" UUID NOT NULL,
    "resource_type" VARCHAR(50) NOT NULL,
    "resource_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_notes_resource_type_resource_id_created_at_idx" ON "admin_notes"("resource_type", "resource_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_notes_created_by_created_at_idx" ON "admin_notes"("created_by", "created_at");

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
