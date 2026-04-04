# Cashback System MVP - Implementation Plan

## Context

Build a SaaS cashback platform MVP to validate market fit. Central platform connects merchants and consumers — users shop at partner merchants, scan receipts, earn tokens daily, and compete in a marketplace to convert tokens to cash. The system must be simple, fast to ship, and production-ready with CI/CD, multi-env, logging, and audit.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 14+ (App Router)** × 3 apps | Single codebase pattern, SSR + API routes |
| Language | **TypeScript** | Type safety for financial math |
| Database | **PostgreSQL 15+** | ACID transactions, row locking for marketplace |
| ORM | **Prisma** | Type-safe queries, migrations |
| Auth | **NextAuth.js v5** | Per-portal credential auth, session management |
| Monorepo | **Turborepo + pnpm** | Shared packages across 3 apps |
| Jobs | **Vercel Cron + API Routes** | Daily jobs triggered via Vercel Cron → serverless API routes |
| UI | **Tailwind CSS + shadcn/ui** | Fast, consistent UI |
| Validation | **Zod** | Shared frontend + API schemas |
| Logging | **pino** | Structured JSON logs |
| Deploy | **Vercel + Neon Postgres** | Next.js 原生支持, serverless, 免费tier够MVP用 |
| QR Code | **qrcode** npm package | 商家端生成交易二维码 |

---

## Project Structure

```
cashback-system/
├── .github/workflows/          # CI/CD pipelines
│   ├── ci.yml                  # PR: lint, typecheck, test
│   ├── deploy-qa.yml           # merge to main → QA
│   └── deploy-prod.yml         # release tag → prod
├── docker/
│   ├── docker-compose.yml      # postgres, minio, mailhog
│   └── Dockerfile.app          # multi-stage build
├── packages/
│   ├── database/               # Prisma schema, client, migrations, seed, audit middleware
│   └── shared/                 # Zod schemas, types, constants, token-math utils, logger
├── apps/
│   ├── admin/                  # Platform admin portal
│   ├── merchant/               # Merchant portal
│   └── user/                   # User portal
├── turbo.json
├── package.json
├── .env.example / .env.development / .env.qa / .env.production
└── tsconfig.base.json
```

---

## Database Schema (Core Tables)

**Identity:** `users`, `merchants`, `admins`
**Catalog:** `products`, `inventory`
**Transactions:** `transactions`, `transaction_items`, `transaction_qr_codes`
**Token System:** `user_token_entitlements`, `token_release_log`, `daily_token_pool`
**Marketplace:** `marketplace_listings`, `marketplace_orders`
**Finance:** `merchant_settlements`, `withdrawal_requests`
**Platform:** `audit_logs`, `platform_settings`

Key design decisions:
- All monetary values: `DECIMAL(18,4)` — no floats
- `audit_logs` uses JSONB for before/after snapshots
- `marketplace_listings` uses `SELECT FOR UPDATE` row locking to prevent overselling
- `token_release_log` has `UNIQUE(user_id, release_date)` for idempotent daily releases
- `platform_settings` is key-value with JSONB values for admin-controlled variables

---

## Token Mechanism

### Transaction Flow (QR Scan)
1. **商家端**：商家输入用户消费金额 + 购买的商品明细 → 系统生成含交易信息的 QR 码
2. **用户端**：用户用手机摄像头扫码 → 跳转到用户界面，系统显示此笔消费详情
3. **用户确认**：用户点击确认上传 → 交易记录写入系统，状态为 `confirmed`
4. **立即更新**：`user_token_entitlements.total_spending` 原子更新，UI 立即显示新的 entitled tokens
5. **entitled_tokens = total_spending × 2**
6. 商家界面 + 平台界面同步更新：商家欠平台总金额、交易历史

### Daily Token Release (midnight cron)
```
daily_release = entitled_tokens × 0.5%
released_tokens += daily_release (capped at entitled_tokens)
available_tokens += daily_release
```
Takes 200 days (1/0.005) to fully release. New spending increases entitled_tokens → larger daily releases.

### Daily Token Pool (midnight cron)
```
pool_value = SUM(yesterday's confirmed transactions × merchant rebate %)
```

### Marketplace Generation (midnight, after pool calc)
- 10 price tiers: ¥0.10 to ¥1.00
- Distribution configurable by admin (more tokens at lower prices)
- Platform sells, users buy with their available tokens → convert to withdrawable cash

### Marketplace Buy (transactional)
```sql
BEGIN;
SELECT remaining_qty FROM marketplace_listings WHERE id = ? FOR UPDATE;
-- validate sufficient remaining + user balance
UPDATE marketplace_listings SET remaining_qty -= amount;
UPDATE user_token_entitlements SET available_tokens -= amount;
INSERT INTO marketplace_orders (...);
COMMIT;
```

---

## Three Portals

### Admin Portal (`apps/admin/`)
- Dashboard: platform-wide metrics, daily volumes, token pool trends (recharts)
- Merchant management: approve, suspend, edit rebate %
- User management: view activity, suspend
- Transaction oversight: filter, override status
- Token settings: release rate, multiplier, marketplace distribution
- Audit log viewer with filters
- Settlement management: mark merchant payments as received

### Merchant Portal (`apps/merchant/`)
- Dashboard: amount owed to platform, recent transactions (实时更新)
- Product CRUD + inventory management
- **交易录入 + QR生成**：输入用户消费金额和商品明细 → 生成 QR 码供用户扫码
- Transaction history (read-only, cannot tamper after confirmation)
- Settlement view: current period + history
- 所有操作被审计，商家不能篡改交易记录

### User Portal (`apps/user/`)
- Dashboard: total spending, entitled/released/available tokens
- **扫码确认**：扫商家 QR 码 → 查看消费详情 → 确认上传到系统
- 消费历史 + 上传确认历史
- Token balance + release history
- Marketplace: exchange-like UI (order book, buy form, trade history)
- Transaction history
- Withdrawal requests (admin processes manually for MVP)

---

## Additions Beyond Requirements

1. **Withdrawal System** — `withdrawal_requests` table, admin manual processing for MVP
2. **Email Notifications** — via Resend: registration, transaction confirmed, daily digest, order confirmation
3. **Idempotency Keys** — marketplace buy + transaction confirm endpoints
4. **Health Check Endpoints** — `GET /api/health` per app for deployment readiness
5. **Cursor-based Pagination** — all list endpoints
6. **Rate Limiting** — auth: 5/min, marketplace: 30/min
7. **Basic Analytics** — admin dashboard with recharts (DAU, spending volume, pool trends, fill rates)

---

## Security

- bcrypt password hashing, HTTP-only secure cookies, CSRF via NextAuth
- Per-portal middleware: merchants see only their data, users see only theirs
- All token/money ops use DB transactions + row locking, Decimal.js for math
- Transactions immutable post-confirmation, merchants cannot tamper
- Zod validation on every API request, reject negative amounts
- QR codes contain signed payload (HMAC) to prevent forgery
- Prisma parameterized queries (no raw SQL except batch jobs, also parameterized)
- Audit middleware captures all writes to audited tables via AsyncLocalStorage context

---

## Infrastructure

### Local Dev
Docker Compose: PostgreSQL 15, MinIO (S3), MailHog (email)

### CI/CD (GitHub Actions + Vercel)
- **PR:** lint → typecheck → test → migration drift check → Vercel Preview deploy
- **Merge to main:** Vercel auto-deploys to QA (preview branch) → run Prisma migrate on Neon QA branch
- **Release tag:** Prisma migrate on Neon prod → Vercel production deploy

### Environments
`.env.development` / `.env.qa` / `.env.production` — non-secret defaults checked in, secrets via CI/CD env vars.

### Cron Jobs (Vercel Cron)
Daily midnight jobs via `vercel.json` cron config → triggers API routes:
- `/api/cron/token-pool` — calculate daily token pool from yesterday's transactions
- `/api/cron/token-release` — release 0.5% tokens to all eligible users
- `/api/cron/marketplace-generate` — create marketplace listings at price tiers

For MVP user counts, each job fits within Vercel Pro's 300s limit. If user base grows, split into batched execution.

### Monitoring
Vercel Analytics + Sentry free tier for error tracking.

---

## Implementation Phases

### Phase 1: Foundation
- Init Turborepo, 3 Next.js apps, 2 shared packages
- Docker Compose (Postgres, MinIO, MailHog)
- Prisma schema + initial migration + seed (1 admin, 2 merchants, 5 users, 10 products)
- NextAuth setup per portal
- Shared logger (pino) + audit middleware
- GitHub Actions CI

### Phase 2: Core Flows
- Merchant: product CRUD, inventory management
- Merchant: 交易录入界面（输入消费金额+商品）→ 生成 QR 码
- User: registration, login
- User: 扫码页面 → 显示消费详情 → 确认上传交易
- Transaction flow: merchant creates → QR generated → user scans + confirms → system updates
- User dashboard with spending + entitled tokens (实时更新)
- Merchant dashboard with owed amount + transaction history (实时更新)
- Audit logging on all writes

### Phase 3: Token Engine
- `token-math.ts` with exhaustive unit tests
- Vercel Cron → API route jobs: pool calc, token release
- User: token balance + release history views
- Admin: token settings panel

### Phase 4: Marketplace
- Marketplace listing generation job
- User: exchange UI (order book, buy form, trade history)
- Buy flow with row locking + idempotency
- Admin: marketplace monitoring

### Phase 5: Admin + Polish
- Admin dashboard with analytics
- User/merchant management
- Audit log viewer
- Settlement views (merchant + admin)
- Email notifications
- Rate limiting, health checks

### Phase 6: Deploy + Harden
- Vercel project setup (3 apps)
- Neon Postgres: dev / qa / prod branches
- `vercel.json` cron config for daily jobs
- QA deploy + manual testing
- Production deploy
- Sentry error tracking setup

---

## Critical Files (highest risk, review carefully)

| File | Risk |
|------|------|
| `packages/shared/src/utils/token-math.ts` | All financial calculations — bugs = incorrect money |
| `packages/database/prisma/schema.prisma` | Entire data model — wrong = painful migrations |
| `apps/admin/src/app/api/cron/token-release/route.ts` | Must be idempotent, handle 100% cap, batch efficiently |
| `apps/user/src/app/api/marketplace/buy/route.ts` | Row locking, race conditions, double-spend prevention |
| `apps/merchant/src/app/api/transactions/create/route.ts` | QR generation, transaction creation, HMAC signing |
| `packages/database/src/audit-middleware.ts` | Silent failure = audit gaps |

---

## Verification

1. **Local:** `docker compose up` → `pnpm dev` → all 3 portals accessible
2. **Flow test:** Register user → merchant adds product → merchant inputs transaction + generates QR → user scans QR → sees transaction details → confirms upload → check token entitlement updated immediately → trigger cron job manually → verify tokens released → buy from marketplace → verify balance deducted
3. **Admin test:** Login → see transaction → see audit log entry → change token settings → verify next release uses new settings
4. **CI:** Push PR → Actions run lint/typecheck/test → all green
5. **Deploy:** Merge to main → QA auto-deploys → smoke test → tag release → prod deploys
