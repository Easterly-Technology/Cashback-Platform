# Performance Baseline

This project treats production builds as the performance source of truth. Dev-mode
bundles are intentionally unminified and can look much larger than what users
receive in production.

## Bundle Analysis

Run these commands when a change can affect shipped JavaScript:

```bash
pnpm analyze:user
pnpm analyze:merchant
pnpm analyze:admin
```

Analyzer output is written by Next.js during the production build. Use it to
confirm route-level chunks, shared chunks, and unexpected browser dependencies.

## Route Budgets

Use the current production build as the committed baseline. A performance PR
should not increase First Load JS for key routes by more than 10% unless the PR
explicitly explains the tradeoff.

Baseline captured after the route-group and server-initial-data pass:

| App | Route | First Load JS |
| --- | --- | ---: |
| User | `/login` | 110 kB |
| User | `/` | 106 kB |
| User | `/exchange` | 109 kB |
| User | `/scan/[id]` | 108 kB |
| User | `/tokens` | 106 kB |
| Merchant | `/login` | 106 kB |
| Merchant | `/` | 106 kB |
| Merchant | `/products` | 106 kB |
| Merchant | `/qr-codes` | 104 kB |
| Merchant | `/transactions` | 106 kB |
| Admin | `/login` | 106 kB |
| Admin | `/` | 106 kB |
| Admin | `/transactions` | 107 kB |
| Admin | `/users` | 108 kB |
| Admin | `/withdrawals` | 108 kB |

Key user routes:

- `/login`
- `/`
- `/exchange`
- `/scan/[id]`
- `/tokens`

Key merchant routes:

- `/login`
- `/`
- `/products`
- `/qr-codes`
- `/transactions`

Key admin routes:

- `/login`
- `/`
- `/transactions`
- `/users`
- `/withdrawals`

## Lighthouse Checks

Run Lighthouse against production-mode local servers or staging for the same
route list above. Track these metrics:

- Largest Contentful Paint
- Interaction to Next Paint
- Cumulative Layout Shift
- Total JavaScript
- Unused JavaScript

## Current Optimization Notes

- Public/auth route groups should not load protected app chrome.
- Merchant QR image generation runs in the server transaction route so `qrcode`
  should not appear in merchant browser bundles.
- User exchange and merchant products render initial data on the server, then use
  client islands for refresh, forms, filters, and mutations.
- User dashboard token/cash summary data is request-scoped and reused by the
  header and active tab.
