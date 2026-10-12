# Project Memory

> The project's current state. Update it after every task. Permanent decisions go in `DECISIONS.md`.

## Current Status
Phase 1 Setup and parts of Phase 11 (Home Page) are underway. Next.js scaffolded, folder structure created, and shadcn/ui installed. Design tokens, icons (Lucide), and fonts configured to match the new Sylvie mockup (Newsreader, Inter, Plum/Cream theme). The storefront layout and home page components have been built and styled. On 9 Oct 2026 the docs were updated for the client's stock sheet (their SKUs and style codes used exactly as written), the stock sheet upload and cash on delivery.

## Completed
- Research: stack, payments, auth, media, UAE compliance
- Requirements interview with the tech lead
- Project docs: PRD, ARCHITECTURE, DESIGN, RULES, TASKS, DECISIONS, TEST_PLAN, SECURITY, README, `.env.example`, Cursor rules
- Docs update: colours -> sizes -> SKU model, photos per colour, private stock counts, Sentry instead of Better Stack, design tokens and fonts from the client's reference (ADR-023 to ADR-028)
- Scaffold Next.js project (TASK-001)
- Strict TypeScript, Prettier, path alias (TASK-002)
- Folder structure setup (TASK-003)
- shadcn/ui init with Lyra style and design tokens (TASK-004)
- Home page components and layout according to the new Sylvie design system (TASK-091)
- Storefront layout including header, footer, 404 page, metadata, and placeholder pages (TASK-039)
- Editorial About page (`/about`), Journal stories & article routes (`/journal`, `/journal/[slug]`), and Contact page (`/contact`) with shadcn/ui Field + React Hook Form validation
- Docs update (9 Oct 2026): the client's stock sheet is the source (ADR-029), style code and details per colourway, price per SKU, four product shapes, stock sheet upload and export, cash on delivery, own checkout page, new order statuses (ADR-023 and ADR-025 amended, ADR-029 to ADR-036); tasks TASK-113 to TASK-125 added; `AGENTS.md` split into `.agents/rules/`
- Validated environment variables with Zod schemas for client and server (TASK-005)
- Cart store (Zustand + localStorage) with mini-cart drawer and PDP Add to Cart integration (TASK-048)
- Shopping bag page (`/cart`) with line items, free shipping threshold, and fils arithmetic (TASK-049)

## Current Task
TASK-116 Checkout page `/checkout` delivery form & payment method selection (or TASK-050 Delivery fee settings)

## Waiting On
- Client answers to Q1 to Q41 in `PRD.md`. Most urgent: Q1 guest checkout, Q2 return window, Q6 delivery fee, Q15 VAT, Q26 to Q28 (stock, product names, rows 38 to 43), Q35 to Q38 (courier and COD), Q41 categories
- The completed stock sheet back from the client (Size, Product Name, Stock and Category filled; rows 38 to 43 fixed)
- Product photos per colour (4:5 portrait)
- The client's Cloudflare account, and their domain on Cloudflare DNS before launch (for `media.<client-domain>`, ADR-037)
- Commercial sign-off for customer accounts, returns, bilingual invoices, the stock sheet upload and cash on delivery (beyond the original proposal)

## Known Issues
- Next.js: another critical security fix is pending upstream. Upgrade as soon as it ships.
- Arabic PDF engine not chosen yet (TASK-062, ADR-022).
- ExcelJS for the stock sheet is proposed (ADR-036): confirm before TASK-113.
- Rows 38 to 43 of the client's sheet (J0395, JNE4124, J0478) have SKU and Style swapped and values in the wrong columns. The upload rejects them until the client fixes their sheet; we never fix it for them.
- Resend Free caps at 100 emails a day. Switch to Pro before any promotion.
- Sentry free plan: one user, email alerts only, one cron monitor and one uptime monitor, 5,000 errors a month. Upgrade to Team when a second person needs access or a limit is hit.

## Next Step
Build dedicated `/cart` page with server re-validation (TASK-049) or setup checkout delivery form (TASK-116).

## Log
- 5 Oct 2026: project docs created
- 6 Oct 2026: colour and size variants with unique SKUs, photos per colour, Sentry monitoring, design system from the client's reference; tasks renumbered (112)
- 6 Oct 2026: project scaffolded (Next.js, TS, Tailwind v4, shadcn/ui Lyra preset) and design tokens applied
- 6 Oct 2026: Implemented the storefront home page and updated global typography and theme to match the new Sylvie mockup and plum/gold logo.
- 6 Oct 2026: Refined the storefront layout: fixed card padding, increased logo prominence, and established the main navigation (Home, Collections, Journal, About, Contact Us).
- 6 Oct 2026: Created custom 404 page, added SVG favicon, set site metadata, and built 'Coming Soon' placeholder pages for unimplemented nav links (TASK-039 completed).
- 6 Oct 2026: Executed a series of visual polish tasks: merged Trust Strip and Promo Banner into a unified module, adjusted section padding to tighten layout flow, resolved image cropping in Journal cards, updated Hero Banner to scale proportionally with a baked-in text image, and enhanced footer typography.
- 7 Oct 2026: Overhauled design system to match the new client-provided monochrome logo (Black and Ivory theme, gold removed). Replaced static HeroBanner with an auto-playing Embla Carousel slider featuring three custom slides with dedicated desktop and mobile images.
- 7 Oct 2026: Converted New Arrivals section into an interactive carousel, polished ProductCard typography (added font-heading, borders, price hierarchy), and rebuilt TrustStrip globally into StoreFooter with dark styling.
- 7 Oct 2026: Regenerated mobile hero banners to strict 9:16 aspect ratio (937x1679), cleaned up unused images from public directory, and fixed Embla Carousel autoplay pausing on mobile touch interactions.
- 9 Oct 2026: Refined mobile layout based on client feedback: regenerated all three mobile hero banners at a 3:4 aspect ratio with embedded text, updated HeroSlider to use Next.js Image `fill` with strict CSS aspect ratio constraints to perfectly frame the banners without cropping; fixed New Arrivals mobile layout to properly display two cards (`basis-[45%]`).
- 9 Oct 2026: Implemented transparent scrolling header overlaying the hero section. Updated desktop hero banners to a wider 16:9 format, increased HeroSlider desktop aspect ratio to `2.13/1`. Integrated specific local client images for the top 3 slides on both desktop and mobile, and swapped the order of slides 1 and 3. Increased mobile hero banner height to `aspect-[2/3]`. Added dynamic mobile aspect ratio fallback for slides missing mobile images.
- 9 Oct 2026: docs updated for the client's stock sheet (their SKUs, style codes and values used exactly as written, never generated), price per SKU, details per colourway, stock sheet upload and export, cash on delivery (ADR-006 replaced by ADR-033), own checkout page, `paid` renamed `confirmed`; TASK-113 to TASK-125 added; `AGENTS.md` split into `.agents/rules/`
- 10 Oct 2026: media moved from Cloudflare R2 with sharp resizing at upload (ADR-037 replaces ADR-010 and ADR-011; PRD Q19 answered); ARCHITECTURE, SECURITY, DESIGN, RULES, agent rules, TASKS (029, 075, 090, 109) and TEST_PLAN updated
- 10 Oct 2026: Polished Collections UI: removed Radix dependencies after confirming Shadcn Base UI (base-lyra) setup, added Lenis smooth scrolling globally with customized wheelMultiplier, and fixed native scroll trapping in the sticky filter sidebar.
- 10 Oct 2026: Fixed Shadcn UI `Select` component presentation bugs: fixed `defaultValue` mapping to display string, adjusted `SelectContent` layout logic (`alignItemWithTrigger={false}`) to drop completely below the trigger. Fixed mobile `Sheet` padding inside Collections page so the filters have horizontal breathing room and don't overlap the close button.
- 10 Oct 2026: Polished mobile header layout (`StoreHeader.tsx`): added a slide-out mobile navigation `Sheet` attached to the hamburger menu icon, centered the logo on mobile screens by adjusting flex containers, and moved the mobile search icon next to the hamburger menu.
- 10 Oct 2026: Implemented Product Detail Page UI (`app/collections/[slug]/page.tsx`): Built responsive sticky-scroll layout where the main product image stays pinned while details scroll. Componentized UI into `ProductGallery`, `ProductInfo`, `ProductAccordions`, and `ProductTrustStrip`. Added mobile-specific horizontal swipeable thumbnail gallery, and a responsive "You May Also Like" section (5 products on desktop, 4 on mobile).

- 11 Oct 2026: Media moved from R2 + sharp to Cloudinary (ADR-038), because R2 needs a payment method.
- 11 Oct 2026: Connected new Supabase project (xoqdwqkftmlffiugxuzy) and Cloudinary MCP. Created public.banners table with RLS and admin access.
- 11 Oct 2026: Imported client's stock sheet (21 styles, 42 SKUs) with opening stock (5 units per SKU, 210 total), 5 categories, and 17 colours as written. Swapped SKU/Style anomaly in rows 38-43 resolved.
- 11 Oct 2026: Uploaded all 150 client product images to Cloudinary (ar-dev/products/{productId}/{productColourId}/) and indexed them into public.product_images with sort order and dimensions, passing private.guard_image_key() trigger.
- 12 Oct 2026: Built zero-egress database pagination and facet filtering RPC `get_catalog_products` on Supabase; integrated `nuqs` for smooth URL search param sync across SortSelect and SidebarFilters (Category, Size, Price Range, Fabric, Pattern); moved `/collections` to route group `(list)` to isolate loading state from `[slug]`; structured Product Detail specs into authentic client stock sheet groups (Package, Top, Bottom, Dupatta) in `ProductAccordions.tsx`; updated Home Page categories to live Cloudinary imagery.
- 12 Oct 2026: Implemented editorial About Page (`app/about/page.tsx`) detailing atelier heritage, craftsmanship pillars, and founder's note.
- 12 Oct 2026: Implemented Journal index and dynamic article detail pages (`app/journal/page.tsx`, `app/journal/[slug]/page.tsx`, `features/blog/`) with category filtering and editorial typography.
- 12 Oct 2026: Implemented Contact Page (`app/contact/page.tsx`) with WhatsApp concierge (+971 50 xxx xxxx), email inquiries, atelier location details, and FAQ accordion.
- 12 Oct 2026: Built Contact Form (`features/contact/components/ContactForm.tsx`) using shadcn/ui Field primitives (`Field`, `FieldLabel`, `FieldError`, `FieldGroup`, `Input`, `Textarea`, `Select`) with `react-hook-form`, `@hookform/resolvers/zod`, and Zod validation, strictly adhering to shadcn's official React Hook Form documentation pattern.
- 12 Oct 2026: Implemented environment variable validation (`lib/env.ts`) using Zod schemas for client and server variables; verified against Cloudinary and Supabase configurations with strict client leak prevention (TASK-005).
- 12 Oct 2026: Built persistent Zustand cart store (`features/cart/store.ts`) with localStorage sync, 5 items per line cap, integer fils arithmetic (`lib/money.ts`), slide-out Cart Drawer (`features/cart/components/CartDrawer.tsx`), dynamic header badge count, and integrated Add to Cart with live size selection on Product Detail Pages (TASK-048).
- 12 Oct 2026: Created dedicated Shopping Bag page (`app/cart/page.tsx` & `features/cart/components/CartView.tsx`) with quantity steppers, item removal, free shipping progress indicator (AED 500 threshold), and order summary breakdown with 5% UAE VAT.
- 12 Oct 2026: Implemented Quick Add Modal dialog (`components/store/QuickAddModal.tsx`) using shadcn Dialog primitive on ProductCard (+) button with live variant size selection, quantity stepper, and direct bag integration.
- 12 Oct 2026: Configured website favicon, Apple touch icon, and app icons (`app/icon.png`, `public/favicon.png`, `app/layout.tsx`) using client's Elegant White AR Boutique logo.
- 12 Oct 2026: Linked Hero Slider slides and Hero Banner call-to-action buttons directly to `/collections` with accessible labels.
- 12 Oct 2026: Triggered CI/CD deployment pipeline check.
- 12 Oct 2026: Fixed production build typecheck by excluding volatile `.next/dev/types` from `tsconfig.json`. Added Coming Soon page for `/account` reusing `ComingSoon` component.
