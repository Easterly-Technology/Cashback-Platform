-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "merchant_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "admin_role" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "transaction_status" AS ENUM ('PENDING', 'CONFIRMED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "qr_code_status" AS ENUM ('PENDING', 'SCANNED', 'CONFIRMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "listing_status" AS ENUM ('ACTIVE', 'EXHAUSTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "settlement_status" AS ENUM ('PENDING', 'INVOICED', 'PAID');

-- CreateEnum
CREATE TYPE "withdrawal_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "actor_type" AS ENUM ('USER', 'MERCHANT', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "system_job_run_status" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "announcement_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "announcement_audience" AS ENUM ('ALL_USERS');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "bank_info" JSONB,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "contact_email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rebate_pct" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    "service_fee_pct" DECIMAL(5,4) NOT NULL DEFAULT 0.03,
    "status" "merchant_status" NOT NULL DEFAULT 'PENDING',
    "bank_info" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "admin_role" NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(18,4) NOT NULL,
    "category" VARCHAR(100),
    "status" "product_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "qr_code_id" UUID,
    "total_amount" DECIMAL(18,4) NOT NULL,
    "rebate_amount" DECIMAL(18,4) NOT NULL,
    "service_fee" DECIMAL(18,4) NOT NULL,
    "status" "transaction_status" NOT NULL DEFAULT 'PENDING',
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_items" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(18,4) NOT NULL,
    "line_total" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_qr_codes" (
    "id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "hmac" VARCHAR(64) NOT NULL,
    "status" "qr_code_status" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_token_entitlements" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "total_spending" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "entitled_tokens" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "released_tokens" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "available_tokens" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "release_start_date" DATE,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_token_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_release_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "release_date" DATE NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "cumulative" DECIMAL(18,4) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_release_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_token_pool" (
    "id" UUID NOT NULL,
    "pool_date" DATE NOT NULL,
    "total_spending" DECIMAL(18,4) NOT NULL,
    "pool_value" DECIMAL(18,4) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_token_pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_listings" (
    "id" UUID NOT NULL,
    "listing_date" DATE NOT NULL,
    "price_tier" DECIMAL(4,2) NOT NULL,
    "total_quantity" DECIMAL(18,4) NOT NULL,
    "remaining_qty" DECIMAL(18,4) NOT NULL,
    "status" "listing_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(100),
    "token_amount" DECIMAL(18,4) NOT NULL,
    "price_per_token" DECIMAL(4,2) NOT NULL,
    "cash_value" DECIMAL(18,4) NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'FILLED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_settlements" (
    "id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "total_rebate" DECIMAL(18,4) NOT NULL,
    "total_service_fee" DECIMAL(18,4) NOT NULL,
    "total_owed" DECIMAL(18,4) NOT NULL,
    "status" "settlement_status" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "status" "withdrawal_status" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "actor_type" "actor_type" NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(50) NOT NULL,
    "resource_id" UUID,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "system_job_runs" (
    "id" UUID NOT NULL,
    "job_name" VARCHAR(80) NOT NULL,
    "status" "system_job_run_status" NOT NULL DEFAULT 'RUNNING',
    "summary" JSONB,
    "error" TEXT,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ,
    "triggered_by" UUID,

    CONSTRAINT "system_job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" TEXT NOT NULL,
    "status" "announcement_status" NOT NULL DEFAULT 'DRAFT',
    "audience" "announcement_audience" NOT NULL DEFAULT 'ALL_USERS',
    "created_by" UUID,
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_contact_email_key" ON "merchants"("contact_email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "products_merchant_id_idx" ON "products"("merchant_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_product_id_key" ON "inventory"("product_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_created_at_idx" ON "transactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "transactions_merchant_id_created_at_idx" ON "transactions"("merchant_id", "created_at");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

-- CreateIndex
CREATE INDEX "transaction_qr_codes_merchant_id_idx" ON "transaction_qr_codes"("merchant_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_token_entitlements_user_id_key" ON "user_token_entitlements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "token_release_log_user_id_release_date_key" ON "token_release_log"("user_id", "release_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_token_pool_pool_date_key" ON "daily_token_pool"("pool_date");

-- CreateIndex
CREATE INDEX "marketplace_listings_listing_date_price_tier_idx" ON "marketplace_listings"("listing_date", "price_tier");

-- CreateIndex
CREATE INDEX "marketplace_orders_user_id_created_at_idx" ON "marketplace_orders"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_orders_user_id_idempotency_key_key" ON "marketplace_orders"("user_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "withdrawal_requests_user_id_idx" ON "withdrawal_requests"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_type_actor_id_created_at_idx" ON "audit_logs"("actor_type", "actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "system_job_runs_job_name_started_at_idx" ON "system_job_runs"("job_name", "started_at");

-- CreateIndex
CREATE INDEX "system_job_runs_status_started_at_idx" ON "system_job_runs"("status", "started_at");

-- CreateIndex
CREATE INDEX "announcements_status_published_at_idx" ON "announcements"("status", "published_at");

-- CreateIndex
CREATE INDEX "announcements_audience_status_idx" ON "announcements"("audience", "status");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_qr_code_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "transaction_qr_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_qr_codes" ADD CONSTRAINT "transaction_qr_codes_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_token_entitlements" ADD CONSTRAINT "user_token_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_release_log" ADD CONSTRAINT "token_release_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "marketplace_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_settlements" ADD CONSTRAINT "merchant_settlements_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_job_runs" ADD CONSTRAINT "system_job_runs_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
