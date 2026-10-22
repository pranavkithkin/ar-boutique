# Architecture

> ARCHITECTURE = HOW the app works. What and why are in `PRD.md`; the reasons behind each choice are in `DECISIONS.md`.

## Stack
| Layer | Choice |
|---|---|
| Frontend | Next.js 16 App Router (version >= 16.3.8) + React |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui, themed by a shadcn preset (tokens and fonts in `DESIGN.md`) |
| Backend | Next.js Server Components, Server Actions and Route Handlers |
| Database | Supabase PostgreSQL with Row Level Security and Postgres functions |
| Customer auth | Clerk, connected to Supabase as a third-party auth provider |
| Admin auth | Supabase Auth: email + password + TOTP 2FA, invite only |
| Payments | Stripe Checkout hosted page in AED (card, Apple Pay, Google Pay), plus cash on delivery handled by our own checkout and admin |
| Email | Resend + React Email |
| Media | Cloudinary via `src/services/media`; uploads are signed and saved direct from the browser, and delivered via named transformations (ADR-038) |
| PDFs | English/Arabic invoices and credit notes (engine picked in TASK-062) |
| Forms and validation | React Hook Form + Zod |
| Client state | Zustand (cart only) |
| Blog editor | Tiptap |
| Spreadsheets | ExcelJS for the stock sheet upload and export (ADR-036, proposed) |
| Testing | Vitest, Playwright, pgTAP |
| Analytics | GA4 + GTM (per Pranav's SOP "GA4 + GTM Ecommerce Analytics Setup (Next.js Client Stores)"), PostHog |
| Monitoring | Sentry: errors, tracing, logs, one cron monitor and one uptime monitor (free Developer plan) |
| Deployment | Vercel Pro |

## How It Works
```text
User (shopper or admin)
|
Next.js UI (Server Components; client components only where needed)
|
Server Action / Route Handler (check auth -> validate with Zod)
|
Service (src/services/*)
|
Supabase (Postgres functions + RLS)
|
PostgreSQL
```

```text
Next.js     -> Stripe       create Checkout Sessions and refunds
Stripe      -> Next.js      webhooks: payment, expiry, refunds, disputes
Clerk       -> Next.js      webhooks: user created, updated, deleted
Next.js     -> Resend       order, return and refund emails
Next.js     -> Cloudinary     signed uploads, return photos, metadata deletion
Browser     -> Cloudinary     direct uploads with signed params; photos from res.cloudinary.com via media-loader
Next.js     -> Sentry       errors, traces, logs, cron check-ins
Sentry      -> Next.js      uptime check on /api/health
Vercel Cron -> Next.js      reconcile checkouts and COD deadlines, expire returns, purge photos
```

## Folder Structure
```text
src/
|-- app/
|   |-- (store)/                 # storefront: own root layout with ClerkProvider
|   |   |-- page.tsx             # home
|   |   |-- shop/                # Shop all + [category]
|   |   |-- products/[slug]/
|   |   |-- cart/
|   |   |-- checkout/            # delivery details and payment choice; success, cancelled, received (COD)
|   |   |-- account/             # orders, returns (Clerk session required)
|   |   |-- blog/
|   |   |-- policies/[slug]/
|   |   |-- sign-in/[[...sign-in]]/
|   |   `-- sign-up/[[...sign-up]]/
|   |-- (admin)/admin/           # admin: own root layout, no Clerk
|   |   |-- login/
|   |   |-- mfa/
|   |   `-- (protected)/         # everything else, needs an aal2 admin session
|   |-- api/
|   |   |-- admin/               # catalogue-export (admin session + aal2)
|   |   |-- webhooks/            # stripe, clerk
|   |   |-- cron/                # reconcile-checkouts, expire-returns, purge-return-photos
|   |   |-- health/              # uptime check for Sentry
|   |   |-- invoices/[orderId]/
|   |   `-- credit-notes/[id]/
|   |-- global-error.tsx         # reports render errors to Sentry
|   `-- globals.css              # shadcn theme tokens (owned by the shadcn CLI)
|-- components/
|   |-- ui/                      # shadcn/ui primitives (never hand-edited)
|   |-- store/                   # shared storefront components
|   `-- admin/                   # shared admin components
|-- features/                    # one folder per domain
|   |-- catalog/                 # products, colourways, sizes, SKUs, photos, stock, details, stock sheet upload and export
|   |-- cart/
|   |-- checkout/
|   |-- orders/
|   |-- returns/
|   |-- refunds/
|   |-- content/                 # banners, blog, pages
|   |-- dashboard/
|   |-- settings/
|   `-- staff/
|-- services/                    # server only: data access + integrations
|   |-- db/                      # Supabase queries and RPC calls, one file per domain
|   |-- stripe/
|   |-- email/                   # Resend client + React Email templates
|   |-- media/                   # media adapter: Cloudinary
|   |-- pdf/                     # invoices, credit notes
|   |-- sheets/                  # read and write the stock sheet (.xlsx, .csv), values exactly as written
|   `-- analytics/
|-- lib/
|   |-- supabase/                # public, customer, admin, browser and service clients
|   |-- auth/                    # requireCustomer(), requireAdmin()
|   |-- env.ts                   # validated environment variables
|   |-- fonts.ts                 # next/font: --font-sans and --font-heading
|   |-- media-loader.ts          # next/image loader and photo widths (browser safe)
|   |-- money.ts                 # fils, formatAED(), VAT split
|   `-- sku.ts                   # SKU checks only (never generates or suggests)
|-- styles/
|   `-- brand.css                # our extra tokens (success, warning); presets never touch it
|-- types/                       # shared types + generated database types
|-- utils/
|-- instrumentation.ts           # loads the Sentry server and edge config; exports onRequestError
|-- instrumentation-client.ts    # Sentry in the browser
|-- sentry.server.config.ts
|-- sentry.edge.config.ts
`-- proxy.ts                     # Clerk on storefront routes, Supabase session on /admin
supabase/
|-- migrations/
|-- tests/                       # RLS and function tests (pgTAP)
`-- seed.sql
tests/
|-- unit/
|-- integration/
`-- e2e/
```

Each domain folder follows the same shape:
```text
features/<domain>/
|-- components/     # domain UI
|-- actions.ts      # Server Actions: auth -> Zod -> service
|-- schemas.ts      # Zod schemas shared by forms and actions
`-- types.ts
```

## Architectural Rules
- UI components never call Supabase, Stripe, Resend or R2 directly.
- Database and third-party calls live in `src/services/*`, marked `import 'server-only'`.
- Every Server Action and Route Handler: check auth -> validate input with Zod -> call a service -> return a typed result.
- Orders, stock, returns and refunds change only through Postgres functions that check the current state inside one transaction.
- Stock is per SKU. Cart lines, holds, order lines, returns and stock changes always point at a SKU (`product_variants.id`).
- Photos belong to a product colour, never to a size or directly to a product.
- The client's data is stored exactly as written (ADR-029). Code never generates, suggests, tidies or fixes SKUs, style codes or any value from the client's sheet; it reports problems instead.
- Business logic stays out of components.
- Reusable UI goes in `components/`; domain UI goes in `features/<domain>/components/`.
- Server Components by default; add `"use client"` only for interaction.
- Components use theme tokens only (see `DESIGN.md`). No hard-coded colours or fonts.
- Money is integer fils everywhere; format it only in the UI with `formatAED()`.
- All media goes through the media adapter; store keys, never URLs.
- Never trust the browser for prices, totals, stock or return eligibility.
- Unexpected errors go to Sentry. Expected ones (validation, sold out, not allowed) go back to the UI as typed results.

## Supabase Clients
| Client | Key | Session | Use for |
|---|---|---|---|
| `createPublicClient()` | publishable | none | Cached catalogue, banner and blog reads (`'use cache'` can't read cookies), and live availability through `variant_availability()` |
| `createCustomerClient()` | publishable | Clerk token | Customer orders, invoices and returns |
| `createAdminClient()` | publishable | Supabase auth cookies | Admin pages and actions |
| `createBrowserClient()` | publishable | Supabase auth cookies | Admin login and 2FA screens only |
| `createServiceClient()` | secret (bypasses RLS) | none | Webhooks, cron jobs and PDFs only |

## Authentication

### Customers (Clerk)
- Turn on Clerk's Supabase integration and add Clerk as a third-party auth provider in Supabase.
- `createCustomerClient()` passes the Clerk session token: `accessToken: async () => (await auth()).getToken()`.
- RLS reads the Clerk user ID from `auth.jwt()->>'sub'`. Clerk IDs look like `user_2abc...`, so customer ID columns are `text`.
- Clerk webhooks keep `customers` in sync and link guest orders by verified email.

### Admins (Supabase Auth)
- Email + password. Public sign-ups are disabled; staff are invited.
- TOTP (authenticator app) is required. Admin access needs an `aal2` session.
- A Custom Access Token Hook adds `user_role: 'admin'` for active rows in `admin_users`.
- Supabase Auth emails go through Resend SMTP (the built-in sender only allows 2 emails an hour, and only to your own team).

### proxy.ts
- Storefront routes run `clerkMiddleware()`.
- `/admin/*` refreshes the Supabase session, sends users with no session to `/admin/login` and users without 2FA to `/admin/mfa`.
- The matcher excludes `_next/static`, `_next/image`, static files and the Sentry tunnel (`/sentry-tunnel`), so error reports are never redirected.
- The proxy only routes. Every Server Action and Route Handler checks auth again: `requireCustomer()` (Clerk `auth()`) or `requireAdmin()` (`supabase.auth.getClaims()` + `aal2` + active admin).

## Database Access (RLS)
1. RLS is on for every table, deny by default.
2. **Never use `auth.uid()` in a policy.** Policies are OR'd together, so admin policies also run on Clerk requests, and `auth.uid()` throws on non-UUID Clerk IDs. Compare `auth.jwt()->>'sub'` as text.
3. `is_admin()` (SQL, `security definer`, fixed `search_path`): the issuer is our Supabase project, `user_role = 'admin'`, `aal = 'aal2'`, and an active `admin_users` row matches `sub` (text compare). The expected issuer is stored per environment in a private config table.
4. Browsers never write to tables directly; writes go through Server Actions.
5. The secret (service-role) key is used only by webhooks, cron jobs and PDF generation.
6. Visitors and customers never read stock counts. `variant_availability(product_ids)` (`security definer`, fixed `search_path`) returns only a status per SKU: `in_stock`, `low` (with the number left when it's 3 or fewer) or `sold_out` (ADR-026).

| Data | Visitor | Customer | Admin | Server only |
|---|---|---|---|---|
| Active categories, colours and sizes; published products with their visible colours, photos and active SKUs; banners; posts | Read | Read | Full | |
| Stock levels | | | Read; change via functions | Holds and sales via functions |
| Orders, order items, returns | | Read own | Read; update via functions | Create, mark paid |
| Stock ledger, audit log, Stripe events, email log, job runs, stock sheet uploads, courier payouts | | | Read; uploads and payouts via functions | Write |
| Settings | | | Read, write | Read (checkout, emails) |
| Admin users | | | Read | Write (invites) |

## Data Model
Money columns are integer fils (1 AED = 100 fils).

| Table | Key columns |
|---|---|
| `customers` | `clerk_user_id` (text, PK), email, first and last name, phone, `cod_disabled` (the admin turned COD off for this customer), `deleted_at` |
| `admin_users` | `user_id` (uuid, from `auth.users`), email, role, `is_active`, `invited_by` |
| `categories` | name, slug (unique), description, `image_key` (the Shop by category photo), sort, `is_active`, SEO title and description |
| `colours` | Store-wide list: name (unique, exactly as the client writes it, e.g. `Sage Green`, `Sea green`), slug (unique, made from the name for `?colour=` links; a number is added if it's taken), `swatch_hex` (optional; only needed when a product shows colour swatches), sort, `is_active`. No code |
| `sizes` | Store-wide list: label (unique, exactly as written, e.g. `M`, `XL`, `Free Size`), sort (display order set by the admin; new sizes go last), `is_active`. No code |
| `products` | slug (ours, made from the name, unique), name (the client's Product Name), description (the client's Creative Description, as written), **`category_id`** (FK to `categories`, nullable until the client confirms the list), `product_group` (the client's Product Group, nullable, unique), `is_final_sale`, status (draft, published, archived), SEO fields, `published_at`. No price and no style code |
| `product_colours` | One colourway of one product: `product_id`, `colour_id`, `style_code` (the client's Style, required, exactly as written, not unique, indexed for search), `details` (JSON, see below), sort (the first visible colour is the default), `is_active` (visible on the storefront); unique (product, colour) |
| `product_images` | Photos of one product colour: `product_colour_id`, `media_key`, alt, sort (first = main photo), width, height. Every size of that colour uses them |
| `product_variants` | One row per SKU (one colourway in one size, or with no size): `product_id`, `product_colour_id`, `size_id` (nullable), `sku` (the client's, exactly as written; unique ignoring letter case), `price_fils`, `compare_at_fils` (nullable, must be above the price), `is_active`, `first_sold_at` (the SKU locks once set); unique (product colour, size) `nulls not distinct`, so a colourway has at most one SKU without a size, and a trigger stops a colourway mixing SKUs with and without a size; composite FK (`product_colour_id`, `product_id`) -> `product_colours (id, product_id)`, so a SKU can't point at another product's colour |
| `stock_levels` | One row per SKU: `variant_id` (PK), `on_hand`, `reserved`, `updated_at`; checks: on hand >= 0, reserved >= 0, reserved <= on hand. No visitor or customer access |
| `stock_reservations` | `order_id`, `variant_id`, qty, status (active, consumed, released), `expires_at` |
| `inventory_adjustments` | Stock ledger: `variant_id`, delta, reason (opening stock, restock, correction, return restock, offline sale, damaged, sale, stock sheet upload, COD refused), note, `order_id`, `return_id` or `import_id`, actor, `created_at` (system sales included) |
| `catalogue_imports` | Stock sheet uploads: file name (shown as text only), file SHA-256, admin, status (previewed, applied, failed, discarded), the parsed rows (JSON, deleted 24 hours after the preview if not applied), counts (created, updated, unchanged), errors and warnings (JSON), `created_at`, `applied_at` |
| `orders` | `order_number` (AR-10001), `clerk_user_id` (null for guests), email, name, phone, delivery address (emirate, area, street and building, flat or villa, landmark), status, `payment_method` (card, cod), `payment_status`, subtotal, discount, delivery, COD fee (`cod_fee_fils`), VAT and total, VAT rate, Stripe session and PaymentIntent IDs, `cart_id`, `idempotency_key` (unique), `hold_expires_at`, `confirm_by` (COD deadline), `confirmed_at`, `paid_at`, `packed_at`, `shipped_at`, courier, tracking number, `delivered_at`, `cash_collected_fils`, `cod_payout_id`, `cancelled_at`, cancel reason, `returned_at`, `needs_attention`, internal notes |
| `order_items` | Snapshot: product, product colour and variant IDs, product name, colour name, style code, size label (empty when the SKU has no size), SKU, image key (the colour's main photo), unit price, qty, discount, VAT, line total, `is_final_sale` |
| `order_events` | order, type, from and to status, actor, data |
| `invoices` | order, `invoice_number` (gapless), `issued_at` |
| `refunds` | order, return, amount, reason, method (stripe, bank_transfer), Stripe refund ID, or the bank transfer date and reference, status (pending, succeeded, failed), failure reason, admin |
| `cod_payouts` | Courier cash paid to the client: amount, `paid_on`, reference, note, admin; orders link through `orders.cod_payout_id` |
| `credit_notes` | refund, `credit_note_number` (gapless), amount, VAT, `issued_at` |
| `return_requests` | `return_number` (RET-1001), order, customer, status, comment, admin instructions, rejection or close reason, timestamps, `photos_purge_after` |
| `return_items` | return, order item, qty, reason, condition, refund amount |
| `return_photos` | return, `media_key` (private bucket), `deleted_at` |
| `return_events` | return, type, from and to status, actor, note |
| `banners` | placement (`hero` or `promo`), eyebrow (small label above the title), title, subtitle, button label and link, desktop and mobile image keys, sort, active, start and end |
| `blog_posts` | slug, title, excerpt, body (Tiptap JSON), cover image key, status, `published_at`, SEO fields, author |
| `settings` | One row: store details, TRN, VAT flag and rate, delivery fee and free-delivery threshold, return window, return expiry, low-stock threshold, announcement bar text, notification emails, return instructions template; COD: on or off, fee, maximum order value, signed-in only, hours to confirm, open COD orders per customer, refused parcels before blocking |
| `stripe_events` | event ID (PK), type, received and processed timestamps |
| `email_log` | template, recipient, entity ID, Resend message ID, status; unique (template, entity) for one-time emails |
| `audit_log` | admin, action, entity, before, after, timestamp |
| `job_runs` | job, started and finished timestamps, status, summary; the reconciliation job reads it to spot stale daily jobs |

- Prices, VAT and the final-sale flag are copied onto each order line, so later edits never change past orders, invoices or refunds.
- Invoice and credit note numbers come from a locked counter row, so they never skip (Postgres sequences can).
- Categories: one per product via `products.category_id`; the list is admin-managed. If products later need several groupings ("New in", seasonal edits), add `collections` + `product_collections`.
- **Price of a SKU:** `product_variants.price_fils`, always read on the server. Product cards show the lowest active price, with "From" when the product's SKUs have different prices.
- **SKU rules (ADR-025):** the client's SKU, exactly as written, never generated, suggested or changed (not even its capitals). Unique ignoring letter case (unique index on `lower(sku)`). `src/lib/sku.ts` only checks: not blank, at most 64 characters, no space at the start or end, no line breaks. Editable until `first_sold_at` is set (card: `mark_order_paid()`; COD: when the order ships), then locked. A SKU with history is deactivated, never deleted, and never reused.
- **Style codes:** the client's Style, exactly as written, required on every colourway (the upload uses it to keep the sizes of a style together, and the export writes it back). Never generated.
- **Client data as written (ADR-029):** values from the client's sheet or typed by the admin are stored as they are: no trimming inside, no case changes, no spelling fixes, no merging of similar names. A space at the start or end of a SKU, Style, Size or colour is an error, never trimmed. Only our own values are made by code: IDs, slugs, fils (AED x 100) and the stock ledger.
- **Details (`product_colours.details`):** one JSON object keyed by the sheet's detail headers exactly (`"Package Contains"`, `"Top Portal Fabric"`, `"Top Primary Color"`, `"Top Pattern Type"`, `"Top Neck Details"`, `"Top Sleeve Details"`, `"Top Category"`, `"BTM Style Type"`, `"BTM Fabric Type"`, `"BTM Primary Color"`, `"DPT Fabric Type"`, `"DPT Primary Color"`, `"DPT Pattern Type"`), values as written text (a number such as `37` is kept as the text `37`). Checked by one Zod schema, `colourwayDetailsSchema` (text only, at most 200 characters each, nothing tidied). Display labels are ours, in `features/catalog/details.ts`; empty and `-` values aren't shown.
- **Hide, don't delete:** colours, sizes, product colours and SKUs that appear in orders, holds or the stock ledger can only be hidden (`is_active = false`). Unused ones can be deleted.

## Key Flows

### Product page (colour -> size -> SKU)
1. The cached product read returns its visible colours in order. Each colour carries its style code, details, photos and its active SKUs (size label, SKU, price, compare-at price) in size order.
2. Availability is read live (never cached) with `variant_availability()` and streamed into the size picker.
3. The starting colour is `?colour=<slug>` when it's valid, otherwise the first colour with stock, otherwise the first colour. The server renders it, so shared links show the right photos. With only one visible colour there are no swatches; the colour shows in Details.
4. Choosing a colour swaps the gallery and the size list without a reload and updates `?colour=`. Choosing a size never changes the photos.
5. Add to cart needs one SKU. When the colourway has only one active SKU (one size, or no size), it's selected automatically and no size picker shows.
6. The canonical URL drops `?colour=`.

### Shop pages and filters
The product list comes from the cached catalogue. Live availability for its SKUs is read on each request and merged on the server, so size and colour filters only match SKUs that are in stock, and fully sold-out products go last with a Sold out badge. This stays fast for a few hundred products; revisit past about 1,000.

### Admin: product with colours and sizes
1. Save the details (name, category, description) -> a Draft product. Nothing is generated.
2. Add a colourway: a colour from the store's list (or a new one, saved as typed), the client's style code (required) and the details. A sizes-only product has one colourway; "Add another colour" turns on one tab per colour.
3. Per colourway, upload photos (see "Cloudinary"): each photo sets public_id and asset_folder to `products/{productId}/{productColourId}/`, and on save the server checks every key is inside that folder.
4. Per colourway, add SKUs: the client's SKU (required, typed as given; the field is never prefilled), the size (or no size), price and compare-at price (typed once for all sizes, or per SKU), stock 0.
5. Enter opening stock in the colours x sizes grid. Every change goes through `adjust_stock()` with a reason.
6. Publish -> the server checks the publishing rules (a visible colourway with a photo, an active SKU, a price on every active SKU) -> `updateTag()`.

### Stock sheet upload (ADR-032)
The format is the client's own sheet. Columns are found by their exact header names, in any order. Every upload needs SKU, Style and Selling Price; new products need a Product Name and new SKUs need Stock. Everything else is optional.

| Column | Stored in |
|---|---|
| SKU | `product_variants.sku` |
| Style | `product_colours.style_code` |
| Top Primary Color | The colourway's colour (`colours`, added as written if new) and `details` |
| Package Contains, the other Top, BTM and DPT columns | `product_colours.details` |
| Creative Description | `products.description`, from whichever row of the product has it |
| Selling Price, Compare-at Price | `product_variants.price_fils`, `compare_at_fils` (AED x 100) |
| Size | `product_variants.size_id` (`sizes`, added as written if new). Empty: no size |
| Product Name | `products.name` |
| Stock | `stock_levels.on_hand` |
| Category | `products.category_id` (`categories`, added as written if new) |
| Product Group | `products.product_group`. Empty: each Style is its own product |
| Anything else (like the Check column) | Not stored; the preview lists it as "not used" |

1. **Upload** (admin with `aal2`, rate limited): `.xlsx` or `.csv`, 5 MB at most. `src/services/sheets` reads it on the server in memory (cells as the text Excel shows; formulas are never run). A `catalogue_imports` row is saved as `previewed` with the parsed rows. Nothing else changes.
2. **Check every row** (`features/catalog/import/validate.ts`, pure and unit tested), then show the preview: what will be created (products, colourways, sizes, colours, categories, SKUs), what will change (old and new value), errors and warnings with row numbers, and the columns not used.
3. **Grouping:** rows with the same Product Group are one product; when it's empty, rows with the same Style are one product. Inside a product, rows with the same Top Primary Color are one colourway. Rows match existing SKUs ignoring letter case.
4. **Agreeing rows:** rows of one product must agree on Product Name, Category and Creative Description; rows of one colourway must agree on Style and every detail. An empty cell doesn't count as disagreeing. If two rows disagree, it's an error naming both rows; the code never picks one.
5. **Empty cells** change nothing on an existing product, so an upload never wipes an admin edit. Clearing a value is done in the admin.
6. **Errors** (the Apply button stays off): SKU or Style missing; the same SKU on two rows; a space at the start or end of a SKU, Style, Size or colour; a price, compare-at price or stock that isn't a valid number; a price with more than 2 decimals (never rounded); a compare-at price not above the price; rows that disagree; one Style in two Product Groups; a new product without a Product Name; a new SKU without Stock; two SKUs of one colourway with the same size; a colourway mixing SKUs with and without a size; stock below what's held; a sold SKU whose Style, colour or size changed.
7. **Warnings** (shown, not blocking): a SKU that doesn't start with its Style or doesn't end with its Size; a SKU or Style cell Excel stored as a number; a new colour, size or category; a name that only differs from an existing one in capitals or spaces (`Sea green` and `Sea Green`); SKUs in the store that are missing from the sheet (never deleted or set to zero).
8. **Apply:** `apply_catalogue_import(import_id)` runs in one transaction. It re-checks every rule against the current data (if anything changed since the preview, it stops and asks for a new preview), creates and updates rows, sets on hand to the sheet's Stock and writes the difference to the ledger (reason "stock sheet upload", with the import ID), marks the import `applied`, writes `audit_log` and calls `updateTag()`. New products land as Draft. Applying the same file again changes nothing.
9. **Export** (`/api/admin/catalogue-export`): one row per SKU with the same headers, every value exactly as stored, written as text cells (prices and stock as numbers), so Excel never runs anything as a formula and nothing gets an apostrophe added. Export, then upload, changes nothing.

### Checkout page
`/checkout` (never cached) has one delivery details form for both payment methods (name, UAE mobile, emirate, area, street and building, flat or villa, landmark), prefilled for signed-in customers from their last order, and the payment choice. `getCodEligibility()` decides on the server whether COD is offered and, if not, why (guest, over the limit, an open COD order, blocked, COD off). The browser only shows the result; `place_cod_order()` checks again.

### Card checkout and stock hold
Per SKU: `available = stock_levels.on_hand - stock_levels.reserved`.

1. `startCheckout` validates the delivery details and the cart and re-prices it from the database. If the same cart already has a pending order, release its hold and expire its Stripe session first.
2. `create_pending_order()` runs in one transaction:
   - For each line, sorted by variant ID (avoids deadlocks): check the SKU is active, its colour is visible and the product is published, then `UPDATE stock_levels SET reserved = reserved + qty WHERE variant_id = $1 AND on_hand - reserved >= qty`. If any line updates zero rows, roll back and report that line.
   - Insert the order (`pending_payment`, `payment_method = 'card'`, the delivery details, provisional `hold_expires_at`), the `order_items` snapshot (with colour, style code, size and SKU) and the `stock_reservations`.
3. Create the Stripe Checkout Session: `ui_mode: 'hosted_page'` (API versions from 2026-03; older versions call it `hosted`), currency `aed`, line items from the snapshot (named like "Satin Slip Dress, Black / M", with the SKU and variant ID in metadata), `expires_at` = now + 31 min (Stripe needs at least 30 min after creation), no address collection (the address is already on the order from our form), email prefilled, the delivery fee as its own line item, `metadata.order_id`, idempotency key = order ID. Copy Stripe's `expires_at` into `hold_expires_at`, save the session ID and redirect. If Stripe fails, release the hold.
4. `checkout.session.completed` with `payment_status = 'paid'` -> verify signature -> skip if the event ID is already stored -> `mark_order_paid()`: order Confirmed, payment Paid, reservations consumed, `on_hand` and `reserved` both reduced, `first_sold_at` set on each SKU, ledger rows written, invoice number assigned, Stripe IDs and amounts saved -> send emails, each guarded by a unique `email_log` row.
5. `checkout.session.expired`, or the customer uses Stripe's back link (the cancel page expires the session) -> `release_order()`: reservations released, order Expired.
6. Every 15 min the reconciliation job checks pending orders more than 10 min past their hold (including ones that never got a session) against Stripe and fixes them.
7. Paid but the hold was already released -> deduct again if possible; if stock is short, set `needs_attention` and alert the admin.

### Cash on delivery (ADR-033)
1. The shopper picks Cash on delivery and clicks Place order. `placeCodOrder` (signed-in customers only) validates the delivery details and calls `place_cod_order(cart, idempotency_key)`.
2. `place_cod_order()` runs in one transaction: checks the COD settings and the customer's eligibility (COD on, signed in, total within the maximum, no other open COD order, fewer refused parcels than the limit by account and by phone, `cod_disabled` off), re-prices the cart and adds the COD fee, reserves stock exactly like card checkout (same row order) with `expires_at` = `confirm_by` = now + the hours to confirm, and inserts the order (`awaiting_confirmation`, payment `unpaid`, `payment_method = 'cod'`). The idempotency key (one per cart) is unique, so a double click returns the same order.
3. The shopper sees the COD received page ("We'll call or WhatsApp you on +971 ... to confirm your order"). The customer gets the COD order received email; the admin gets the COD order to confirm email.
4. The admin calls or messages the customer, then `confirm_cod_order()` (status `confirmed`, `confirmed_at`, the reservations no longer expire) or `cancel_order(reason)` (status `cancelled`, payment `voided`, reservations released, cancellation email).
5. The reconciliation job cancels COD orders past `confirm_by` the same way.
6. Packed, then `mark_shipped(courier, tracking)` for every order. For COD this is when stock leaves: reservations consumed, `on_hand` and `reserved` both reduced, ledger rows (reason sale), `first_sold_at` set. The Shipped email shows the amount to have ready.
7. Delivered: `record_cod_delivery(cash_collected)` sets `delivered`, payment `paid`, `paid_at`, `cash_collected_fils`, assigns the invoice number and sends the invoice email. The return window starts.
8. Refused or undeliverable: when the parcel is back, `mark_returned_to_sender(reason)` sets `returned_to_sender` and payment `voided`. It counts towards the refusal limit. Stock never goes back by itself; the admin restocks with reason "COD refused" (ADR-012).
9. Courier cash: the COD report lists cash collected and not yet paid out. The admin records each courier payout (`cod_payouts`) and ticks the orders it covers.

### Refund
1. The admin clicks Refund on a Received return. The server checks `aal2`, the return status and the refundable balance.
   - **COD orders** have no card to refund: the admin pays by bank transfer and records the amount, date and reference (`refunds.method = 'bank_transfer'`, status `succeeded` straight away), then the steps from 3 on run the same way. Bank details are never stored.
2. Insert a `refunds` row (pending), then create the Stripe refund on the order's PaymentIntent with idempotency key = refund ID.
3. `refund.created` or `refund.updated` with status `succeeded` -> refund Succeeded -> return Refunded -> order payment status updated -> credit note (if VAT is on) -> refund email.
4. `refund.failed` -> refund Failed -> admin alert; the return stays Received.
5. Stripe keeps its processing fee; refunds take 5 to 10 business days to reach the customer.

### Return photo upload
1. The return form creates a draft ID in the browser.
2. A Server Action generates signed parameters for a direct Cloudinary upload (valid for 1 hour, type `authenticated`) to `{folder}/returns/{orderId}/{draftId}/<id>`, only if the customer owns the order and it's eligible.
3. The browser compresses each photo and POSTs it straight to Cloudinary (never through Vercel).
4. On submit, the server checks every `public_id` belongs to that folder, verifies each file's size and format (deleting bad ones), then `submit_return()` creates the return.
5. Admins see photos through `privateUrl` which strips metadata.
6. A daily job deletes photos 90 days after the return closes.

### Catalogue change
Admin saves -> Server Action -> service -> `updateTag('products')` (plus `product:{slug}`, `categories`, `colours`, `sizes`, and so on) -> the storefront shows the change on the next load. Stock changes need no cache update because availability is never cached.

### Guest order linking
Clerk `user.created` / `user.updated` webhook (and the first account page load) -> attach orders where `clerk_user_id` is null and the email matches a **verified** Clerk email.

## Statuses

### Order
| Status | Meaning | Set by | Next |
|---|---|---|---|
One order track for both payment methods. `paid` was renamed `confirmed` (ADR-035), because a confirmed COD order isn't paid yet; payment has its own status.

| Status | Card | COD | Set by | Next |
|---|---|---|---|---|
| `pending_payment` | Stock held, waiting for Stripe | | Checkout | `confirmed`, `expired` |
| `awaiting_confirmation` | | Stock held, waiting for the call | `place_cod_order()` | `confirmed`, `cancelled` |
| `confirmed` | Paid by card | Confirmed by phone or WhatsApp | Stripe webhook or admin | `packed`, `cancelled` (COD only) |
| `packed` | Packed | Packed | Admin | `shipped`, `cancelled` (COD only) |
| `shipped` | With the courier | With the courier, cash due; stock deducted | Admin | `delivered`, `returned_to_sender` (COD only) |
| `delivered` | Delivered; return window running | Delivered, cash collected; return window running | Admin | final |
| `returned_to_sender` | | Refused or undeliverable, parcel back | Admin | final |
| `expired` | Checkout abandoned, hold released | | Stripe webhook or job | final |
| `cancelled` | After launch | Cancelled before shipping, hold released | Admin or job | final |

### Payment
`unpaid` -> `paid` -> `partially_refunded` -> `refunded`, plus `voided` for COD orders that are cancelled or returned to sender. `needs_attention` is a flag, not a status.

### Return
| Status | Meaning | Next |
|---|---|---|
| `requested` | Customer submitted | `approved`, `rejected`, `cancelled` |
| `approved` | Instructions sent to the customer | `received`, `cancelled`, `expired` |
| `rejected` | Declined with a reason | final |
| `received` | Items back, condition recorded | `refunded`, `closed_no_refund` |
| `refunded` | Stripe confirmed the refund | final |
| `closed_no_refund` | Received, not refunded (reason logged) | final |
| `cancelled` | Customer cancelled | final |
| `expired` | Approved but never received | final |

### Refund
`pending` -> `succeeded` or `failed`.

## Integrations

### Stripe (`/api/webhooks/stripe`)
Raw body + signature check; event IDs stored in `stripe_events`; API version pinned in code.

| Event | Action |
|---|---|
| `checkout.session.completed` | Mark confirmed and paid, deduct stock, send emails |
| `checkout.session.expired` | Release the hold, set the order to Expired |
| `refund.created`, `refund.updated` | Update refund status; on success finish the return, issue the credit note, email the customer |
| `refund.failed` | Mark failed, alert the admin |
| `charge.dispute.created` | Alert the admin (chargeback) |

### Clerk (`/api/webhooks/clerk`)
Verified with `verifyWebhook()`. `user.created` and `user.updated` upsert `customers` and link guest orders. `user.deleted` anonymises the profile and keeps orders.

### Cloudinary (ADR-038)
All media lives in Cloudinary Free, used exclusively through `src/services/media`. We don't store Delivery URLs, only the `public_id` (e.g. stored in `product_images.media_key`).

**Setup per environment:** One base folder per environment (`CLOUDINARY_FOLDER` = `ar-dev` | `ar-staging` | `ar-prod`). Dev and staging share an account; Production gets its own account. 
Every upload must set BOTH `public_id` and `asset_folder` to the exact same path (e.g. `{folder}/products/{productId}/{productColourId}/<id>`) so the Media Library stays organized.

**Media adapter API (`src/services/media`):** `signUpload(kind, context)`, `finishUpload(key)`, `imageUrl(key, width)`, `privateUrl(key, ttl)`, `remove(key)`.
- `signUpload`: generates signed parameters for a browser POST direct to Cloudinary.
- `finishUpload`: verifies the format, size, and dimensions of the resulting asset. If valid, saves to DB. If invalid or DB fails, deletes the asset from Cloudinary immediately.
- `remove`: calls Cloudinary `destroy` with `invalidate: true`.

- **Delivery:** Images use our `next/image` loader (`src/lib/media-loader.ts`), snapping widths to named transformations (e.g., `t_ar_w400`). Images are delivered directly from `res.cloudinary.com`. No custom domains are used on the free tier.
- **Strict Transformations:** Turned ON to prevent unlisted size requests and protect bandwidth.
- **Return Photos:** Uploaded as type `authenticated`. Admins view them through `privateUrl` which strips metadata.
- **Banners & Promo Artwork:** Managed via `/admin/banners`. Uploads separate desktop (8:3, max 2400px) and mobile (4:5, max 1200px) keys to `{folder}/banners/{bannerId}/` with real-time device preview simulation. Storefront currently displays static fallback images until promoted.

## Routes
- **Storefront:** `/`, `/shop` (filters as query params: `?size=`, `?colour=`, `?sort=`, `?sale=1`), `/shop/[category]`, `/products/[slug]` (`?colour=<slug>` opens a colour), `/cart`, `/checkout` (delivery details and payment choice), `/checkout/success`, `/checkout/cancelled`, `/checkout/received/[orderNumber]` (COD, signed in), `/sign-in`, `/sign-up`, `/account/orders`, `/account/orders/[orderNumber]`, `/account/orders/[orderNumber]/return`, `/account/returns/[returnNumber]`, `/blog`, `/blog/[slug]`, `/about`, `/contact`, `/policies/[slug]`
- **Admin:** `/admin/login`, `/admin/mfa`, `/admin`, `/admin/categories`, `/admin/colours`, `/admin/sizes`, `/admin/products`, `/admin/products/[id]`, `/admin/products/upload` (stock sheet upload, preview and history), `/admin/stock`, `/admin/orders`, `/admin/orders/[id]`, `/admin/customers`, `/admin/returns`, `/admin/returns/[id]`, `/admin/reports/cod`, `/admin/banners`, `/admin/payments`, `/admin/blog`, `/admin/blog/[id]`, `/admin/settings`, `/admin/staff`, `/admin/audit`
- **API:** `/api/admin/catalogue-export`, `/api/webhooks/stripe`, `/api/webhooks/clerk`, `/api/invoices/[orderId]`, `/api/credit-notes/[id]`, `/api/cron/reconcile-checkouts`, `/api/cron/expire-returns`, `/api/cron/purge-return-photos`, `/api/health`, `/sentry-tunnel` (added by the Sentry SDK)

## Environments
| Service | Local | Preview / Staging | Production |
|---|---|---|---|
| Hosting | `localhost:3000` | Vercel preview deployments | Vercel production |
| Supabase | Local (Supabase CLI + Docker) | Staging project | Production project |
| Clerk | Development instance | Development instance | Production instance on the client's domain |
| Stripe | Test mode + Stripe CLI | Test mode | Live mode |
| Resend | Test API key | Test API key | Live key, verified domain |
| Cloudinary | Shared Account, Folder: `ar-dev` | Shared Account, Folder: `ar-staging` | Dedicated Account, Folder: `ar-prod` |
| Sentry | Off (no DSN) unless testing Sentry itself | One project, environment `preview` | Same project, environment `production` |

## External Services and Costs
| Service | Plan | Monthly | Notes |
|---|---|---|---|
| Vercel | Pro | From $20 + usage | Hobby is non-commercial only |
| Supabase | Pro | $25 + usage | Daily backups |
| Clerk | Hobby | $0 up to 50k monthly retained users | Pro ($25/mo) removes Clerk branding |
| Resend | Free, then Pro | $0, then $20 | Free is capped at 100 emails a day |
| Cloudinary | Free tier | $0 | 25 credits per rolling 30 days (1 credit = 1GB bandwidth or storage). Upgrade to Plus ($89) if exceeded. |
| PostHog | Free tier | $0 | |
| Sentry | Developer (free) | $0 | One user, email alerts only; limits under "Sentry" above. Team ($26/mo billed annually) adds people, Slack and higher limits |
| Stripe | Pay as you go | 2.9% + AED 1 per domestic card | Paid by the client; the fee isn't returned on refunds |

Fixed cost: about $45 to $90 a month, plus Stripe fees.
