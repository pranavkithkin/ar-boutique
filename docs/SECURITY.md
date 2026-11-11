# Security Requirements

> Security is part of every task, not something added just before launch.

## Authentication
- Customers sign in with Clerk. Admins sign in with Supabase Auth plus TOTP 2FA (`aal2`); they're invite only and public sign-up is disabled.
- `/account/*` requires a Clerk session. `/admin/*` (except `/admin/login` and `/admin/mfa`) requires an `aal2` admin session.
- `proxy.ts` only redirects. Every Server Action and Route Handler checks auth itself with `requireCustomer()` or `requireAdmin()`.
- On the server, verify admin sessions with `supabase.auth.getClaims()`; never trust `getSession()`.

## Authorization
- Customers can only read their own orders, invoices and returns (RLS on `auth.jwt()->>'sub'`).
- Admin data and actions require `is_admin()`: Supabase issuer, `user_role = 'admin'`, `aal2`, active `admin_users` row.
- Deactivated admins lose access immediately (checked inside `is_admin()`).
- Refund authorization exception (ADR-040): verified signed-in admins with the admin role and an active `admin_users` row may issue refunds without 2FA.
- Refunds can never exceed the refundable balance. Every admin change is written to `audit_log`, including stock sheet applies and every COD action (confirm, cancel, ship, cash collected, returned to sender, payout).
- Only admins with `aal2` can upload, apply or export the stock sheet.
- Invoice and credit note downloads check ownership (customer) or admin access.
- Visitors and customers can never read stock counts. The storefront gets statuses from `variant_availability()` (ADR-026).

## Secrets
- Never expose secrets to client-side code. Only `NEXT_PUBLIC_*` values reach the browser, and they must be safe to publish.
- Server-only modules start with `import 'server-only'`.
- Real values live in `.env.local` (local) and Vercel environment variables (preview, production), with separate keys per environment.
- `.env*` files are git-ignored except `.env.example`. That includes `.env.sentry-build-plugin`, which the Sentry wizard creates.
- The Sentry DSN is public by design. `SENTRY_AUTH_TOKEN` is build-only and never gets a `NEXT_PUBLIC_` prefix.
- If a key leaks, rotate it immediately and record it in `MEMORY.md`.

## Database
- RLS on every table, deny by default, with tests in `supabase/tests`.
- Never use `auth.uid()` in a policy (ADR-005).
- Orders, stock, returns and refunds change only through Postgres functions that check the current state.
- SKU uniqueness (ignoring letter case), one SKU per colourway and size (including no size), a required style code on every colourway, and a SKU's link to its own product's colour are database constraints, not just form checks.
- `security definer` functions set an explicit `search_path`.
- The secret key is used only in webhooks, cron jobs and PDF generation.

## Payments
- Card details never touch our servers (Stripe hosted Checkout).
- Prices, totals, delivery fee and VAT are always calculated on the server from the database.
- Only the signed Stripe webhook can mark a card order paid. Only an `aal2` admin action (cash collected) can mark a COD order paid.
- COD orders are created only by `place_cod_order()`, which checks again inside the transaction: COD on, signed in, total within the maximum, no other open COD order, refusals below the limit (per account and per phone number), not turned off for this customer, prices, fee and stock. The payment method, totals and fee from the browser are never trusted.
- One COD order per cart: a unique idempotency key on `orders`, so double clicks and retries return the same order.
- Webhooks: verify the signature on the raw body, store event IDs, ignore duplicates.
- Idempotency keys on Checkout Session creation (order ID) and refunds (refund ID).

## Input
- Validate every Server Action and Route Handler input with Zod: types, lengths, enums, quantities.
- Never trust IDs from the browser: reload the record and check ownership and status. A cart line's SKU is re-checked on the server (active, colour visible, product published, in stock).
- Limit text lengths (for example, return comments to 1,000 characters).
- Delivery details: UAE mobile numbers only (`+971` and a valid mobile prefix), the emirate from a fixed list, every field length-limited.
- Blog content is stored as Tiptap JSON and rendered with an allow-list. Never render raw HTML.

## APIs
- Stripe and Clerk webhooks reject requests without a valid signature.
- Cron routes require `Authorization: Bearer <CRON_SECRET>`.
- Validate request bodies and parameters. Return only the fields the caller needs, and never stack traces.
- `/api/health` returns only `ok` or `degraded`, never internal details.
- The Sentry tunnel (`/sentry-tunnel`) only forwards to our own Sentry project, and `proxy.ts` excludes it.
- Rate limit checkout start and placing COD orders (so bots can't hold stock), return submission, upload signing and stock sheet uploads. Supabase rate-limits admin login.

## File Uploads
Validate:
- **File type:** images only (JPEG, PNG, WebP). Test iPhone photo uploads in QA.
- **File size:** reject originals over 10 MB; compress in the browser to about 2 MB before upload.
- **Filename:** never use the client's filename; public IDs are generated on the server.

Also:
- Uploads go straight from the browser to Cloudinary using signed parameters generated by our server. The server verifies type and size upon completion. The API secret is server-only. Cloudinary signatures expire in 1 hour. Strict transformations prevent random size variations.
- R2 links can't limit file size, so after every upload the server checks the size (10 MB at most) and type, and sharp must be able to read it as an image. Anything else is deleted and rejected.
- Copies made by sharp carry no metadata (GPS, camera details). Return photos are re-saved with sharp for the same reason.
- Product photos are signed for admins only, into `products/{productId}/{productColourId}/`. On save, the server checks every key is inside that folder.
- Return photos: private bucket, `returns/{orderId}/{draftId}/` folder, max 5, signed only for the order's owner on an eligible order.
- The private bucket (originals and return photos) never gets a public address. The public bucket holds only the resized copies.
- One R2 API token per environment, "Object Read & Write", limited to that environment's two buckets, server only. CORS allows `PUT` from that environment's own site only.
- Admins view return photos only through signed links that expire after 1 hour. Photos are deleted 90 days after the return closes.
- Category, banner and blog uploads are signed for admins only.

## Stock Sheet Upload
- Admins with `aal2` only, rate limited, written to `audit_log`.
- `.xlsx` or `.csv` only, checked by content, not just the extension (an .xlsx must be a valid workbook). Macro files (`.xlsm`) are rejected.
- At most 5 MB, 5,000 rows and 60 columns; the unzipped workbook at most 50 MB (stops zip bombs).
- Parsed on the server in memory. The file itself is never stored, public or uploaded to R2; only the parsed rows are kept, and deleted after 24 hours if not applied.
- Formulas are never run: only the values saved in the file are read.
- The file name is shown as plain text only and never used as a path.
- Export: admins only, `.xlsx` text cells (no formulas), so a value like `=HYPERLINK(...)` can't run in Excel. The stock sheet holds no customer data.

## Platform
- HTTPS everywhere (Vercel) with HSTS.
- Security headers: Content Security Policy (allow Stripe, Clerk, Supabase, GTM and PostHog; `img-src` adding `res.cloudinary.com`; `connect-src` adding `api.cloudinary.com`; Sentry events go through our own tunnel, and Sentry Replay needs `worker-src 'self' blob:`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'`.
- Next.js >= 16.3.8. Upgrade within days of any critical advisory (another critical fix is pending upstream).
- Images come only from our media domain through our loader; production turns off the `r2.dev` address.
- Dependabot and `npm audit` run in CI.

## Personal Data
- Collect only what orders need: name, email, phone, address. The phone number is also used to confirm COD orders.
- Bank details for COD refunds are never stored. The admin records only the amount, date and transfer reference.
- No card data is stored.
- Account deletion anonymises the profile and keeps orders and invoices for tax records.
- PostHog masks inputs. Never send personal data to analytics.
- Sentry: `sendDefaultPii` off; `beforeSend` and `beforeSendLog` strip emails, phone numbers, addresses, cookies, auth headers and tokens. Tag events with order, return or refund IDs, never names or emails.
- Sentry Replay masks all text and inputs, blocks media, records only when an error happens, and never runs on `/admin`.
- Pick Sentry's data region (EU or US) when creating the organisation. It can't be changed later.
- The client's adviser confirms UAE data-protection duties, including where Sentry stores data.

## Security Checklist (before every production deploy)
- [ ] No secrets in Git (secret scanning on)
- [ ] Every new action and route checks auth on the server
- [ ] Authorization verified: customer A can't read customer B; admin needs `aal2`
- [ ] RLS on for every table; RLS tests pass; stock counts not readable by visitors or customers
- [ ] Input validated on every new action and route
- [ ] Webhooks verified and safe to replay
- [ ] COD rules enforced on the server, even when the browser sends a COD order directly
- [ ] Stock sheet upload limits enforced: admin only, type, size, rows, no formulas run
- [ ] Upload rules enforced: type, size, ownership, folder
- [ ] No personal data in Sentry events, logs or replays
- [ ] Dependencies patched; Next.js advisories checked
