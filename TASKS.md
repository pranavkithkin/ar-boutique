# Tasks

> Never ask the AI to build the whole app in one prompt. One task at a time:
> TASK -> Implement -> Test -> Review -> Mark complete -> next TASK.
> Each phase is a vertical slice that ends with a flow working end to end.
> Storefront screens follow `docs/DESIGN.md` (built from the client's reference). Pages the reference doesn't show use the same tokens and components.

Status: `[ ]` to do, `[~]` in progress, `[x]` done

## Phase 0: Client and Design (no code)
- [ ] Get answers to Q1 to Q41 in `docs/PRD.md` and record them in `docs/DECISIONS.md`
- [ ] Confirm budget and timeline for the additions (accounts, returns, admin 2FA, bilingual invoices, stock sheet upload, cash on delivery)
- [x] Design reference received and turned into `docs/DESIGN.md` (6 Oct 2026)
- [ ] AR logo (SVG) and the client's OK on the look (Q17)
- [x] Client's stock sheet received (7 Oct 2026): their own SKUs and style codes, 21 styles, 42 SKUs (Q23)
- [ ] Completed stock sheet back from the client: Size, Product Name, Stock and Category filled, rows 38 to 43 fixed by the client, yellow cells checked (Q26 to Q34, Q41)
- [ ] Courier and cash on delivery answers (Q35 to Q40)
- [ ] Product photos per colour (portrait 4:5, see `docs/DESIGN.md`), product copy and size charts
- [ ] Client's accountant confirms VAT status and the invoice template; legal adviser provides policy texts
- [ ] Domain name and sender email address
- [ ] Cloudinary Free account in the client's name. Setup named transformations (`t_ar_w...`), turn ON strict mode, and configure usage alerts (ADR-038).

## Phase 1: Setup
Done when: an empty app builds, CI is green, a Vercel preview deploys and a test error reaches Sentry.
- [x] TASK-001 Scaffold Next.js 16 (>= 16.3.8) with TypeScript, Tailwind, ESLint, App Router and `src/`. Do this before copying in these docs: `create-next-app` refuses a folder that already has a `README.md`
- [x] TASK-002 Strict TypeScript, Prettier, `@/` path alias and the npm scripts listed in `README.md`
- [x] TASK-003 Create the folder structure from `docs/ARCHITECTURE.md`
- [x] TASK-004 shadcn/ui: `npx shadcn@latest init` with a preset close to `docs/DESIGN.md` (square corners), then set the exact tokens, radius and fonts from `docs/DESIGN.md`; fonts in `src/lib/fonts.ts`; `success` and `warning` in `src/styles/brand.css`; record the preset code in `docs/DESIGN.md`; try one `apply --only theme,font` to prove a re-theme needs no code changes
- [x] TASK-005 `src/lib/env.ts`: validate every environment variable with Zod; keep `.env.example` in sync
- [ ] TASK-006 Supabase CLI: local project, first migration, generated types (`npm run db:types`)
- [ ] TASK-007 Vitest and Playwright set up with one passing test each
- [ ] TASK-008 GitHub repo, protected `main`, GitHub Actions for typecheck, lint, unit tests, build and `npm run check:tokens` (no hard-coded colours or font names in components)
- [ ] TASK-009 Vercel project with preview deployments and staging environment variables
- [ ] TASK-010 `src/lib/money.ts`: fils helpers, `formatAED()`, VAT split (5/105), with unit tests
- [ ] TASK-011 Sentry: `npx @sentry/wizard@latest -i nextjs`, then match "Sentry" in `docs/ARCHITECTURE.md` (sample rates, PII scrubbing, Replay on errors only and not on `/admin`, tunnel route, source maps and environments on Vercel); delete the example page; add `/api/health`; a test error from preview reaches Sentry

## Phase 2: Database Foundation
Done when: core tables exist with RLS and the RLS tests run in CI.
- [ ] TASK-012 Migration: `settings` (one row), `admin_users`, `audit_log`; RLS on, deny by default
- [ ] TASK-013 `is_admin()` SQL helper + pgTAP tests (Clerk-style token denied, `aal1` denied, inactive admin denied)
- [ ] TASK-014 Migration: `categories`, `colours` (name exactly as written, unique; slug; optional swatch colour; no code), `sizes` (label exactly as written, unique; display order; no code); RLS (public read of active rows) + pgTAP
- [ ] TASK-015 Migration: `products` (no price, no style code; `product_group`), `product_colours` (`style_code` required, `details` JSON), `product_images` (per product colour), `product_variants` (one row per SKU: the client's SKU as written, unique ignoring letter case; `size_id` nullable, unique colourway + size with nulls not distinct, no mixing of sized and unsized SKUs; `price_fils`, `compare_at_fils`; composite key to the product colour) with checks and RLS (public read of published products, visible colours and active SKUs) + pgTAP
- [ ] TASK-016 Migration: `stock_levels` (no visitor or customer access) + `variant_availability()` (status only) + pgTAP: visitors and customers can't read counts
- [ ] TASK-017 Migration: `inventory_adjustments` ledger + `adjust_stock()` (reason required, can't drop below held stock); reasons include "stock sheet upload" and "COD refused"
- [x] TASK-018 Seed per `docs/TEST_PLAN.md`: imported client's 21 styles, 42 SKUs, 5 categories, 17 colours, 150 Cloudinary images, 5 units opening stock per SKU in stock_levels with inventory_adjustments ledger rows.
- [ ] TASK-019 Run `supabase test db` in CI

## Phase 3: Admin Access
Done when: an invited admin logs in with 2FA and everyone else is blocked.
- [x] TASK-020 Supabase clients in `lib/supabase/` (browser client, server client with async cookies, service role admin client)
- [x] TASK-021 `/admin/login` (email + password) with loading and error states, connected to Supabase Auth and active admin verification
- [ ] TASK-022 `/admin/mfa`: TOTP enrolment (QR code) and verification; continue only with `aal2`
- [ ] TASK-023 Custom Access Token Hook that adds `user_role: 'admin'` for active admins
- [ ] TASK-024 `proxy.ts` branch for `/admin/*` (session refresh + redirects) and `requireAdmin()`; the matcher excludes the Sentry tunnel
- [ ] TASK-025 Admin shell: sidebar, header, mobile navigation, sign out
- [ ] TASK-026 Staff page: invite, deactivate, reset 2FA; Supabase SMTP set to Resend
- [ ] TASK-027 Audit log helper used by every admin action + audit log page
- [ ] TASK-028 E2E: admin login with 2FA; logged-out and non-2FA users blocked

## Phase 4: Catalogue
Done when: an admin creates a product with colours, photos and sizes, and it's live on the storefront straight away.
- [x] TASK-029 Media upload and deletion on Cloudinary (ADR-038): signed upload & destroy via Server Actions (`uploadProductImageAction`, `deleteProductImageAction`), `guard_image_key` path pattern enforcement, and interactive `ColourwayImageManager` for uploading and deleting product photos per colourway on `/admin/products/[id]`.
- [ ] TASK-030 Admin categories: list, create, rename, reorder, hide, category photo; block delete while products exist
- [ ] TASK-031 Admin colours and sizes: list, create, rename, reorder, hide; optional swatch colour; names saved exactly as typed; block delete once used
- [x] TASK-032 Admin products list with search (name, style code through the colourways, SKU) and status filter
- [x] TASK-033 Admin product form: name, description, category, final sale, SEO, Draft/Published, archive. No price and no style code on the product; nothing generated on create
- [x] TASK-034 Admin colourways: style code editing, garment details (Top, Bottom, Dupatta fabrics and craft), and colourway active toggle
- [x] TASK-035 Admin SKUs per colourway: client SKU editing & validation (`lib/sku.ts`), size dropdown, price and compare-at in AED, on-hand stock editing with audit log reasons (`inventory_adjustments`), active toggle, add variant, delete/deactivate
- [ ] TASK-036 Admin stock: colours x sizes grid on the product (a "No size" column for unsized SKUs) and a Stock page for every SKU (search, low and out-of-stock filters); on hand, held, available; reason + note; history
- [ ] TASK-037 Publish checks: at least one visible colourway with a photo, at least one active SKU, and a price on every active SKU; clear errors in the form
- [ ] TASK-038 Enable `cacheComponents`; `'use cache'` + `cacheTag` on catalogue reads; `updateTag()` in admin actions
- [x] TASK-039 Storefront layout per `docs/DESIGN.md`: announcement bar, header (logo, menu, account, cart), footer, 404 and error pages
- [ ] TASK-040 Shop all and category pages: grid with colour swatches (only for products with more than one colour), "From AED" when SKU prices differ, size and colour filters (in-stock SKUs only), Sale filter from SKU compare-at prices (Q25), sort by lowest price, sold-out products last, empty state
- [ ] TASK-041 Product page: colour picker (only with more than one colour) swaps the photos and Details, sizes for that colour with live availability (no picker with one SKU; it's selected automatically), `?colour=` links rendered on the server, Only N left, Final sale label, Description and Details sections with the client's values as written, sticky Add to cart on mobile
- [ ] TASK-042 E2E: admin creates a category, colours, sizes, a product with two colours, photos, SKUs and stock; the product shows on the storefront; switching colour swaps the photos; a sold-out size can't be added; a duplicate SKU is rejected; a sizes-only product shows only a size picker
- [ ] TASK-113 Stock sheet upload: `src/services/sheets` (read .xlsx and .csv, headers matched by name, values as written), row checks (errors and warnings, `features/catalog/import/validate.ts`, unit tested against the fixtures), `catalogue_imports`, upload page with preview (ADR-036 confirmed first)
- [ ] TASK-114 Stock sheet apply: `apply_catalogue_import()` in one transaction (re-checks, creates and updates, ledger rows with the import ID, audit log, `updateTag()`), upload history, pgTAP tests (all or nothing, same file twice is a no-op, empty cells change nothing, sold SKUs keep Style, colour and size)
- [ ] TASK-115 Catalogue export in the same format, every value exactly as stored, text cells; test that export then upload changes nothing

## Phase 5: Customer Accounts
Done when: customers sign up and can only ever see their own data.
- [ ] TASK-043 Clerk setup: provider in the storefront layout, `/sign-in`, `/sign-up`, account menu
- [ ] TASK-044 `proxy.ts`: `clerkMiddleware()` on storefront routes next to the admin branch
- [ ] TASK-045 Clerk as Supabase third-party auth; `createCustomerClient()` and `requireCustomer()`
- [ ] TASK-046 Migration: `customers` + RLS on `auth.jwt()->>'sub'`; pgTAP test that customer A can't read customer B
- [ ] TASK-047 `/api/webhooks/clerk`: verify signature; upsert and anonymise `customers`

## Phase 6: Cart and Checkout
Done when: a shopper pays in Stripe test mode and the order is Confirmed and Paid with stock deducted exactly once, and a signed-in shopper places a COD order that holds stock.
- [x] TASK-048 Cart store (Zustand + localStorage): one line per SKU showing the colour's photo, the colour and the size; add, update, remove, 5 per line max; mini-cart drawer
- [x] TASK-049 Cart page with server re-validation (prices, availability, SKU active, colour visible, product published) and clear messages
- [ ] TASK-050 Delivery fee from settings in the cart (flat fee + free-over threshold)
- [ ] TASK-116 Checkout page `/checkout`: delivery details form (UAE address, `+971` mobile, prefilled for signed-in customers from their last order) and payment choice, per `docs/DESIGN.md`
- [ ] TASK-051 Migration: `orders` (payment method, structured address, COD fee, idempotency key, `confirm_by`, confirmed, shipped, courier, tracking, cash collected, cancelled and returned columns; statuses from ADR-035), `order_items`, `order_events`, `stock_reservations`, `stripe_events`, `cod_payouts` + RLS
- [ ] TASK-052 Postgres functions `create_pending_order()`, `mark_order_paid()` (sets `confirmed` and payment `paid`), `release_order()` + pgTAP tests (holds lock `stock_levels` rows in variant ID order; `mark_order_paid()` sets `first_sold_at`)
- [ ] TASK-053 `startCheckout` action: validate the delivery details, re-price, create the pending order, release an earlier hold from the same cart
- [ ] TASK-054 Stripe service: Checkout Session for the payment only (hosted page, AED, 31-min expiry, no address collection, delivery fee as a line item, line items named with colour and size, SKU in metadata, idempotency key)
- [ ] TASK-055 `/api/webhooks/stripe`: signature check, event idempotency, `checkout.session.completed` and `checkout.session.expired`
- [ ] TASK-056 Success page ("Confirming your payment" until Paid) and cancel page (expire the session, release the hold)
- [ ] TASK-057 Reconciliation job `/api/cron/reconcile-checkouts` every 15 min, protected by `CRON_SECRET`, wrapped in `Sentry.withMonitor()`, writing `job_runs`; also cancels COD orders past `confirm_by` (releasing their stock) and deletes stock sheet previews older than 24 hours
- [ ] TASK-058 Needs-attention path when a paid order has no stock left
- [ ] TASK-117 COD settings and `getCodEligibility()` (signed in, maximum, open orders, refusals per account and phone, turned off per customer, COD off), with unit tests
- [ ] TASK-118 `place_cod_order()` and the `placeCodOrder` action, with pgTAP tests (reservation until `confirm_by`, idempotency key, every rule checked again on the server, fee and prices re-calculated)
- [ ] TASK-119 COD order received page `/checkout/received/[orderNumber]` per `docs/DESIGN.md`
- [ ] TASK-059 Tests: race for the last unit of a SKU (card and COD), selling one size leaves the other sizes alone, abandoned checkout releases stock, webhook replay is a no-op, edited browser price ignored

## Phase 7: Emails and Invoices
Done when: each paid order (card at payment, COD when the cash is collected) sends one customer email with a correct English/Arabic invoice and one admin email.
- [ ] TASK-060 Resend service + React Email base layout; `email_log` with unique (template, entity)
- [ ] TASK-061 Order confirmation (customer) and new order (admin) emails sent once from the webhook; lines show the colour's photo, colour, size and SKU. COD emails: order received (customer), order to confirm (admin), order cancelled (customer); the invoice email after the cash is collected
- [ ] TASK-062 Spike: English/Arabic PDF (Arabic shaping, right-to-left); pick the engine and record it in ADR-022
- [ ] TASK-063 Gapless invoice numbers (locked counter row) assigned in `mark_order_paid()`, and in `record_cod_delivery()` when COD cash is collected
- [ ] TASK-064 Invoice PDF (lines show colour, size and SKU; VAT lines only when VAT is on), `/api/invoices/[orderId]` with an auth check, attached to the confirmation email

## Phase 8: Orders
Done when: the admin moves an order to Delivered (a COD order through confirm, ship and cash collected) and the customer sees it in My orders.
- [ ] TASK-065 Admin orders list: search (order number, email, phone, SKU), filters (status, payment method), new badge
- [ ] TASK-066 Admin order detail: items with colour, size and SKU, customer, address, payment method and payment, COD details (deadline, cash collected, payout), timeline, internal notes; actions shown per status
- [ ] TASK-067 Packed and Delivered actions through a Postgres function (sets `delivered_at`, logs the event); Shipped comes in TASK-121 and the COD actions in TASK-120 and TASK-122
- [ ] TASK-068 Resend confirmation and download invoice from the admin
- [ ] TASK-069 My orders: list and detail for customers, with every status from ADR-035 and the tracking number
- [ ] TASK-070 Link guest orders to the account by verified email (Clerk webhook + first account visit)
- [ ] TASK-120 Admin: confirm or cancel COD orders (with a reason, cancellation email); dashboard queue with the time left
- [ ] TASK-121 Shipped status for every order (`mark_shipped()` with courier and tracking number) and the Shipped email; COD stock deducted and `first_sold_at` set at Shipped
- [ ] TASK-122 COD delivered with cash collected (`record_cod_delivery()`: payment Paid, invoice, return window), Returned to sender, refusal count and COD block; turn COD off per customer
- [ ] TASK-123 COD report `/admin/reports/cod`: collected, courier payouts (`cod_payouts`), outstanding
- [ ] TASK-071 E2E: pay as a guest, sign up with the same email, see the order; admin marks Delivered and the status updates

## Phase 9: Returns
Done when: a customer submits a return with photos and the admin approves, receives or rejects it.
- [ ] TASK-072 Migration: `return_requests`, `return_items`, `return_photos`, `return_events` + RLS + pgTAP tests
- [ ] TASK-073 Eligibility service (Delivered, inside the window, not final sale, quantity left) with unit tests
- [ ] TASK-074 Return form: items, quantity, reason per item, comment, photos compressed in the browser, validation
- [ ] TASK-075 Signed uploads for return photos into Cloudinary (ownership + eligibility check); size and type checked after upload; viewed via signed URLs that strip metadata
- [ ] TASK-076 `submit_return()` function + action: re-check every rule, verify photo keys, assign RET number
- [ ] TASK-077 Return emails: confirmation (customer) and alert (admin)
- [ ] TASK-078 Customer return page: timeline, instructions, refund status, cancel
- [ ] TASK-079 Admin returns queue with filters and new badge
- [ ] TASK-080 Admin return detail: items, reasons, photos through 1-hour private links, customer history
- [ ] TASK-081 Approve (instructions template) and reject (reason) with emails
- [ ] TASK-082 Mark received with condition per item; close without refund
- [ ] TASK-083 Jobs: expire approved returns after N days; purge photos 90 days after close (both write `job_runs`)

## Phase 10: Refunds
Done when: a received return is refunded through Stripe, with a credit note when VAT is on.
- [ ] TASK-084 Migration: `refunds`, `credit_notes`; refundable balance function
- [ ] TASK-085 Refund action: prefilled amount, lower with a reason, capped at the balance, Stripe refund with idempotency key (COD orders: TASK-124)
- [ ] TASK-086 Webhook handlers: `refund.created`, `refund.updated`, `refund.failed`, `charge.dispute.created`
- [ ] TASK-087 Credit note PDF (when VAT is on) and refund email
- [ ] TASK-088 "Adjust stock" shortcut from the return (reason Return restock, back to the same SKU, linked to the return)
- [ ] TASK-089 E2E: return -> approve -> receive -> refund (test mode) -> credit note -> manual restock; failed refund alerts the admin
- [ ] TASK-124 COD refunds by bank transfer: record amount, date and reference (no bank details stored); credit note and refund email as for card refunds
- [ ] TASK-125 E2E: a COD order placed, confirmed, shipped and delivered with cash and an invoice; a refused parcel; an auto-cancel; card checkout unchanged

## Phase 11: Content
Done when: the admin changes banners, publishes posts, and policy pages are live.
- [ ] TASK-090 Banners admin: placement (hero or promo), eyebrow, title, text, button, desktop + mobile image, order, on/off; move the hero photos from `public/` into Banners so they're resized like every other upload
- [x] TASK-091 Home page per `docs/DESIGN.md`: hero, shop by category, new arrivals, trust strip, promo banner, latest posts
- [ ] TASK-092 Blog admin: Tiptap editor, cover image, SEO fields, Draft/Published
- [ ] TASK-093 Blog list and post pages
- [ ] TASK-094 Pages: About, Contact, Terms, Privacy, Returns & Refunds, Shipping & Delivery

## Phase 12: Dashboard and Settings
Done when: the admin sees today's numbers and can change store settings without a developer.
- [ ] TASK-095 Admin dashboard: KPIs (today, 7 days, 30 days), queues (COD to confirm, to pack, to ship, Packed over 3 days, open returns, failed refunds, needs attention), COD cash outstanding, low-stock SKUs, last run of each background job
- [ ] TASK-096 Settings page: store details, TRN, VAT, delivery fee, return window, return expiry, low-stock threshold, announcement bar text, notification emails, return instructions template, COD settings (on or off, fee, maximum order value, hours to confirm, refused parcels before blocking)

## Phase 13: SEO, Analytics and Monitoring
Done when: pages are indexable, ecommerce events fire once, and alerts reach the team.
- [ ] TASK-097 `generateMetadata`, canonical URLs (product pages drop `?colour=`), Open Graph images
- [ ] TASK-098 `sitemap.ts`, `robots.ts`, `noindex` on admin, account, cart and checkout
- [ ] TASK-099 Structured data: ProductGroup with a Product per SKU (colour, size, SKU, price, availability), BreadcrumbList, Organization, Article
- [ ] TASK-100 GA4 + GTM ecommerce events per Pranav's SOP (`purchase` once per order, with `payment_type` card or cash on delivery, sent at payment for card and at confirmation for COD: check against the SOP; colour and size sent as `item_variant`)
- [ ] TASK-101 PostHog (inputs masked)
- [ ] TASK-102 Sentry alerts and monitors: email alert rules, cron monitor on reconcile-checkouts, uptime monitor on `/api/health`, stale-job check for the daily jobs; trigger each alert once

## Phase 14: Hardening and QA
Done when: every check in `docs/TEST_PLAN.md` and `docs/SECURITY.md` passes on a preview deployment.
- [ ] TASK-103 Security headers (CSP, HSTS, nosniff, referrer policy, frame-ancestors) and rate limits on checkout start, placing COD orders, return submission, upload signing and stock sheet uploads (choose Vercel Firewall rules or a Postgres limiter; record an ADR)
- [ ] TASK-104 Security review against `docs/SECURITY.md`: report first, then fix one by one
- [ ] TASK-105 Code review against PRD, ARCHITECTURE, DESIGN, RULES and TEST_PLAN
- [ ] TASK-106 Accessibility (WCAG 2.2 AA) and responsive pass (375 / 768 / 1440)
- [ ] TASK-107 Performance pass: Core Web Vitals on staging
- [ ] TASK-108 Full E2E suite green on a preview deployment; QA checklist complete

## Phase 15: Launch
Done when: a live order is placed and refunded on production.
- [ ] TASK-109 Production setup: Supabase project, Clerk production instance, Stripe live keys and webhook, Resend domain (SPF, DKIM, DMARC), Cloudinary production account, Sentry production environment and alert email, Vercel environment variables
- [ ] TASK-110 Domain and SSL on Vercel, `www` redirect, Google Search Console with the sitemap
- [ ] TASK-111 Production QA from `docs/TEST_PLAN.md`, including one live order and refund
- [ ] TASK-112 Go-live, monitoring check in Sentry, 2 weeks of hypercare; update `docs/MEMORY.md`
