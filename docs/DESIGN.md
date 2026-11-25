# Design System

> DESIGN = how it should look and feel.
> **Source:** the client's reference mockup (shared 6 Oct 2026). We copy its look, not its brand: the logo, name, copy and photos are AR Boutique's own.
> **The theme lives in tokens.** Colours, radius and fonts are CSS variables set by a shadcn preset. Components use the semantic tokens below and never hard-code a colour or a font, so the look can change later without touching components (ADR-028).

## How Theming Works
| Layer | Lives in | Changed by |
|---|---|---|
| Theme tokens (colours, radius) | `src/app/globals.css` (`:root`) | A shadcn preset, or a hand edit |
| Fonts | `src/lib/fonts.ts` (`next/font`), setting `--font-sans` and `--font-heading` | A shadcn preset, or one import |
| Our extra tokens (`success`, `warning`) and the admin heading font | `src/styles/brand.css`, imported at the top of `globals.css` | Hand edit; presets never touch it |
| Primitives (Button, Input, Sheet and so on) | `src/components/ui/` | `shadcn add` or `shadcn apply` only. Never hand-edit |
| Layouts (hero, category circles, product card, pickers) | `src/components/store/`, `src/features/*/components/` | Code. A preset never changes layout |

**Changing the look later**
1. Build a preset on ui.shadcn.com/create and copy its code.
2. `npx shadcn@latest apply --preset <code> --only theme,font` swaps colours, radius and fonts and keeps our components.
3. A full `npx shadcn@latest apply --preset <code>` also reinstalls everything in `src/components/ui/`. That's why those files are never hand-edited.
4. Re-check contrast (WCAG AA), update the tables below and record the new preset code.

**Current preset:** `buFywKm`, applied 6 Oct 2026. It sets the **Lyra** style (boxy, square corners), Lucide icons, Inter and neutral colours. We then replaced the `:root` colours with the palette below and Inter with the fonts in Typography.
- The style (Lyra) lives in the component code in `src/components/ui/`, so it only changes with a full `apply`.
- A full `apply`, even of `buFywKm` again, resets the colours to neutral and the font to Inter. Put the colours and fonts from this file back afterwards, and check that `globals.css` still imports `brand.css`.

## Style
- **Storefront:** warm, minimal, editorial. Ivory page, sand-toned panels, black buttons (like the logo), square corners (Lyra), serif headings in Title Case at regular weight, a clean neutral sans for everything else. Only small eyebrows and the announcement bar are uppercase. Photography does the talking.
- **Admin:** the same tokens with the sans font only, titles included (see Typography). shadcn/ui components, dense and practical.
- **Icons:** Lucide (`lucide-react`), from the preset. Use `strokeWidth={1.5}` on the storefront to match the reference's thin line icons.

## Typography
| Role | Font | Token | Weights |
|---|---|---|---|
| Headings, section titles | Newsreader | `--font-heading` (`font-heading`) | 400 (500 for Lyra component titles) |
| Body, UI, navigation, buttons, prices | Inter | `--font-sans` (`font-sans`) | 400, 500, 600 |

Typography follows the SYLVIE mockup (shared 6 Oct 2026); colours, corners and layout still follow the first reference. Newsreader and Inter are the closest free Google Fonts to it: a narrow editorial serif with a tall x-height (loaded with its optical-size axis, so big headings get the display cut automatically), and a neutral sans that also suits the dense admin. Both load through `next/font` in `src/lib/fonts.ts`, so swapping one is a one-line change (or `--only font` with a preset). The preset ships Inter, which we keep as the sans; `src/lib/fonts.ts` adds Newsreader for headings, and `globals.css` maps `--font-heading` to `var(--font-heading)` (the preset maps it to the body font).

Lyra puts `font-heading` on component titles (Card, Dialog, Sheet and similar), so they follow `--font-heading`:
- **Storefront:** those titles use Newsreader at Lyra's 14px. Size them up with `className` where they show (for example `text-xl` on the cart drawer title).
- **Admin:** stays sans. The outermost element in `src/app/admin/layout.tsx` carries `data-surface="admin"`, and `brand.css` then points `--font-heading` at the sans for the whole page (`html:has([data-surface="admin"])`). Doing it on `<html>` also covers dialogs and sheets, which render outside the admin layout. This needs the `next/font` variables on `<html>` in the root layout.

| Style | Desktop | Mobile | Font | Details |
|---|---|---|---|---|
| Hero title | 60px, line height 1.05 | 40px, 1.1 | Heading 400 | Title Case, two short lines, letter spacing -0.01em |
| Promo title | 36px, 1.15 | 28px, 1.2 | Heading 400 | Title Case |
| Page title (h1) | 40px, 1.15 | 32px, 1.2 | Heading 400 | Product name uses 32px / 28px |
| Section title | 32px, 1.2 | 24px, 1.2 | Heading 400 | Title Case, centred ("Shop by Category"). A small "View All" link with an arrow can sit on the right |
| Body | 16px, 1.6 | 15px, 1.6 | Sans 400 | Hero and promo text lines use 18px / 16px |
| Small | 13px, 1.5 | 13px | Sans 400 | Footer links, helper text, category item counts in `muted-foreground` |
| Product name and price | 15px | 14px | Sans 500 (price 600) | |
| Navigation | 15px | 16px (menu sheet) | Sans 400 | Title Case; the current page is underlined |
| Button | 15px | 15px | Sans 500 | Title Case ("Shop New Arrivals"), no uppercase or letter spacing; optional arrow icon after the label |
| Eyebrow, announcement bar | 12px | 12px | Sans 500 | Uppercase, letter spacing 0.12em ("LIFESTYLE") |
| Badge | 12px | 12px | Sans 500 | Sentence case ("New", "Sold out") |

Sizes were measured on the reference and scaled to a 1440px-wide layout. Adjust during the build if something looks off.

## Colours
Monochrome, like the final logo (pure black on white, received 7 Oct 2026): one near-black for text and buttons, with the soft ivory and sand neutrals of the first reference. Checked against WCAG AA. Paired tokens (`card-foreground`, `secondary-foreground`, `accent-foreground` and so on) use `foreground`.

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| `background` | #FCFBF9 | oklch(0.988 0.003 84.6) | Page (ivory) |
| `foreground` | #111111 | oklch(0.178 0 0) | Text: the logo's black, a touch softer for screens (18.3:1 on the page) |
| `card`, `popover` | #FFFFFF | oklch(1 0 0) | Cards, inputs, drawers, menus |
| `primary` | #111111 | oklch(0.178 0 0) | Solid buttons, announcement bar, cart count, active navigation underline |
| `primary-foreground` | #FFFFFF | oklch(1 0 0) | Text on `primary` (18.9:1) |
| `secondary`, `muted` | #F5F1ED | oklch(0.960 0.007 67.7) | Trust strip, footer, soft panels, image placeholders, skeletons |
| `muted-foreground` | #6B645E | oklch(0.508 0.013 63.2) | Secondary text: 5.6:1 on the page, 4.6:1 on sand |
| `accent` | #EBE2DB | oklch(0.918 0.014 60.6) | Sand: hero and promo text panels, hover fills |
| `border` | #E3DCD5 | oklch(0.898 0.012 67.7) | Decorative dividers |
| `input` | #8C847D | oklch(0.618 0.014 63.8) | Input, size chip and outline button borders (3.7:1 on white) |
| `ring` | #111111 | oklch(0.178 0 0) | Focus ring |
| `destructive` | #B42318 | oklch(0.500 0.182 29.5) | Errors, reject |
| `success` (brand.css) | #1F7A4D | oklch(0.515 0.110 156.8) | Paid, delivered, refunded |
| `warning` (brand.css) | #8F5B0A | oklch(0.517 0.108 69.9) | Pending, needs attention |
| Charts | Warm greys, light to dark | `chart-1` to `chart-5` | Admin charts |

- **Links** are the same black as the text, so links inside text are always underlined.

- **Corners:** square everywhere, like the reference. They come from the Lyra style: its components use `rounded-none`, so `--radius` (left at the preset default, `0.625rem`) doesn't affect them. Our own components never add rounding either: no `rounded-sm` to `rounded-4xl`. Only colour swatches, category photos and avatars use `rounded-full`.
- Status colours sit on `background` or `card` only (they drop below 4.5:1 on sand).
- No dark mode in v1. The `.dark` block the preset left in `globals.css` is unused; never add the `dark` class.

## Layout
- Mobile first. Tailwind breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280. Test at 375px, 768px and 1440px.
- Container: max width 1280px; side padding 16px on mobile, 24px on tablet, 32px on desktop. The hero runs full width.
- Sections: 48px apart on mobile, 80px on desktop.
- Product grid: 2 columns on mobile, 3 on tablet, 4 on desktop; gap 12px on mobile, 32px on desktop.

## Home Page (from the reference)
| # | Block | What we build |
|---|---|---|
| 1 | Announcement bar | `primary` strip, white uppercase 12px text, centred. Text comes from settings and must match the real policy (e.g. "FREE DELIVERY OVER AED 300 / EASY RETURNS WITHIN 14 DAYS"; Q2, Q6) |
| 2 | Header | Logo left; menu in the centre (Home, Collections, Journal, About, Contact Us); account and cart with a count on the right. Mobile: menu button, centred logo, cart. No search or wishlist icons in v1 (Q22, Q25) |
| 3 | Hero banner | Full-width photo with the text on its plain side: eyebrow, two-line title, one line of text, primary button. Mobile: photo first, text below. From `banners` (placement hero) |
| 4 | Shop by category | Section title, round category photos (160px on desktop, 96px on mobile) with the category names as labels (Sans 500, never uppercase); up to 6 in a row, swipe on mobile. A Sale circle can link to `/shop?sale=1` (Q25) |
| 5 | New arrivals | The 8 newest products in the product grid, then an outline "View all" button |
| 6 | Trust strip | `secondary` band with 4 line icons: free delivery and easy returns (both from settings), secure payment, and one more line from the client |
| 7 | Promo banner | Photo with the text on an `accent` panel: eyebrow, title, text, button. From `banners` (placement promo) |
| 8 | From the journal | The 3 latest blog posts, in place of the reference's Instagram gallery (Q25) |
| 9 | Footer | `secondary` background: logo, a short brand line, social icons; columns Shop (categories), Customer care (Shipping & delivery, Returns, Contact), About (About, Blog), Legal (Terms, Privacy, Returns & refunds); payment icons for Visa, Mastercard, Apple Pay and Google Pay only (no PayPal: we take Stripe only) |

Left out from the reference: wishlist hearts, the search icon, the newsletter box and the Instagram gallery (out of scope, Q25). Prices are always AED.

## Components
### Homepage lifestyle and story additions (TASK-131, approved 20 Nov 2026)
- After categories, "Style for Every Moment" pairs two model-led photographs with Everyday Elegance and Dressed for Celebration captions. The panels are staggered on desktop and stacked on mobile; text sits outside the images and each panel links to `/collections`.
- After New Arrivals, "Your Style, Your Story." pairs the original teal paisley portrait with a short brand introduction and an "Our Commitment" section. The portrait is slightly inset within its desktop column and remains full width on mobile. Commitment points are content-driven and sit side by side on wide screens, then stack on smaller screens. A semantic About link opens `/about`.
- Use the local campaign imagery in `public/images/`, `next/image` with reserved aspect ratios, lazy loading and `unoptimized`. These are editorial visuals, not product purchase links or evidence of in-house manufacturing. Keep the existing tokens, square corners and fonts; hover motion respects reduced-motion preferences.

### WhatsApp concierge shortcut (TASK-136, 24 Nov 2026)
- Show a fixed, round WhatsApp icon on storefront pages. Use the configured WhatsApp number or store phone for the `wa.me` link; if neither is configured, link to Contact. Place it above mobile sticky checkout controls and the cookie banner when they overlap, use the success colour tokens, and open the configured chat in a new tab.

Lyra components are compact: a default Button is 32px tall and `lg` is 36px. The storefront gets its larger sizes through `className` or small wrappers in `src/components/store/` (for example `StoreButton`), never by editing `src/components/ui/`. The admin uses the shadcn sizes as they are.

### Buttons
| Variant | Look | Use |
|---|---|---|
| Primary | Solid `primary`, white 15px Title Case label (Sans 500), optional arrow icon after it | Add to Cart, Checkout, Shop Now |
| Outline | Lyra outline variant; the storefront adds a `border-input` edge so it stays visible | View all, secondary actions |
| Ghost / Link | Text only, underline on hover | Tertiary actions |
| Destructive | shadcn destructive variant: red text on a light red fill in Lyra (admin only) | Reject, archive, confirm refund |

Storefront buttons are 48px tall through `StoreButton` (touch targets never below 44px). While submitting, show a spinner and disable the button.

### Product card
Photo (4:5, `muted` placeholder while it loads), then name, then price (compare-at price struck through in `muted-foreground`; "From AED 90" when the product's SKUs have different prices), then colour swatches (only when the product has more than one visible colour) and badges. The photo is the default colour's main photo; on desktop, hovering shows that colour's second photo. Swatches show which colours exist (up to 4, then "+2"); they aren't separate links, so the whole card stays one link. No wishlist heart in v1.

### Colour picker
Shown only when the product has more than one visible colourway; with one, the colour shows in Details instead. Round swatches filled with the colour's `swatch_hex`: 14px on cards, 32px on the product page, with a 1px `border` ring so white and ivory stay visible. A colour without a `swatch_hex` shows as a square chip with its name (like the size chips) on the product page, and isn't drawn on cards. Selected: a 2px `foreground` ring with a 2px gap. The colour name always shows next to the picker exactly as stored ("Colour: Sea green"). A colour with every size sold out stays visible with a diagonal line through it.

### Size picker
Shown only when the selected colourway has more than one active SKU. With one SKU it's selected automatically, and its size (if it has one) shows as text ("Size: Free Size"). Square chips, at least 48 x 48, with a 1px `input` border; selected is solid `primary`. Only the sizes the selected colour comes in, in size order, labelled exactly as stored. Sold-out sizes stay visible, greyed and struck through, and can't be selected. "Only N left" shows under the picker when the selected SKU has 3 or fewer. The selected state never relies on colour alone.

### Product page
Not in the reference; it follows the same style.
- **Desktop:** gallery on the left (4:5 main photo and thumbnails), details on the right: name, price, colour picker and size picker (each only when there's a choice), Add to cart (full width), delivery and returns summary, then an accordion with Description, Details (open by default) and Care.
- **Mobile:** swipeable gallery with dots, details below, sticky Add to cart bar.
- Changing colour swaps the gallery, the size list and the Details. Changing size never changes the photos. If the new colour doesn't come in the chosen size, clear the size and say so.
- **Description:** the client's text exactly as written, in paragraphs. A product without one shows Details only.
- **Details:** the colourway's details exactly as the client wrote them, as label and value rows: "Package contains" first, then groups Top (Fabric, Colour, Pattern, Neck, Sleeve, Type), Bottom (Style, Fabric, Colour) and Dupatta (Fabric, Colour, Pattern). The labels are ours (`features/catalog/details.ts`); the values are never changed in case or spelling. Empty and `-` values are skipped, and a group with nothing left is skipped.

### Badges
New, Sale, Sold out, Final sale: 12px Sans 500 in sentence case on `background` with a 1px `border`, top left of the photo. Order and return statuses use `success`, `warning`, `destructive` and `muted`.

### Forms
Inputs are 48px tall on the storefront and 40px in the admin (set with `className`; Lyra's default is smaller), with a white `card` background, a 1px `input` border and square corners. Label above the field, helper text below, error text in `destructive` under the field. Mark optional fields, not required ones. Validate on blur and on submit.

### Feedback
- Toasts for admin saves.
- A confirm dialog before destructive admin actions: refund, reject, archive, deactivate staff, cancel an order, returned to sender, and applying a stock sheet (with its counts).
- Skeletons while lists and product grids load.

### Admin tables
shadcn data table: sticky header, search, filters, pagination (25 rows), status badges, and clicking a row opens the detail page. SKUs and style codes show exactly as stored in `font-mono`, never forced to capitals. Orders show a "Cash on delivery" or "Card" badge.

### Admin stock grid
Colours down, sizes across (a colourway without sizes has one "No size" column). Each cell shows the SKU, on hand, held and available; low stock in `warning`, zero in `destructive`. Editing a number asks for a reason. On mobile it becomes a list grouped by colour.

### Admin product form
- **Details card:** name, category, description, final sale, SEO, status.
- **Colourway card:** colour (pick from the list or type a new one, saved as typed), style code (required, no placeholder), photos, then the details fields in the sheet's order, each a combobox of values already used that also takes new text. A sizes-only product shows one colourway card; "Add another colour" turns it into tabs, one per colour.
- **SKUs table** per colourway: SKU (required, empty until the admin types the client's SKU; never prefilled), Size (or No size), Price, Compare-at price, Active, Stock. A "Same price for all sizes" field above it fills every row's price. Locked SKUs (already sold) show a lock icon and a tooltip.

### Stock sheet upload (admin)
- `/admin/products/upload`: a drop zone (".xlsx or .csv, up to 5 MB"), a link to download the current catalogue in the same format, and the upload history below (who, when, file, counts, status).
- **Preview:** summary counts at the top (products, colourways, SKUs to create; values to change; unchanged), then tabs: Changes (old and new value per field), Errors, Warnings, Not used (columns the store ignores).
- Errors and warnings are tables with Row, Column, Value (exactly as in the file, with a space at the start or end marked) and the reason in plain words ("SKU J0395 is on rows 38 and 39. Each SKU can only be used once").
- **Apply** is a primary button, off while there are errors, with a confirm dialog showing the counts. After applying, a toast and a link to the new Draft products.

### Checkout page
Not in the reference; it follows the same style.
- **Desktop:** two columns. Left: Delivery details (full name, UAE mobile with +971, emirate select, area, street and building, flat or villa, landmark optional), then Payment. Right: order summary (lines with photo, colour and size, subtotal, delivery, COD fee when chosen, VAT note, total), sticky.
- **Mobile:** a collapsible order summary at the top showing the total, then the form.
- **Payment:** two radio cards, "Card or Apple Pay" and "Cash on delivery" (helper text: "Pay in cash when your order arrives. We'll call or WhatsApp you to confirm."). When COD isn't available, its card is disabled with the reason underneath ("Sign in to pay with cash on delivery", "Cash on delivery is available for orders up to AED 1,000").
- **Button:** "Continue to Payment" for card (goes to Stripe), "Place Order" for COD.

### COD order received page
Heading "Order Received", the order number, "We'll call or WhatsApp you on +971 50 123 4567 within 24 hours to confirm your order.", the amount to pay on delivery in large type, the order summary, and buttons to My orders and Continue shopping. No invoice until the cash is collected.

## Imagery
- **Product photos:** portrait 4:5, at least 1600 x 2000, plain light backdrop, the same framing for every colour. At least 1 photo per colour, ideally 4 to 6 (front, back, side, detail). Uploaded once per colour; every size of that colour uses them.
- **Category photos:** square 1:1, at least 600 x 600, subject centred (shown as circles).
- **Hero banner:** desktop 8:3 (at least 2400 x 900) with a plain side for the text; mobile 4:5 (at least 1080 x 1350).
- **Promo banner:** desktop 4:1 (at least 2400 x 600) with a plain side for the text; mobile 4:5.
- Uploaded photos are served from R2 as WebP copies at fixed widths (products and blog 400 to 1600, categories 200 to 600, banners 800 to 2400) through our media loader. Files in `public/` (logo, icons) use `unoptimized`. The hero image loads with priority; everything else lazy-loads.
- Alt text is required for every image (e.g. "Satin slip dress in black, front").
- Never reuse the reference's photos; they aren't ours.
- **Logo:** the final logo (7 Oct 2026): the AR monogram above THE AR BOUTIQUE, black only. Vector in `public/the-ar-boutique-logo.svg` with a PNG beside it. Full size in the footer and emails. It's nearly square, so in the header the words get too small to read: use the horizontal version there once it exists (Q17), and until then the stacked logo at its largest size that fits. Never recolour, stretch or crop it. Black on light backgrounds only; on `primary` or dark photos use the white version (Q17).

## UX Requirements
- Mobile responsive everywhere, storefront and admin.
- Loading states: skeletons for content and spinners on buttons. Never a blank screen.
- Empty states: empty cart, no orders, no returns, no products in a category, no products for the chosen filters, empty admin lists. Short copy plus one action.
- Error states: inline field errors, friendly page errors with a retry, custom 404 and 500 pages.
- Accessible forms: labels, `aria-describedby` for errors, keyboard friendly, visible focus.
- Product page on mobile: sticky Add to cart bar.
- Delivery fee and returns information visible before checkout.
- Never lose the cart on an error.
- Show "Only N left" when a SKU has 3 or fewer in stock. Never show exact stock above that.
- Keep the chosen colour in the URL (`?colour=`) so links and the back button work.

## Content and Formatting
- Prices: `AED 1,250`, with 2 decimals only when needed (`AED 249.50`). Always use `formatAED()`.
- Dates: `5 Oct 2026`. Times: `4:30 PM`, shown in UAE time (Asia/Dubai).
- Phone numbers: `+971 50 123 4567`.
- Order numbers `AR-10001`; return numbers `RET-1001`; SKUs and style codes exactly as the client writes them (`JAA25DR01112-M`, `JNE4207-TP-M`).
- The client's values (colour names, details, descriptions) show exactly as stored. Never change their case with CSS (`uppercase`, `capitalize`) or in code.
- Prices from several SKUs: "From AED 90".
- Line items read "Satin Slip Dress, Black / M".
- Tone: warm, short and confident. No jargon.

## Emails
Simple branded layout: logo, `background` colour, `foreground` text, one black `primary` button, an order summary table where each line shows the colour's photo, the colour, the size and the SKU, and a footer with contact and policy links. COD emails show the amount to pay on delivery in place of a paid total. Mobile friendly, 600px max width. Email clients can't read CSS variables or load our fonts reliably, so use the hex values above, Georgia for headings and Arial for body text.

## Still Needed From the Client (Q17)
- Logo: final version received 7 Oct 2026 (black on a white PNG). Still needed: a transparent SVG, a horizontal version for the header, a white version for dark backgrounds, and a favicon
- The client's OK on this look (black and ivory, matching the logo)
- Product, category and banner photos in the sizes above
- Designs for other pages are optional; until they arrive, those pages follow this file
