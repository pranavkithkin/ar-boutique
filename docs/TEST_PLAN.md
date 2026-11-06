# Test Plan

> Defines what "working" means. Every task adds or updates the tests for its area.

## Tools and Commands
| Level | Tool | Command |
|---|---|---|
| Type check | TypeScript | `npm run typecheck` |
| Lint | ESLint | `npm run lint` |
| Design tokens | Script (fails on hard-coded colours or font names in components) | `npm run check:tokens` |
| Unit | Vitest | `npm test` |
| Database (RLS, functions) | pgTAP through the Supabase CLI | `npm run test:db` |
| Integration | Vitest + local Supabase + Stripe CLI | `npm run test:integration` |
| E2E | Playwright | `npm run test:e2e` |
| Build | Next.js | `npm run build` |

After every task: typecheck -> lint -> tokens -> unit -> DB -> integration -> E2E (affected flows) -> build.

## Test Data
- Seed: 3 categories; colours Black, Ivory and Sand, plus one without a swatch colour; sizes XS to XL and Free Size; products in all four shapes: sizes only (one colour in M and XL, like the client's sheet), colours and sizes (3 colours with different sizes per colour), colours only (2 colours, no size) and no choice (one SKU); SKUs and style codes in the client's format (e.g. `JAA25DR01112-M`), never generated; one product with different prices per size; SKUs with stock 0, 1 and 5; one final-sale product; COD settings at their defaults; one local admin.
- Stock sheet fixtures in `tests/fixtures/`: the client's sheet of 7 Oct 2026 as sent (rows 38 to 43 must be rejected), a corrected copy with Size, Product Name, Stock and Category filled, and small sheets for each error and warning.
- Stripe test cards:
  - `4242 4242 4242 4242`: payment succeeds
  - `4000 0025 0000 3155`: needs 3D Secure
  - `4000 0000 0000 9995`: declined (insufficient funds)
  - `4000 0000 0000 5126`: refund fails
- Local webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Customer Accounts
- Customer can sign up, verify their email and sign in
- Wrong password shows an error
- Logged-out users can't open `/account/*`
- Customer A can't see customer B's orders, invoices or returns (UI, API and RLS)

## Admin Access
- Admin can log in with a password and an authenticator code
- An admin without 2FA is sent to `/admin/mfa` and can't load any data
- A Clerk customer can't open any `/admin` page or read admin data
- An invited admin can set a password; a deactivated admin is blocked immediately
- Public sign-up is impossible

## Catalogue
- Admin creates a category, colours, sizes and a product with two colours, photos per colour, sizes and stock; the product appears on the storefront on the next load
- A product can't be published without a visible colourway with a photo, an active SKU, and a price on every active SKU
- Draft and archived products, hidden colours and inactive SKUs never show on the storefront or in the sitemap
- Choosing a colour shows that colour's photos for every size; choosing a size never changes the photos
- A sizes-only product shows no colour swatches and adds the chosen size; a product with one SKU adds with no picker; a colours-only product shows swatches and no size picker
- Adding a second colour to a sizes-only product keeps its SKUs, stock and orders
- Details show the colourway's values exactly as stored and skip empty and `-` values; "From AED" shows only when SKU prices differ
- `?colour=ivory` renders the Ivory photos in the server HTML; an unknown colour falls back to the default colour
- Only the sizes the chosen colour comes in are shown; sold-out sizes are visible but can't be selected
- Stock is per SKU: selling Black M changes only Black M
- "Only N left" shows at 3 or fewer; availability updates without a redeploy
- A duplicate SKU is rejected in any letter case (form and database)
- SKUs, style codes, colour and size names and details are saved exactly as typed: no capitals forced, nothing trimmed or tidied; a space at the start or end is rejected
- Nothing is generated: saving a colourway without a style code or a SKU row without a SKU is rejected, and no code path creates a SKU or a style code
- A sold SKU can't be renamed or deleted, only deactivated; a used colour or size can only be hidden
- A SKU can't point at another product's colour (database constraint)
- Visitors and customers can't read stock counts, only statuses (pgTAP)
- Size and colour filters only match in-stock SKUs; sold-out products show last with a badge
- A category that still has products can't be deleted
- Every stock change needs a reason and shows in the history

## Stock Sheet Upload
- The preview changes nothing; apply is all or nothing; uploading the same file twice is a no-op
- Upload, then export, gives back the same cells, `-`, capitals and spelling included
- Columns in any order work; unknown columns are listed as not used and not stored
- A duplicate SKU in any letter case is rejected with both row numbers; the client's sheet as sent (rows 38 to 43) is rejected with clear row errors
- Two rows that disagree (name, category, description, Style or a detail) are rejected and both rows are named; an empty cell isn't a disagreement
- An empty cell never wipes an admin edit
- Bad numbers, prices with more than 2 decimals and a compare-at price not above the price are rejected, never rounded
- A sold SKU's Style, size and colour can't change; its price and stock can
- Stock can't go below what's held; every stock change writes a ledger row with the import ID
- A new colour, size or category is added exactly as written and shows as a warning; near-duplicates (`Sea green` and `Sea Green`) are warned about, never merged
- SKUs missing from the sheet are listed, never deleted or set to zero
- New products land as Draft; Product Group rows become one product with a colour picker
- Only `aal2` admins can upload, apply or export; files over the limits, macro files and fake .xlsx files are rejected; formulas never run
- The export opens in Excel with no formulas, and values like `-` and `=1+1` stay as text

## Media (Cloudinary)
- Uploads only work with a signed link from our server; a link expires after 5 minutes and only works for its own key
- A file over 10 MB, or one that isn't a real JPEG, PNG or WebP image, is deleted and rejected
- Each admin photo gets its WebP copies at the widths for its kind; a sideways phone photo comes out upright; the copies have no metadata
- The loader picks the smallest stored width at least as wide as requested; files in `public/` are never sent through it
- Replacing a photo creates a new key; deleting one removes the original and every copy
- Product photo keys outside the colourway's folder are rejected

## Cart
- The cart survives a reload; quantities are capped at the SKU's stock and at 5 per line
- The same product in two sizes makes two lines
- A price change, deactivated SKU, hidden colour or unpublished product is flagged and fixed in the cart
- The delivery fee is visible before checkout

## Checkout and Stock
- Successful payment: order Confirmed and payment Paid, stock deducted, one customer email, one admin email, invoice attached
- The delivery details form is required for both payment methods and prefilled for signed-in customers; Stripe doesn't ask for the address again
- Two shoppers, last unit of a SKU: only one gets the hold; the other sees sold out before paying
- Abandoned checkout: the hold is released when the Stripe session expires (test by expiring the session through the API)
- Stripe's back link: the session is expired and the hold released straight away
- Starting checkout twice from the same cart leaves only one hold
- Webhook replay: no double deduction, no duplicate emails
- A price edited in the browser is ignored; Stripe charges the database price
- A declined card leaves the order pending until it expires; no emails are sent
- The success page never marks an order paid by itself
- The reconciliation job fixes a pending order whose webhook was missed

## Cash on Delivery
- Placing a COD order holds the stock and creates one order (Awaiting confirmation, Unpaid); a double submit creates one order
- Confirming keeps the hold; an unconfirmed order is cancelled after the deadline and its stock released; cancelling before shipping releases the hold
- Stock is deducted once, at Shipped; `first_sold_at` is set then
- Delivered with cash collected: payment Paid, invoice number assigned and the invoice emailed; no invoice before that
- A refused parcel (Returned to sender) never restocks itself, and counts towards the refusal limit by account and by phone number
- The server rejects COD for guests, over the maximum, with another open COD order, after 2 refusals and for a customer with COD turned off, even when the browser sends the request directly
- A price or fee edited in the browser is ignored
- The COD fee shows before placing the order and on the order, emails and invoice
- Two shoppers, last unit: a COD order and a card checkout can't both hold it
- COD refunds are recorded as bank transfers with an amount, date and reference; no bank details are stored
- The COD report shows collected, paid out and outstanding cash correctly
- Card checkout is unchanged

## Orders
- Guest tracking (`/track-order`): opens while signed out; requires a valid order UUID and exact checkout email; order numbers are rejected; wrong credentials return a generic no-match result; result contains only status, courier and tracking reference. Card/COD confirmation emails include the UUID and tracking link. Confirmation pages reveal the UUID only with a matching customer session or stored Stripe Checkout Session.
- Admin moves an order Confirmed -> Packed -> Shipped (courier and tracking number) -> Delivered; the timeline shows each change and who made it
- The customer sees the same status in My orders
- Order lines show colour, size and SKU in the admin, My orders, emails and the invoice
- A guest order appears in the account after signing up with the same verified email, and not with an unverified one
- Invoice PDFs download only for the owner and admins; Arabic text renders correctly

## Returns
- The Return button shows only on Delivered orders inside the window with returnable items
- Final-sale items, undelivered orders and expired windows are blocked, including through direct API calls
- Photos are required for Damaged and Wrong item; a comment is required for Other
- Return photos are uploaded as type authenticated; no public URL works; admins view them via privateUrl stripping metadata
- A customer can't get an upload signature for someone else's order
- A return number is created and the confirmation and admin alert emails are sent
- The customer can cancel while Requested or Approved, not after Received
- Approve and reject emails include the instructions or the reason
- Approved returns not received within N days expire
- Photos are deleted 90 days after the return closes

## Refunds
- The refund is prefilled with what was paid for those items; it can be lowered with a reason and can't exceed the refundable balance
- The return only changes to Refunded after Stripe confirms
- A failed refund (`4000 0000 0000 5126`) alerts the admin and keeps the return Received
- A credit note is created when VAT is on, and not when VAT is off
- Stock doesn't change after a refund until the admin adjusts it, and the restock goes to the returned SKU

## Content and SEO
- Banner and blog changes show straight away; drafts stay hidden
- Every page has a unique title, description and canonical URL; product canonicals drop `?colour=`
- `sitemap.xml` lists published products, categories, posts and pages; `robots.txt` blocks admin, account, cart and checkout
- Product structured data (ProductGroup with one Product per SKU) passes Google's Rich Results Test

## Monitoring (Sentry)
- A test error from the browser, a Server Component, a Server Action and a Route Handler each reach Sentry with a readable stack trace, the right environment and the release
- Validation errors and sold-out messages aren't reported
- No personal data in events, logs or replays: emails, phone numbers, addresses, cookies and tokens are scrubbed; Replay masks text and inputs and never records `/admin`
- Events still arrive with an ad blocker on (tunnel route), and `proxy.ts` never redirects the tunnel
- The reconciliation job shows OK check-ins; a forced failure sends an alert email
- `/api/health` returns 200, and 503 when the database is unreachable; the uptime monitor alerts
- A daily job with no successful run in 26 hours raises an alert
- Sentry stays off in unit and E2E tests (no DSN)

## Design System
- `npm run check:tokens` passes: no hex colours, arbitrary colour values or font names in components
- The storefront matches `docs/DESIGN.md` at 375px, 768px and 1440px
- Applying another preset with `--only theme,font` re-themes the storefront and admin without code changes (checked once in TASK-004)

## Responsive
Test every page, storefront and admin, at:
- 375px
- 768px
- 1440px

## Accessibility
- Keyboard only: browse, pick a colour and size, add to cart, delivery details, payment choice, return form, admin forms, stock sheet upload
- Visible focus, labelled inputs, errors announced, AA contrast
- Colour and size pickers announce the selected and sold-out options to screen readers
- Automated axe checks in Playwright on key pages

## Performance
- Core Web Vitals "good" on mobile for home, category and product pages: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1

## Before Deployment
**Functionality**
- [ ] Customer sign-up, sign-in, sign-out; admin login with 2FA
- [ ] Browse, pick colour and size, cart, checkout, webhook, emails, invoice
- [ ] Cash on delivery: place, confirm, ship, cash collected, invoice; refused parcel
- [ ] Photos load from Cloudinary via the media loader and snapping widths
- [ ] Admin: categories, colours, sizes, products, colour photos, SKUs, stock, stock sheet upload and export, banners, posts
- [ ] Orders, returns and refunds end to end
- [ ] Forms, error handling, loading states, empty states

**UI**
- [ ] Mobile, tablet, desktop
- [ ] Accessibility and keyboard navigation

**Security**
- [ ] Everything in the `SECURITY.md` checklist

**Monitoring**
- [ ] A test error and a test alert reach Sentry from this environment

**Code**
- [ ] Typecheck, lint, tokens, unit, DB, integration and E2E tests pass
- [ ] Production build passes

## Preview QA (every pull request)
- Vercel preview deployment with staging services
- E2E smoke suite against the preview URL
- Manual check of the changed flow on a real phone

## Production QA (after every production deploy)
Live URL -> sign up -> sign in -> browse -> pick a colour and size -> add to cart -> delivery details -> pay -> order emails -> admin marks Packed, Shipped and Delivered -> return -> refund. Then one COD order: place -> confirm -> ship -> cash collected -> invoice.

Also test:
- Refreshing pages and opening direct URLs (including `?colour=` links)
- Logged-out access to account and admin pages
- Invalid inputs and wrong credentials
- Slow network (browser throttling)
- Empty states (new customer with no orders or returns)
