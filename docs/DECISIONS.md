# Architecture Decisions

> Permanent decisions and why we made them. Don't change one without approval: add a new ADR that replaces it.
> The current project state lives in `MEMORY.md`.

## ADR-001: One Next.js app for storefront and admin
**Status:** Accepted, 5 Oct 2026
**Decision:** Build the storefront and the admin dashboard in one Next.js App Router app. The admin lives under `/admin`.
**Reason:** One codebase, shared types and services, server rendering for SEO, and no separate backend to run.

## ADR-002: Supabase for the database and backend
**Status:** Accepted, 5 Oct 2026
**Decision:** Supabase PostgreSQL with Row Level Security and Postgres functions.
**Reason:** Managed Postgres, auth, RLS and backups without running our own infrastructure.

## ADR-003: Clerk for customer accounts
**Status:** Accepted, 5 Oct 2026
**Decision:** Customers sign up and sign in with Clerk, connected to Supabase as a third-party auth provider.
**Reason:** Ready-made, secure auth screens and flows; free up to 50,000 monthly retained users; native Supabase integration (Clerk's old JWT templates have been deprecated since 1 Apr 2025).

## ADR-004: Supabase Auth for admins, on a separate login
**Status:** Accepted, 5 Oct 2026
**Decision:** Admins log in with Supabase Auth at `/admin/login`. Invite only, TOTP 2FA required.
**Reason:** Keeps staff out of the customer user pool. Supabase's TOTP 2FA is free, so admins get 2FA without paying for Clerk Pro.

## ADR-005: RLS compares `sub` as text, never `auth.uid()`
**Status:** Accepted, 5 Oct 2026
**Decision:** Policies compare `auth.jwt()->>'sub'` as text. Admin checks use `is_admin()`.
**Reason:** Clerk IDs aren't UUIDs. `auth.uid()` casts to uuid and throws, and because policies are OR'd together, a single admin policy using it would break customer requests.

## ADR-006: Stripe Checkout hosted page only
**Status:** Replaced by ADR-033, 9 Oct 2026 (was Accepted, 5 Oct 2026)
**Decision:** Stripe Checkout hosted page in AED: cards, Apple Pay, Google Pay. No cash on delivery, no buy-now-pay-later.
**Reason:** The client's requirement. Card data never touches our servers, and wallets work out of the box.

## ADR-007: Hold stock at checkout, deduct on payment
**Status:** Accepted, 5 Oct 2026
**Decision:** Hold stock when checkout starts. The Stripe session expires after 31 minutes. Deduct on `checkout.session.completed`; release on expiry or cancel.
**Reason:** Prevents overselling without locking stock forever. Stripe needs a session to last at least 30 minutes after it's created.

## ADR-008: Only the Stripe webhook marks orders paid
**Status:** Accepted, 5 Oct 2026
**Decision:** Card orders become paid only in the signed webhook handler, never from the success page. Amended 9 Oct 2026 (ADR-033): a COD order becomes paid only when an admin with `aal2` records the cash collected at delivery.
**Reason:** The success page can be skipped, refreshed or faked. Webhooks are signed, and Stripe retries them.

## ADR-009: Resend for transactional email
**Status:** Accepted, 5 Oct 2026
**Decision:** Resend + React Email for every store email, and as Supabase's SMTP server. Clerk sends its own auth emails.
**Reason:** Simple API and React templates. Supabase's built-in sender isn't meant for production (2 emails an hour, team members only).

## ADR-010: Cloudinary behind a media adapter
**Status:** Replaced by ADR-037, 10 Oct 2026 (was Accepted, 5 Oct 2026)
**Decision:** Cloudinary for images for now, used only through `src/services/media`. The database stores keys, not URLs.
**Reason:** Cloudinary will be replaced later (PRD Q19). Swapping providers should touch one module.

## ADR-011: Return photos as private Cloudinary uploads
**Status:** Replaced by ADR-037, 10 Oct 2026 (was Accepted, 5 Oct 2026)
**Decision:** Return photos are `authenticated` Cloudinary uploads in `returns/`, viewed through signed links that expire after 1 hour. Not Supabase Storage.
**Reason:** Team decision to keep all media with one provider. These photos must never be public.

## ADR-012: Manual restock after returns
**Status:** Accepted, 5 Oct 2026
**Decision:** Stock never goes back automatically. The admin adjusts it with a reason.
**Reason:** Client decision. A person checks the item's condition first.

## ADR-013: Manual fulfilment in v1
**Status:** Accepted, 5 Oct 2026
**Decision:** The admin sets Packed, Shipped and Delivered by hand. Amended 9 Oct 2026: Shipped is in v1 for every order, with the courier and tracking number typed in, because COD stock is deducted when the parcel ships. No courier integration.
**Reason:** No delivery partner has been chosen yet.

## ADR-014: Money as integer fils
**Status:** Accepted, 5 Oct 2026
**Decision:** Store and calculate money in fils (1 AED = 100 fils).
**Reason:** Avoids floating point errors and matches Stripe's smallest-unit amounts.

## ADR-015: Categories as a table
**Status:** Accepted, 5 Oct 2026
**Decision:** A `categories` table plus `products.category_id`, one category per product, managed in the admin.
**Reason:** The client hasn't chosen the categories yet (PRD Q11). The admin can add or rename them without a developer.

## ADR-016: English website, bilingual invoices
**Status:** Accepted, 5 Oct 2026
**Decision:** The website is English only. Invoices and credit notes are in English and Arabic.
**Reason:** The client wants English only, but UAE rules require Arabic on invoices.

## ADR-017: Gapless invoice numbers
**Status:** Accepted, 5 Oct 2026
**Decision:** Invoice and credit note numbers come from a locked counter row.
**Reason:** Tax documents need sequential numbers, and Postgres sequences can skip.

## ADR-018: Snapshot prices on order lines
**Status:** Accepted, 5 Oct 2026
**Decision:** Copy the product name, variant, price, VAT and final-sale flag onto each order line.
**Reason:** Later edits must never change past orders, invoices or refunds.

## ADR-019: Vercel Pro hosting
**Status:** Accepted, 5 Oct 2026
**Decision:** Host on Vercel Pro.
**Reason:** First-class Next.js hosting with a preview deployment for every pull request. The Hobby plan is for non-commercial use only.

## ADR-020: Guest checkout
**Status:** Proposed, waiting on PRD Q1
**Decision:** Allow guest checkout. Link guest orders to an account when the customer signs up with the same verified email.
**Reason:** About 1 in 5 shoppers who abandon checkout do it because they're forced to create an account (Baymard).

## ADR-021: Supporting libraries
**Status:** Accepted, 5 Oct 2026
**Decision:** Zod (validation), React Hook Form (forms), Zustand (cart state), Tiptap (blog editor), Vitest, Playwright and pgTAP (testing).
**Reason:** Common, well-documented choices that fit Next.js and shadcn/ui. Stops the AI from adding alternatives.

## ADR-022: PDF engine for invoices
**Status:** Open, decided in TASK-062
**Decision:** TBD after a spike on Arabic text shaping and right-to-left layout.
**Reason:** Arabic must render correctly on every invoice and credit note.

## ADR-023: Colours and sizes, with one SKU per colour and size
**Status:** Accepted, 6 Oct 2026; amended 9 Oct 2026
**Decision:** Products have colourways picked from a store-wide colour list. Each colourway comes in its own sizes, picked from a store-wide size list. Every colourway + size is one `product_variants` row: a SKU with its own price and stock. Amended 9 Oct 2026: every product has at least one colourway and every colourway at least one SKU; a SKU can have no size. The page shows a colour or size picker only when there's more than one option, which gives four shapes (sizes only, colours and sizes, colours only, no choice). The colour and size lists take the client's names exactly as written and have no codes.
**Reason:** This is how the client stocks clothes: each colour can come in different sizes. Store-wide lists keep names, swatches and filters consistent. Holds, orders, returns and the stock ledger all point at one SKU row, which keeps them simple.

## ADR-024: Photos belong to a colour
**Status:** Accepted, 6 Oct 2026
**Decision:** `product_images` belong to a product colour. Every size of that colour uses the same photos.
**Reason:** Client decision. Photos are taken per colour, so the admin uploads them once, and switching colour swaps the gallery.

## ADR-025: SKU rules
**Status:** Accepted, 6 Oct 2026; amended 9 Oct 2026
**Decision:** SKUs are the client's own (PRD Q23, answered by their stock sheet on 7 Oct 2026), stored and shown exactly as written. The store never generates, suggests or changes a SKU, not even its capitals. SKUs are unique ignoring letter case. A SKU locks when it's first sold. SKUs with history are deactivated, never deleted or reused. Amended 9 Oct 2026: the suggestion `{style code}-{colour code}-{size code}` and the capitals-only pattern are removed.
**Reason:** Orders, invoices, returns and the stock ledger reference SKUs. Renaming or reusing one would make the history wrong.

## ADR-026: Stock counts stay private
**Status:** Accepted, 6 Oct 2026
**Decision:** Stock lives in `stock_levels`, which visitors and customers can't read. The storefront gets a status per SKU from `variant_availability()`: in stock, low (with the number left at 3 or fewer) or sold out.
**Reason:** Public stock counts reveal sales volumes to anyone. A separate table also keeps the public catalogue reads simple.

## ADR-027: Sentry for monitoring, starting on the free plan
**Status:** Accepted, 6 Oct 2026
**Decision:** Sentry for errors, tracing, logs, session replay on errors, one cron monitor (reconcile checkouts) and one uptime monitor (`/api/health`), on the free Developer plan. This replaces Better Stack from the first draft of the docs.
**Reason:** One tool with a first-class Next.js SDK, and the free plan covers launch traffic. Its limits: one user, email alerts only, 5,000 errors, 50 replays, one cron monitor and one uptime monitor a month, and no pay-as-you-go. Move to Team ($26/mo billed annually) when a second person needs access or a limit is hit.

## ADR-028: Look from the client's reference, themed through shadcn tokens
**Status:** Accepted, 6 Oct 2026
**Decision:** The storefront follows the client's reference: warm off-white, sand panels, black buttons, square corners, Cormorant Garamond and Montserrat. Colours, radius and fonts are CSS variables set by a shadcn preset, and components only use the semantic tokens.
**Reason:** There's no designer yet (PRD Q17). The look can change later with `shadcn apply --only theme,font` without rewriting components.

## ADR-029: The client's stock sheet is the source
**Status:** Accepted, 9 Oct 2026
**Decision:** Values from the client's sheet (SKUs, style codes, product names, colour and size names, details, descriptions, prices) are stored and shown exactly as written. The store never generates, suggests, tidies or fixes them: no trimming, no case changes, no spelling fixes, no merging of similar names, no rounding. Problems are reported as errors or warnings with the row number, and the client fixes their own sheet. The website hides only empty and `-` values.
**Reason:** The client's decision. The sheet is their master list, and their codes are used by their supplier and their staff. Silent fixes would make the store and the sheet disagree.

## ADR-030: Style code and details per colourway
**Status:** Accepted, 9 Oct 2026
**Decision:** `product_colours` stores the client's style code (required, not unique, searchable) and `details`: one JSON object keyed by the sheet's detail headers, checked by one Zod schema. Our generated ST0001 style codes are removed.
**Reason:** In the client's numbering every colourway has its own style code, and the pieces of a set can differ by colourway (a pink kurta with an orange dupatta). One JSON field keeps the sheet's columns without a table per piece.

## ADR-031: Price per SKU
**Status:** Accepted, 9 Oct 2026
**Decision:** `price_fils` and `compare_at_fils` live on `product_variants`; `products` has no price. The admin can type a price once for all sizes. Cards show "From AED" when a product's SKUs have different prices.
**Reason:** The client's sheet has a Selling Price per SKU (PRD Q10). One place for the price is simpler than a product price with overrides.

## ADR-032: Stock sheet upload and export
**Status:** Accepted, 9 Oct 2026
**Decision:** Admins with `aal2` upload the client's own sheet (.xlsx or .csv), columns found by header name. The server previews every change, error and warning, then `apply_catalogue_import()` applies all rows or none. Rows match on SKU; an empty cell changes nothing; SKUs missing from the sheet are never deleted or zeroed; the same file twice changes nothing. Export writes the same format back with every value as stored.
**Reason:** The client keeps products in a spreadsheet. A preview and an all-or-nothing apply make bulk changes safe, and editing one product at a time in the admin still works.

## ADR-033: Cash on delivery next to Stripe Checkout
**Status:** Accepted, 9 Oct 2026, pending the client's budget and timeline sign-off. Replaces ADR-006
**Decision:** Checkout offers Stripe Checkout (card, Apple Pay, Google Pay) or cash on delivery. COD orders are placed through `place_cod_order()`, confirmed by the admin by phone or WhatsApp within 24 hours (or cancelled automatically), have stock deducted when they ship, and are paid when the admin records the cash. Defaults, all settings: signed-in customers only, up to AED 1,000, no fee, one open COD order per customer, blocked after 2 refused parcels. Refused parcels are restocked by hand; refunds are paid by bank transfer. No buy-now-pay-later.
**Reason:** The client asked for COD on 9 Oct 2026; many UAE shoppers expect it. The confirmation call, the limits and the refusal block keep fake orders and refused parcels low.

## ADR-034: Our own checkout page for delivery details
**Status:** Accepted, 9 Oct 2026
**Decision:** `/checkout` collects the delivery details for both payment methods and shows the payment choice. Stripe Checkout is used for the payment only and no longer collects the address.
**Reason:** A COD order never reaches Stripe. One form gives every order the same UAE address format and lets signed-in customers reuse their last address.

## ADR-035: Order and payment statuses for two payment methods
**Status:** Accepted, 9 Oct 2026
**Decision:** One order track for both methods: `pending_payment`, `awaiting_confirmation`, `confirmed` (renamed from `paid`), `packed`, `shipped`, `delivered`, `returned_to_sender`, `expired`, `cancelled`. Payment has its own status, which gains `voided`. COD invoices are issued when the cash is collected.
**Reason:** A confirmed COD order isn't paid yet. Nothing in orders was built when this changed, so the rename costs nothing. Invoicing at collection means refused parcels never use an invoice number (PRD Q40).

## ADR-036: ExcelJS for the stock sheet
**Status:** Proposed, 9 Oct 2026, confirm before TASK-113
**Decision:** Add `exceljs` to read and write .xlsx (CSV is read with the same service). Server only, behind `src/services/sheets`.
**Reason:** The client's sheet is .xlsx. ExcelJS reads cell values without running formulas and writes text cells, so the export needs no apostrophe trick (a safe CSV export would have to change values like `-`). Extends ADR-021.

## ADR-037: Photos on Cloudflare R2, resized once at upload with sharp
**Status:** Accepted, 10 Oct 2026. Replaces ADR-010 and ADR-011; answers PRD Q19
**Decision:** All media lives in Cloudflare R2, used only through `src/services/media`. Two buckets per environment: a public one with the resized WebP copies, served from `media.<client-domain>` behind Cloudflare's cache, and a private one with the originals and return photos. Admin photos are resized once, at upload, with sharp (fixed widths per kind); return photos are only re-saved to drop metadata. Uploads go straight from the browser to R2 with signed links; private files are shown through signed links that expire after 1 hour. Every upload gets a new key and copies are cached for a year. New packages: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `sharp` (extends ADR-021).
**Reason:** Cloudinary Free has 25 credits a month and the next plan is $89 to $99 a month. R2 has no egress fees and its free tier covers this store; the media address is the client's own domain; the S3 API avoids lock-in. Resizing at upload costs nothing per visitor, and the media adapter keeps the provider in one module.

---

## Template
```markdown
## ADR-0XX: Title
**Status:** Proposed / Accepted / Replaced by ADR-0YY, date
**Decision:** What we decided.
**Reason:** Why.
```

## ADR-038: Cloudinary for media

**Status:** Accepted (2026-10-11)
**Supersedes:** ADR-037

**Decision:** We are dropping Cloudflare R2 and sharp in favour of Cloudinary Free. All media is managed exclusively through src/services/media and the src/lib/media-loader.ts. The database stores the Cloudinary public_id, never Delivery URLs.

**Why:** Cloudflare R2 requires a payment method to begin, and the client's card is not ready. Cloudinary Free allows up to 25 credits per rolling 30 days without a card (1 credit = 1,000 transformations, 1 GB storage, or 1 GB bandwidth). Bandwidth is the main cost. Upgrade path: Plus (-99/month) or migrate back to R2 later.

**Key constraints and flows:**
- **No sharp, no R2, no AWS SDK:** Remove @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, and sharp. Add cloudinary (Node SDK, server only).
- **Public IDs and Folders:** One base folder per environment (CLOUDINARY_FOLDER = r-dev | r-staging | r-prod). Every upload must set BOTH public_id and sset_folder to the same path, or the Media Library dumps everything in the root:
  - {folder}/products/{productId}/{productColourId}/{id}
  - {folder}/categories/{categoryId}/{id}
  - {folder}/banners/{bannerId}/{id}
  - {folder}/blog/{postId}/{id}
  - {folder}/returns/{returnId}/{id} (type: uthenticated)
  Every upload gets a new ID. overwrite: false. Never re-upload the same file.
- **Upload Flow (admin, aal2 only):** 
  - Browser checks type (jpg, png, webp) and size (max 10 MB).
  - Server action signs fixed params (public_id, sset_folder, 	imestamp, llowed_formats, overwrite=false, incoming transformation c_limit,w_2400). Cloudinary signatures are valid for 1 hour.
  - Browser POSTs to Cloudinary.
  - Server verifies the result (format, bytes, width, height) in inishUpload and only then saves it to the DB. If any check or save fails, the server deletes the asset from Cloudinary.
- **Adapter API Stability:** Keep existing adapter names (signUpload, inishUpload, privateUrl, 
emove). inishUpload becomes the verify-and-save step. A future switch back to R2 will only touch this folder and media-loader.ts.
- **Return Photos:** Customer must be signed in (Clerk). Same checks apply. Uploaded as type uthenticated. Admins view them through signed URLs with a metadata-stripping transformation. Never public.
- **Delivery & Transformations:** Custom 
ext/image loader (src/lib/media-loader.ts) snaps widths to exactly 200, 400, 600, 800, 1200, 1600, 2400 using named transformations 	_ar_w{width} (each defined as _auto,q_auto,c_limit,w_{width}). Strict transformations must be ON in every environment to prevent random size requests.
- **Widths by Type:** Products/Blog: 400, 800, 1200, 1600. Categories: 200, 400, 600. Banners: 800, 1200, 1600, 2400. Files in public/ keep unoptimized.
- **Banned practices:** Never use w_auto, dpr_auto, responsive breakpoints, Cloudinary default-image placeholders, or hand-written transformation strings. One URL builder only.
- **Deletions:** Deleting an image in admin calls destroy with invalidate: true.
- **Monitoring:** Usage email alerts are ON. Dashboard checked monthly. No custom domains on Free/Plus (URLs use 
es.cloudinary.com).
- **Environments:** Dev and staging share one Cloudinary account using folders. Production gets its own account before launch.

---

## ADR-039: Customer UAE bank details for COD return refunds
**Status:** Accepted, 16 Oct 2026. Amends ADR-035 and PRD Q39
**Decision:** When a customer requests a return for a Cash on Delivery (COD) order, the return submission form allows them to provide their UAE bank transfer details (Bank Name, Account Holder / Beneficiary Name, and UAE IBAN). These details are stored in `public.return_requests` and presented to administrators on `/admin/returns/[id]` to facilitate direct bank transfer execution when processing the refund.
**Reason:** Seamless customer experience. Directly collecting the customer's IBAN during return submission eliminates manual back-and-forth communication over email/WhatsApp, accelerating claim resolution. Admins can verify the details and record the bank transfer reference in one unified workflow.
