# Project Memory

> The project's current state. Update it after every task. Permanent decisions go in `DECISIONS.md`.

## Current Status

11 Oct 2026 checkpoint: the next delivery priority is **Client Storefront Review**, targeted for Monday, 12 Oct, with the acceptance gates in `docs/STOREFRONT-MILESTONE.md` and the priority overlay in `TASKS.md`. The target date is not a verified delivery promise.

The storefront has home, collection and PDP visual scaffolding, but it is not connected to the live catalogue. The current PDP uses one `MOCK_PRODUCT` for every slug, and real variants, stock behavior, cart, checkout and admin screens remain unimplemented. About, Contact and Journal have Coming Soon pages; several other linked routes are absent. TASK-039 and TASK-091 are historical visual-work completion, not final client acceptance.

A separate approved database-foundation delivery created 14 tables with RLS, three applied migrations and an earlier receipt of 95 passing pgTAP assertions. Catalogue business tables are empty. Migrations, generated types and tests were delivered outside this repository and have not been integrated here; no app/browser/CI success is implied. The Supabase token hook exists as SQL but has not been enabled or verified in a real staff login flow.

Cloudinary is connected and product photographs are being uploaded into `ar-staging/source-images/<source folder>`. The Drive inventory contains 150 indexed images across 21 folders. Upload completion and final database mapping have not been signed off. Cloudinary folder location and public ID are separate; sampled uploads have bare public IDs that do not yet satisfy the database's final media-key contract. Do not move or rename media until a reconciled target preview is approved. Never edit the client's Drive.

Pranav reports the Vercel environment variables are configured and the test site redeployed. This was not independently verified through the Vercel connection, and environment variables alone do not wire the app to Supabase.

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
- Docs update (9 Oct 2026): the client's stock sheet is the source (ADR-029), style code and details per colourway, price per SKU, four product shapes, stock sheet upload and export, cash on delivery, own checkout page, new order statuses (ADR-023 and ADR-025 amended, ADR-029 to ADR-036); tasks TASK-113 to TASK-125 added; `AGENTS.md` split into `.agents/rules/`
- External database foundation (11 Oct 2026): 13 public tables and private app configuration, RLS, catalogue/stock/publish guards, three applied migrations and 95 passing rolled-back pgTAP assertions. Repository integration and CI remain open.
- Source image inventory and upload-planning workbook (11 Oct 2026): original filenames/links retained, provisional order and mapping flags recorded; not a completed image-quality audit or catalogue import.

## Current Task

TASK-005 environment validation: implementation applied to `doc/storefront-review-milestone` for the existing root-level `lib/` layout. Zod checks the six configured Supabase/Cloudinary variables; browser exports contain only the two public Supabase fields, server exports use `server-only`, and `next.config.ts` validates with the pure schema before startup/build. Errors name invalid variables without exposing their values. Current staging media root remains valid even when Next uses NODE_ENV=production.

Validation is restricted to currently implemented configuration. Future payment/auth/email integrations must add their required schemas before use; no missing future-service secrets block this milestone. Modern Supabase publishable keys are required; legacy anon JWTs are not accepted. Loopback HTTP is permitted only for development/test server validation.

Status: in progress, NOT verified complete. Dependency installation, package-lock regeneration and `npm run typecheck`, `npm run lint`, `npm run test:env`, `npm run build` must run in the development environment. The preparation sandbox has no npm or internet access. Focused tests are authored, not reported passing. Full TASK-007 test setup and browser boundary verification remain open. The ten-file patch was committed to the roadmap branch by explicit approval; no merge, deployment, remote environment change, database write or media change is included.

## Waiting On
- Client answers to Q1 to Q41 in `PRD.md`. Most urgent: Q1 guest checkout, Q2 return window, Q6 delivery fee, Q15 VAT, Q26 to Q28 (stock, product names, rows 38 to 43), Q35 to Q38 (courier and COD), Q41 categories
- The completed stock sheet back from the client (Size, Product Name, Stock and Category filled; rows 38 to 43 fixed). Never infer missing size values from SKU suffixes, invent names/stock or silently correct codes.
- Approval of ambiguous image/catalogue mappings, including `JNE4380-TP` versus Style `JNE4380`, and any grouping of separate styles into a multi-colour product
- Cloudinary upload completion and reconciliation against the 150-image/21-folder source inventory, reviewed cover/order/alt text, sufficient image quality, product copy and size charts
- Cloudinary production ownership/configuration, named transformations, strict mode and usage alerts per ADR-038; no R2 or Cloudflare media setup is required by the current media decision
- The client's domain/DNS access before launch, separately from media hosting
- Commercial sign-off for customer accounts, returns, bilingual invoices, the stock sheet upload and cash on delivery (beyond the original proposal)
- Approved product/policy content and milestone/payment acceptance terms; no claim that only payments remain is supported by the current implementation

## Known Issues
- Storefront pages use mock catalogue data; size/quantity/Add to Cart controls are not functioning commerce. Product slugs do not identify distinct real products.
- No admin UI, live inventory workflow, cart, checkout, reservations, order processing or payment integration exists in the audited repository.
- Documentation describes `src/`, but the application uses root-level `app/`, `components/`, `features/` and `lib/`. Keep directory migration out of this milestone and reconcile paths explicitly.
- TASK-005 adds typecheck and focused test:env scripts alongside dev/build/start/lint; dependency installation and the lockfile are still pending. Broader documentation-listed unit/database/E2E commands are not proof of configured tests or CI.
- Earlier Next.js security-upgrade note is historical and was not revalidated in this planning pass; verify current upstream advisories during implementation rather than treating the old note as a current finding.
- Arabic PDF engine not chosen yet (TASK-062, ADR-022).
- ExcelJS for the stock sheet is proposed (ADR-036): confirm before TASK-113.
- Rows 38 to 43 of the client's sheet (J0395, JNE4124, J0478) contain duplicate SKU values and size-like Style values, suggesting swapped fields, with other misplaced values. The upload must reject unresolved rows; the client must correct them, not the importer.
- `JAA25KB02100` has one indexed source photo. Two source folders skip filename suffix numbers; this is a review flag, not proof of missing photos.
- Draft catalogue imports, permanent media keys and published storefront data depend on approved client values and a reviewed mapping. No production-ready catalogue is implied by the completed database schema.
- Resend Free caps at 100 emails a day. Switch to Pro before any promotion. This inherited planning note was not revalidated in this documentation pass.
- Sentry free plan: one user, email alerts only, one cron monitor and one uptime monitor, 5,000 errors a month. Upgrade to Team when a second person needs access or a limit is hit. This inherited planning note was not revalidated in this documentation pass.

## Next Step

Verify the applied TASK-005 patch in the development environment: install the declared dependencies to regenerate the lockfile, fill `.env.local` securely, then run the focused environment tests, typecheck, lint and build. Verify that a client import of `lib/env.ts` fails and that missing/invalid settings produce redacted startup errors. Do not mark TASK-005 complete until these checks pass. Then integrate the already-applied migrations/types/tests and server-only catalogue/media boundaries in separate tasks; keep client-data and upload blockers visible. The existing product -> colourway -> SKU -> stock model does not need rebuilding.

The milestone sequence is M0 foundation reconciliation, M1 client storefront review, M2 basic catalogue/inventory admin, M3 transactional commerce, M4 launch readiness. Detailed acceptance criteria and safe Cloudinary placement are in `docs/STOREFRONT-MILESTONE.md`.

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
- 11 Oct 2026: Separate approved foundation delivery applied `20261011073916_catalogue_foundation`, `20261011074102_catalogue_guards` and `20261011074137_catalogue_policy_tuning`; 95 pgTAP assertions passed with synthetic data rolled back. No client catalogue, staff or images were imported into the database, and the delivery did not change Git.
- 11 Oct 2026: Inventoried 150 indexed Drive images across 21 product folders, retained source filenames/links, created `ar-staging/source-images` in Cloudinary and provided manual upload directions after direct Drive transfer failed. No Drive files were edited.
- 11 Oct 2026: Approved documentation-only update adds a client-storefront-review priority overlay, reconciles external foundation progress against actual application code, and records the Cloudinary/catalogue placement gates. Original backlog and historical log retained; no implementation tasks newly marked complete.
