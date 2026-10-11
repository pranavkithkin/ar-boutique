# Product Requirements Document

**Product:** AR Boutique, **Version:** 1.2 (draft), **Owner:** Vivek VR, Tech Lead (Synops Labs), **Updated:** 9 Oct 2026

> PRD = WHAT we're building and WHY. How it works is in `ARCHITECTURE.md`.

## Product
AR Boutique: an online store for a women's wear brand selling to customers in the UAE.

- **Storefront** where shoppers browse, buy, track orders and request returns.
- **Admin dashboard** (`/admin`) where the store team runs everything day to day.

"AR" is the brand name. There is no augmented reality feature.

## Problem
The brand needs its own online store. UAE shoppers should be able to browse the collection, pay securely in AED, follow their order and return items easily. The team should be able to manage products, colours, sizes, stock, orders, returns, banners and blog posts without calling a developer.

## Target Users
| User | Who | What they need |
|---|---|---|
| Shopper | Women in the UAE shopping for women's wear, mostly on mobile (assumed) | Browse by category, pick a colour and a size, pay fast with card, Apple Pay or Google Pay, or cash on delivery, get a clear confirmation, return easily |
| Customer | A shopper with an account | Order history, invoices, return status |
| Store admin | The client's staff (how many: Q12) | One dashboard for catalogue, stock, orders, returns, refunds, banners and blog, on desktop or phone |

## Goal
Launch a fast, search-engine-ready store that sells the catalogue to UAE customers through Stripe, never oversells, handles returns and refunds professionally, and runs without a developer.

## Background
The client's proposal covers: a catalogue of 20 products with size and colour variants, cart and checkout, order confirmation emails to the customer and the store, a search-engine-ready structure, SSL and deployment, Stripe live and tested (Stripe's fees are paid by the client), and an admin backend for products, prices, images, stock, homepage banners, orders and blog posts.

Added during discovery: customer accounts, returns and refunds, admin 2FA and bilingual invoices. Added on 9 Oct 2026: a stock sheet upload and cash on delivery (COD). These go beyond the proposal, so confirm budget and timeline with the client.

On 7 Oct 2026 the client sent their stock sheet, `AR Boutique Stock-07th Oct'26.xlsx`: 42 SKUs in 21 styles, each style one colour in sizes M and XL, with their own SKU and style codes, prices and product details. It shows how their products look, so the catalogue is built around it, and the store uses its data exactly as written (business rule 18).

The client shared a design reference on 6 Oct 2026. Its look is captured in `DESIGN.md`.

## Core Features
1. Catalogue: categories, products, colourways and SKUs (usually one per size), each SKU with its own price and stock, built from the client's stock sheet
2. Cart and checkout: card, Apple Pay or Google Pay through Stripe, or cash on delivery
3. Customer accounts
4. Orders and order emails
5. Returns and refunds
6. Admin dashboard
7. Content: homepage banners, blog, policy pages
8. Search-engine-ready structure
9. Stock sheet upload and export: the client's own sheet adds or updates many products at once

## Products, Colours, Sizes and SKUs
The client's stock sheet shows how their products look, and the store follows it.

- A **product** is one page in the shop. It comes in one or more **colourways**.
- Each colourway has the client's **style code** (for example `JAA25DR01112`), its own photos and its own **details**: what's in the package, and the fabric, colour and pattern of the top, bottom and dupatta, plus neck, sleeve and bottom style.
- Each colourway comes in one or more **SKUs**, usually one per size. Each SKU has the client's SKU number, its own price and its own stock. That's what the shopper buys and what the admin counts.
- **Photos belong to the colourway.** The admin uploads them once, and every size of that colourway uses them.
- The product page only shows a choice when there is one, like Shopify:

| Shape | Example | Shopper sees |
|---|---|---|
| Sizes only | Every product in the client's sheet today: one colour in M and XL | A size picker. The colour shows in Details |
| Colours and sizes | The same design in Green and Pink (their rows share a Product Group) | Colour swatches that swap the photos, then the sizes of that colour |
| Colours only | A dupatta in 3 colours, no sizes | Colour swatches only |
| No choice | One item, one SKU | Just Add to cart |

Example from the client's sheet (rows 6 and 7):

| Product | Colourway | Size | SKU | Price | Stock |
|---|---|---|---|---|---|
| The client's Product Name | Green, style `JAA25DR01112`, its photos; details: Cotton, Floral, V-Neck, Short Sleeves | M | `JAA25DR01112-M` | AED 90 | From the sheet |
| | | XL | `JAA25DR01112-XL` | AED 90 | From the sheet |

**The client's data is used exactly as written.** SKUs, style codes, colour names, details, descriptions and prices are stored and shown as the client wrote them. The store never generates, suggests, tidies or fixes them (business rule 18).

## MVP

### Storefront
**Catalogue**
- CUS-01 Home page (layout in `DESIGN.md`): hero banner, shop by category, new arrivals, promo banner, latest blog posts
- CUS-02 Category pages and Shop all: product grid (colour swatches when a product has more than one colour; "From AED 90" when its SKUs have different prices); filter by size and colour (only options that are in stock); sort by newest and price; a Sale view of products with a compare-at price (Q25); sold-out products show last with a Sold out badge
- CUS-03 Product page: with more than one colour, pick a colour and the photos switch to it; with more than one size, pick a size from the sizes that colour comes in (sold-out sizes stay visible but disabled). A single option is selected automatically and shows no picker. Price and compare-at price, "Only N left", Final sale label, delivery and returns summary, Add to cart, description, and a Details section with the colourway's details exactly as the client wrote them. A link can open the product in a specific colour.
- CUS-04 Blog list and post pages
- CUS-05 Pages: About, Contact, Terms, Privacy, Returns & Refunds, Shipping & Delivery

**Cart and checkout**
- CUS-10 Cart saved in the browser (no login needed to shop); each line is one SKU and shows the colour's photo, the colour and the size; mini-cart drawer, change quantity, remove
- CUS-11 Delivery fee shown in the cart before checkout
- CUS-12 Check out signed in, or as a guest (Q1). Guests pay by card; cash on delivery needs an account (Q37)
- CUS-13 Choose how to pay: card, Apple Pay or Google Pay on Stripe's hosted page in AED, or cash on delivery
- CUS-14 Card: confirmation page and confirmation email with an English/Arabic invoice PDF
- CUS-15 Delivery details on our own checkout page, for both payment methods: name, UAE mobile, emirate, area, street and building, flat or villa, landmark. Prefilled for signed-in customers from their last order
- CUS-16 Cash on delivery: the COD fee (if any) and the amount to pay at the door are shown before placing the order; an "Order received" page and email say "We'll call or WhatsApp you to confirm". When COD isn't available, the option shows why (for example "Sign in to pay with cash on delivery")

**Account**
- CUS-20 Sign up, sign in, sign out, email verification, password reset
- CUS-21 My orders: list, detail, status (Awaiting confirmation for COD, then Confirmed, Packed, Shipped with the tracking number, Delivered), invoice download
- CUS-22 Guest orders show up in the account after signing up with the same verified email

**Returns**
- CUS-30 Return button on eligible delivered orders
- CUS-31 Return form: items and quantity, a reason per item, comment, up to 5 photos
- CUS-32 Return number (e.g. RET-1042), status page, email updates, cancel until the item is received
- CUS-33 Refund email. Card payments are refunded to the original payment method; COD orders by bank transfer

### Admin Dashboard
**Access**
- ADM-01 Separate login at `/admin/login` with password + authenticator app (2FA); staff join by invite only
- ADM-02 Audit log of every admin change

**Dashboard**
- ADM-10 Orders and revenue (today, 7 days, 30 days), COD orders to confirm (with the time left), orders to pack and ship, COD cash not yet paid out by the courier, open returns, failed refunds, low-stock SKUs

**Catalogue**
- ADM-20 Categories: create, rename, reorder, hide, and a photo for the Shop by category circles
- ADM-21 Colours and sizes: the store's colour list (name exactly as the client writes it, optional swatch colour) and size list (label exactly as written, display order). New names from a stock sheet upload are added as written. Create, rename, reorder, hide
- ADM-22 Products: add, edit, archive; name, description, category, final-sale flag, SEO fields, Draft or Published
- ADM-23 Colourways: add colours to a product, reorder, hide; the client's style code (required) and the details fields (top, bottom and dupatta, as in the client's sheet) per colourway; upload each colourway's photos (reorder, alt text, main photo), shared by all its sizes. A sizes-only product shows one colour; "Add another colour" turns on one tab per colour
- ADM-24 SKUs: per colourway, add a SKU with the client's SKU number (required, typed by the admin, never generated or suggested) and its size, or no size; price and compare-at price per SKU, typed once for all sizes or per size. The SKU number can be edited until it's first sold
- ADM-25 Stock: a colours x sizes grid on each product, plus a Stock page listing every SKU (search, low stock, out of stock); every change needs a reason, and the history is kept
- ADM-26 Find products by name, style code or SKU; find order lines by SKU
- ADM-27 Stock sheet upload: upload the client's own sheet (.xlsx or .csv), see a preview of every change, error and warning with its row number, then apply all rows or none. Upload history
- ADM-28 Export the catalogue in the same sheet format, every value exactly as stored

**Orders**
- ADM-30 Orders list with search (order number, email, phone, SKU) and filters (status, payment method); order detail with items (colour, size, SKU), customer, address, payment method and payment
- ADM-31 Mark Packed, then Shipped (courier and tracking number), then Delivered (this starts the return window); internal notes
- ADM-32 New-order email; download invoice; resend confirmation
- ADM-33 Cash on delivery: a queue of orders to confirm with the time left; confirm, or cancel with a reason; record the cash collected at delivery; mark a refused parcel Returned to sender; turn COD off for one customer
- ADM-34 COD report: cash collected, paid out by the courier, outstanding; record each courier payout with its reference

**Returns and refunds**
- ADM-40 Returns queue with email alerts; detail with photos and the customer's past returns
- ADM-41 Approve with instructions, or reject with a reason
- ADM-42 Mark received and record each item's condition
- ADM-43 Refund: through Stripe for card orders; for COD orders, the admin pays by bank transfer and records the amount, date and reference. The amount is prefilled from what was paid, can be lowered, never raised
- ADM-44 Close without refund, with a reason
- ADM-45 Restock shortcut for returned items, back to the same SKU (manual)

**Content and settings**
- ADM-50 Homepage banners: hero and promo, desktop and mobile image, small label, title, text, button, order, on/off
- ADM-51 Blog posts: rich text, cover image, SEO fields, Draft or Published
- ADM-52 Settings: store details, VAT, delivery fee, return window, announcement bar, notification emails, staff, cash on delivery (on or off, fee, maximum order value, hours to confirm, refused parcels before blocking)

### Emails
| Email | When | To |
|---|---|---|
| Order confirmation + invoice | Card payment confirmed | Customer |
| COD order received ("we'll call or WhatsApp you to confirm") | COD order placed | Customer |
| New order | Card payment confirmed | Admin |
| COD order to confirm | COD order placed | Admin |
| Shipped (courier, tracking number; for COD the amount to have ready) | Admin marks Shipped | Customer |
| Invoice | COD cash collected | Customer |
| Order cancelled | Admin cancels a COD order, or it isn't confirmed in time | Customer |
| Return request received | Return submitted | Customer and admin |
| Return approved (instructions) or rejected (reason) | Admin decides | Customer |
| Refund issued (+ credit note if VAT-registered) | Stripe confirms the refund | Customer |
| Refund failed, payment dispute, order needs attention | Problem detected | Admin |
| Sign-up, verification, password reset | Account actions | Customer |
| Invite, password reset | Staff actions | Admin |

Order emails show each line's colour photo, colour, size and SKU.

## Business Rules
1. **Prices** are in AED and set per SKU, exactly as in the client's sheet. Today every style has one price for all its sizes (Q10). If the business is VAT-registered, prices include 5% VAT (Q15, Q29).
2. **Colours and sizes:** a product has one or more colourways, and each colourway has one or more SKUs, usually one per size (a SKU can have no size). The page shows a colour or size picker only when there's more than one option. Colour and size names come from the store's lists, which take the client's names exactly as written.
3. **Photos** belong to a colourway and are shared by all its sizes. Every visible colourway needs at least one photo.
4. **SKUs** are the client's own, exactly as written (Q23). The store never generates, suggests or changes them, not even their capitals. They're unique across the store, ignoring letter case. A SKU can be edited until it's first sold. After that it's locked, and it's never deleted or reused. Every colourway also needs the client's style code.
5. **Stock** is tracked per SKU. Card checkout holds the items for about 30 minutes, and stock is deducted only when Stripe confirms payment. A COD order holds the items until it's confirmed, then until it ships, and stock is deducted when it ships. An abandoned card checkout and an unconfirmed COD order release their hold automatically. Shoppers see "in stock", "only N left" or "sold out", never exact stock counts.
6. **Publishing:** a product goes live only when it has at least one visible colourway with a photo and at least one active SKU, and every active SKU has a price.
7. **An order is paid** only when Stripe confirms it (card), never just because the customer reached the success page; or when an admin records the cash collected (COD).
8. **Each order email** is sent exactly once.
9. **Fulfilment** is manual in v1: the admin marks orders Packed, Shipped (courier and tracking number typed in) and Delivered.
10. **Returns** are allowed when the order is Delivered, it's inside the return window counted from the Delivered date (Q2), and the item isn't final sale (Q3).
11. **Return reasons:** Too small, Too big, Doesn't match photos, Damaged, Wrong item, Changed my mind, Other. Photos are required for Damaged and Wrong item; a comment is required for Other.
12. **Refunds** happen after the item is received. The amount defaults to what the customer paid for those items (discounts and VAT included) and can be lowered, never raised. Card refunds go through Stripe. COD refunds are paid by bank transfer and recorded by the admin; the store never stores bank details.
13. **Restocking** after a return is manual, with a reason, back to the same SKU. Stock never goes back automatically.
14. **Return photos** are private: only admins can see them, and they're deleted 90 days after the return closes.
15. **Invoices** are in English and Arabic, and each line shows the colour, size and SKU. Card orders get the invoice when paid; COD orders when the cash is collected, so refused parcels never use an invoice number (Q40). If VAT-registered, every refund gets a tax credit note within 14 days (issued automatically).
16. **History is kept:** products, colours and SKUs that appear in past orders are archived or hidden, never deleted. Past orders always show what the customer bought (product, colour, size, SKU) at the price they paid.
17. **Categories:** each product belongs to one category. The client names it in the Category column of their sheet, or the admin picks one (Q11, Q41). The admin manages the list.
18. **The client's data is the source.** SKUs, style codes, product names, colour and size names, details, descriptions and prices are stored and shown exactly as the client wrote them. The store never generates, suggests, tidies or fixes them. If something looks wrong, the upload shows the row and the reason, and the client fixes their own sheet. Empty cells and "-" mean "doesn't apply" and aren't shown on the website.
19. **Stock sheet upload:** a preview comes first, then all rows go in or none do. Rows match on SKU. An empty cell never changes or wipes a value. SKUs missing from the sheet are listed, never deleted or set to zero. Uploading the same file twice changes nothing.
20. **Cash on delivery:** signed-in customers only, orders up to AED 1,000, one open COD order per customer, confirmed by phone or WhatsApp within 24 hours or cancelled automatically, and blocked after 2 refused parcels (per account and per phone number). The admin can turn COD off for one customer. These are defaults until the client answers Q35 to Q39, and all are settings.
21. **Refused COD parcels** come back as Returned to sender and are restocked by hand (rule 13).

## Out of Scope (v1)
- Augmented reality or virtual try-on
- Arabic website or right-to-left layout (only invoices are bilingual)
- Tabby, Tamara, or any payment method other than Stripe Checkout and cash on delivery
- Delivery partner integration, shipping labels, live tracking (the admin types the courier and tracking number)
- Shipping outside the UAE, currencies other than AED
- Exchanges (Q5), store credit, gift cards
- Discount codes (Q8)
- Wishlist, reviews, loyalty, newsletters (Q25)
- Site search (Q22)
- Instagram feed (Q25)
- Stock sync with a physical shop or Instagram (Q9)
- Mobile apps

## After Launch (not in MVP)
- Size guide per category (Q21)
- Google sign-in
- Customers list in admin
- Cancel a paid card order before delivery with a full refund (COD orders can be cancelled before they ship in v1)
- Delivered email with the return-by date (Q14)
- Banner scheduling (start and end dates)
- Editable policy pages in admin
- Low-stock email alerts

## Success Criteria
A **shopper** should be able to:
1. Open a category and filter by size and colour
2. Pick a colour (when there's more than one), see that colour's photos, pick a size, add it to the cart and see the delivery fee
3. Pay with card, Apple Pay or Google Pay, or place a cash on delivery order
4. Receive exactly one confirmation email with the invoice
5. Sign in later and see the order and its status
6. Request a return with photos and follow it through to the refund

An **admin** should be able to:
1. Log in with 2FA
2. Create a category and a product with two colours, photos for each colour, sizes and stock per SKU, and see it live straight away
3. Get the new-order email and move the order to Packed, Shipped, then Delivered
4. Approve a return, mark it received, refund it, and restock the SKU manually
5. Change a homepage banner and publish a blog post without a developer
6. Upload the client's stock sheet, check the preview, apply it, and see every SKU, style code and value exactly as in the sheet
7. Confirm a COD order, ship it, record the cash and see the invoice go out

**Launch targets**
- 0 oversold orders
- 100% of orders get exactly one confirmation email to the customer and one alert to the admin
- Core Web Vitals "good" on mobile: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1
- 0 developer requests for day-to-day content changes

## Assumptions
- The client is a UAE-registered business with its own UAE Stripe account (Q15).
- About 20 products at launch (the client's sheet has 21 styles and 42 SKUs); the store must still work well with a few hundred.
- Today every product is one colour in 2 sizes (M and XL). The model allows up to about 4 colours and 6 sizes per colour, so up to about 24 SKUs per product.
- The client's stock sheet is the master list of SKUs and style codes. New products come with the client's codes.
- Under about 100 orders a day at launch.
- The client provides product photos per colour (portrait 4:5, same framing for every colour), product copy, size charts and policy texts.

## Open Questions
Each question has a default. If there's no answer, build the default and record it in `DECISIONS.md`.

| ID | Question | Default |
|---|---|---|
| Q1 | Guest checkout, or sign-in required? | Allow guest checkout (ADR-020) |
| Q2 | How long is the return window? | 14 days from Delivered, editable in settings |
| Q3 | What counts as final sale? | A per-product flag set by the admin |
| Q4 | How do returns physically come back (drop-off, courier pickup, customer ships), and who pays? | Admin sends instructions with each approval |
| Q5 | Exchanges, or refunds only? | Refunds only |
| Q6 | Delivery fee: flat, free over a threshold, or always free? | Flat fee + optional free-delivery threshold, editable |
| Q7 | Is the delivery fee refunded on returns? | Only for Damaged or Wrong item |
| Q8 | Discount codes in v1? | No |
| Q9 | Is the same stock sold anywhere else (shop, Instagram, WhatsApp)? | The website is the source of truth; the admin logs offline sales as stock changes |
| Q10 | Can the price differ by colour or size? (Photos per colour is decided: ADR-024) | Answered by the sheet (7 Oct 2026): price per SKU, as in the sheet. Today each style has one price for all its sizes |
| Q11 | Which categories? One per product? Subcategories? | Admin-managed flat list, one category per product, named by the client in the Category column (Q41). Package Contains stays a detail |
| Q12 | How many admins? Any limited roles? | One admin role for all staff |
| Q13 | Banner and blog details (slider, mobile images, authors)? | Hero slider and one promo banner, each with desktop and mobile images; simple posts |
| Q14 | Email customers when an order is Packed or Delivered? | Delivered email with the return-by date, after launch |
| Q15 | Is the business UAE-registered and VAT-registered (TRN)? | VAT off until confirmed |
| Q16 | Domain name and sender email address? | Needed before launch |
| Q17 | Design: the client's reference is in `DESIGN.md`. Does the client approve it, and when do we get the AR logo? Designs for other pages? | Needed now: logo (SVG). Other pages follow `DESIGN.md` |
| Q18 | Launch date? | TBD |
| Q19 | What replaces Cloudinary, and when? | Answered (10 Oct 2026): Cloudinary Free (ADR-038). |
| Q20 | What's in the cropped top of the proposal? | Need the full proposal |
| Q21 | Size guide content? | Size chart per category, after launch |
| Q22 | Is site search needed? | No: category, size and colour filters cover 20 products (the reference's search icon is left out) |
| Q23 | Does the client already have SKU numbers (supplier, shop till or spreadsheet)? | Answered (7 Oct 2026): yes, SKU and style codes in their stock sheet. Used exactly as written; the store never generates them |
| Q24 | Which sizes and colours? Letter sizes (XS to XXL), numbers (UK 6 to 18), abaya lengths (52 to 60), One Size or Free Size? | Partly answered by the sheet: sizes M and XL; colours as named in the sheet. New sizes and colours are added as the client writes them |
| Q25 | The reference also shows a Sale link, wishlist hearts, a search icon, a newsletter box and an Instagram gallery. Which are in v1? | Sale link yes (it uses the compare-at price, no new data). The rest stay out of v1 and are left off the page |
| Q26 | Fill the Stock column for each SKU | Answered: initialized with 5 units opening stock per SKU (210 total) for testing; actual inventory will update via admin/upload before launch |
| Q27 | Fill the Product Name column, one name per style | Generated formatted category + style names for initial release; can be updated anytime in admin |
| Q28 | Fix rows 38 to 43 of the sheet (J0395, JNE4124, J0478): SKU and Style look swapped and some values sit in the wrong columns. What's in the J0478 set? | Resolved: Swapped SKU and Style normalized on import (base code to Style, size-specific suffix to SKU) |
| Q29 | Are the Selling Prices in AED and including VAT? Original prices for items on sale (Compare-at Price)? | AED, VAT included if registered; no sale prices |
| Q30 | Fill the Size column. Which other sizes? A size chart per type? | Sizes as the client writes them; size charts after launch |
| Q31 | Descriptions show as written. Three mention Janasya: keep that? Who writes descriptions for the other 18 styles? | Shown as written; styles without one show their details only |
| Q32 | Should any spellings match ("Sage" and "Sage Green", "Kurta" and "KURTA", "Regualr", "Above Knee" under Top Category)? Are Off White, White and Cream different colours? | Shown as written until the client changes them |
| Q33 | Same design in several colours: one product with a colour picker? | Yes, through the Product Group column |
| Q34 | A regular stock sheet, or stock edits in the admin? | Both supported |
| Q35 | Which courier? Does it collect cash or card at the door? How often does it pay out, and what does it charge? | Courier and tracking number typed in by hand |
| Q36 | COD fee? Maximum order value for COD? | No fee; AED 1,000 |
| Q37 | COD for guests too? | Signed-in customers only |
| Q38 | Who confirms COD orders, and how fast? | The admin, within 24 hours |
| Q39 | COD refunds by bank transfer? Is the COD fee refunded on returns? | Bank transfer; fee not refunded |
| Q40 | Accountant: is the COD invoice issued when the cash is collected? | Yes |
| Q41 | Fill the Category column with the website menu name for each style | The admin picks one if it's empty |
