# Project Memory

> The project's current state. Update it after every task. Permanent decisions go in `DECISIONS.md`.

## Current Status

11 Oct 2026 checkpoint: the next delivery priority is **Client Storefront Review**, targeted for Monday, 12 Oct, with the acceptance gates in `docs/STOREFRONT-MILESTONE.md` and the priority overlay in `TASKS.md`. The target date is not a verified delivery promise.

On `doc/storefront-review-milestone`, the approved first real-catalogue preview replaces mock home, collection and PDP displays with 17 source-matched styles, 34 unchanged SKU references and 124 explicit Cloudinary image keys. This is a static review fixture, NOT a Supabase-backed live catalogue. Each style has a distinct slug and unknown slugs call notFound. Search, garment/colour filters and numeric price sorting are implemented. Galleries include selection controls, loading/error states and neutral photograph-number alt text. No semantic image-role or final cover review is claimed.

Temporary display labels use the supplied colour and Package Contains text, and Selling Price values are displayed as AED by explicit approval. Product names are not invented. Sizes and availability remain awaiting confirmation, purchase controls are disabled, and four ambiguous groups are withheld. The preview routes use the existing theme/logo/hero and a simplified preview shell without inactive account/cart controls or unapproved delivery/payment claims. Mock occasion/promotion/journal sections are omitted from the preview home. Other routes and existing shared header/footer files are unchanged, so supporting-page consistency and old links remain later work.

A separate approved database-foundation delivery created 14 tables with RLS, three applied migrations and an earlier receipt of 95 passing pgTAP assertions. Catalogue business tables are empty. Migrations, generated types and tests were delivered outside this repository and have not been integrated here; no app/browser/CI success is implied. The Supabase token hook exists as SQL but has not been enabled or verified in a real staff login flow.

Cloudinary is connected, with product photographs in `ar-staging/source-images/<source folder>`. The Drive inventory contains 150 indexed images across 21 folders. The preview uses 124 explicit keys associated with the 17 approved styles and does not rename or move them. Full binary/visual quality reconciliation and permanent database mapping remain open. Cloudinary folder location and public ID are separate; current bare public IDs do not satisfy the database's final media-key contract. No database import or media mutation was performed. Never edit the client's Drive.

Pranav reports the Vercel environment variables are configured and the test site redeployed. The new branch changes have not been merged or deployed by this work. Browser, live delivery and full build checks have not run, so a functioning deployed preview is not claimed.

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

TASK-005 validation follow-up, directly on the roadmap branch at Pranav's request. The manifest now pins Vitest 5.0.3, uses `@types/node` in the 24.x major (`^24.0.0`), and runs `next typegen && tsc --noEmit` so a clean checkout generates the global `LayoutProps` helper before checking types. A regression assertion in `tests/unit/env.test.ts` checks that script. No runtime/storefront behavior, secret handling or install-script approval policy was changed. These are four-file source/documentation changes, not a completed dependency installation or security remediation.

Pranav's 11 Oct local output shows successful installation after moving the checkout from the Windows/OneDrive filesystem into WSL, then route type generation and `tsc --noEmit` passing with Vitest 5.0.3 and Node 24 typings. The output reports nine high-severity audit findings, no critical findings in that run, and an unreviewed `unrs-resolver@1.12.2` postinstall script. This is user-provided local evidence only. The complete audit JSON and generated lockfile are not available in GitHub, the exact locally resolved Node typing patch is unknown, and no independent clean-install/build/test result is claimed.

The preceding approved 13-file real-catalogue preview is partial TASK-040/041: review dataset, CatalogueGrid/preview shell, read-only preview media adapter, three storefront pages, ProductInfo/Accordions/Gallery, next.config.ts, focused tests and TASKS/MEMORY. Reused HeroSlider, SectionHeading and existing Card/Button/Accordion primitives; preview cards replace the old card's dead quick-add control. Native labelled filter controls introduce no dependencies. Original untransformed images are delivered through an allowlisted server-only adapter; production media-loader/transformations remain TASK-029. Preview prices use an isolated formatter pending TASK-010.

Earlier executed preview checks: generated data compared against the actual XLSX; pure TypeScript catalogue module executed through Node type stripping; style/SKU/image counts, lookup identity and exclusions, null sizes, AED formatting, invalid amounts, filtering, sorting/nonmutation, original filename gaps and supplier attribution verified. Static TSX scan found no dead hash links or hard-coded colour literals in the changed files. These are not TypeScript semantic, React render or browser tests.

Not executed by the assistant for this follow-up: dependency installation, lockfile regeneration, TypeScript semantic typecheck, ESLint, Vitest (including the new regression assertion), Next build, responsive/accessibility browser checks or live image delivery. The sandbox has no npm or internet access. TASK-005 and the storefront milestone remain in progress. No main merge, deployment action, database writes, Cloudinary changes or Drive changes occurred.

TASK-005 retains six-variable Zod validation, explicit browser/server exports and redacted startup errors. Its committed package-lock is still stale relative to the manifest; it was not hand-edited or deleted. Synchronize it through npm before claiming a reproducible branch or a successful security update. Do not use `npm audit fix --force`, unreviewed transitive overrides or blanket install-script approval to hide the remaining findings.

## Waiting On
- Client answers to Q1 to Q41 in `PRD.md`. Most urgent: Q1 guest checkout, Q2 return window, Q6 delivery fee, Q15 VAT, Q26 to Q28 (stock, product names, rows 38 to 43), Q35 to Q38 (courier and COD), Q41 categories
- The completed stock sheet back from the client (Size, Product Name, Stock and Category filled; rows 38 to 43 fixed). Never infer missing size values from SKU suffixes, invent names/stock or silently correct codes.
- Approval of ambiguous image/catalogue mappings: J0395-DR, J0478-KR-NP, JNE4124-KR and JNE4380-TP remain withheld; no automatic grouping of separate styles into a multi-colour product
- Reviewed cover/order/alt text, sufficient image quality, final product copy and size charts; current gallery order follows filenames only
- Cloudinary production ownership/configuration, named transformations, strict mode and usage alerts per ADR-038; no R2 or Cloudflare media setup is required by the current media decision
- The client's domain/DNS access before launch, separately from media hosting
- Commercial sign-off for customer accounts, returns, bilingual invoices, the stock sheet upload and cash on delivery (beyond the original proposal)
- Approved product/policy content and milestone/payment acceptance terms; no claim that only payments remain is supported by the current implementation

## Known Issues
- No admin UI, live inventory workflow, cart, checkout, reservations, order processing or payment integration exists in the audited repository. Static preview content does not replace these workflows.
- Size and multi-colour SKU selection remain unimplemented. All approved fixture styles represent a single source colour; size labels and quantities are explicitly unknown.
- About, Contact and Journal still use their previous placeholder shell. Policy/size-guide pages and old shared navigation links need the separate supporting-page pass.
- Documentation describes `src/`, but the application uses root-level `app/`, `components/`, `features/`, `services/` and `lib/`. Keep directory migration out of this milestone and reconcile paths explicitly.
- TASK-005's typecheck command now generates Next route types first; `test:env` remains focused on environment tests. The synchronized lockfile and complete nine-high-finding audit still need review. Full test/CI setup remains separate.
- Earlier Next.js security-upgrade note is historical and was not revalidated in this planning pass; verify current upstream advisories during implementation rather than treating the old note as a current finding.
- Arabic PDF engine not chosen yet (TASK-062, ADR-022).
- ExcelJS for the stock sheet is proposed (ADR-036): confirm before TASK-113.
- Rows 38 to 43 of the client's sheet (J0395, JNE4124, J0478) contain duplicate SKU values and size-like Style values, suggesting swapped fields, with other misplaced values. The upload must reject unresolved rows; the client must correct them, not the importer.
- `JAA25KB02100` has one indexed source photo. Two source folders skip filename suffix numbers; this is a review flag, not proof of missing photos. The preview preserves those gaps.
- Draft catalogue imports, permanent media keys and published storefront data depend on approved client values and a reviewed mapping. No production-ready catalogue is implied by the completed database schema.
- Resend Free caps at 100 emails a day. Switch to Pro before any promotion. This inherited planning note was not revalidated in this documentation pass.
- Sentry free plan: one user, email alerts only, one cron monitor and one uptime monitor, 5,000 errors a month. Upgrade to Team when a second person needs access or a limit is hit. This inherited planning note was not revalidated in this documentation pass.

## Next Step

Reconcile the local package/lockfile changes with the updated GitHub manifest without discarding either copy, then regenerate and review package-lock.json through npm. Inspect the full audit report to identify the nine high findings and review the exact remaining install script; do not infer that every finding is in development-only code. The assistant cannot access files on Pranav's local WSL machine until they are shared or committed.

After the dependency tree and script policy are reviewed, verify a clean `npm ci`, then run `npm run typecheck`, `npm run lint`, `npm exec -- vitest run tests/unit/env.test.ts tests/unit/preview-catalogue.test.ts` and `npm run build` using the configured staging variables. Verify the server-only client boundary and original Cloudinary delivery. Inspect home/collection/PDP at 375, 768 and 1440, search/filter/sort/reset, two different slugs, unknown-slug 404, single-image gallery, image errors, keyboard focus and disabled purchases. Do not mark these tasks complete until those checks pass. Supporting-page polish and consistency are the next separately scoped UI pass.

The milestone sequence is M0 foundation reconciliation, M1 client storefront review, M2 basic catalogue/inventory admin, M3 transactional commerce, M4 launch readiness. The approved static preview advances visual review only; it does not satisfy M1's full data-backed acceptance. Detailed acceptance criteria and safe permanent Cloudinary placement are in `docs/STOREFRONT-MILESTONE.md`.

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
- 9 Oct 2026: docs updated for the client's stock sheet (their SKUs, style codes and values used exactly as written, never generated), price per SKU, details per colourway, stock sheet upload and export, cash on delivery (ADR-006 replaced by ADR-033), own checkout page, new order statuses (ADR-023 and ADR-025 amended, ADR-029 to ADR-036); tasks TASK-113 to TASK-125 added; `AGENTS.md` split into `.agents/rules/`
- 10 Oct 2026: media moved from Cloudflare R2 with sharp resizing at upload (ADR-037 replaces ADR-010 and ADR-011; PRD Q19 answered); ARCHITECTURE, SECURITY, DESIGN, RULES, agent rules, TASKS (029, 075, 090, 109) and TEST_PLAN updated
- 10 Oct 2026: Polished Collections UI: removed Radix dependencies after confirming Shadcn Base UI (base-lyra) setup, added Lenis smooth scrolling globally with customized wheelMultiplier, and fixed native scroll trapping in the sticky filter sidebar.
- 10 Oct 2026: Fixed Shadcn UI `Select` component presentation bugs: fixed `defaultValue` mapping to display string, adjusted `SelectContent` layout logic (`alignItemWithTrigger={false}`) to drop completely below the trigger. Fixed mobile `Sheet` padding inside Collections page so the filters have horizontal breathing room and don't overlap the close button.
- 10 Oct 2026: Polished mobile header layout (`StoreHeader.tsx`): added a slide-out mobile navigation `Sheet` attached to the hamburger menu icon, centered the logo on mobile screens by adjusting flex containers, and moved the mobile search icon next to the hamburger menu.
- 10 Oct 2026: Implemented Product Detail Page UI (`app/collections/[slug]/page.tsx`): Built responsive sticky-scroll layout where the main product image stays pinned while details scroll. Componentized UI into `ProductGallery`, `ProductInfo`, `ProductAccordions`, and `ProductTrustStrip`. Added mobile-specific horizontal swipeable thumbnail gallery, and a responsive "You May Also Like" section (5 products on desktop, 4 on mobile).

- 11 Oct 2026: Media moved from R2 + sharp to Cloudinary (ADR-038), because R2 needs a payment method.
- 11 Oct 2026: Separate approved foundation delivery applied `20261011073916_catalogue_foundation`, `20261011074102_catalogue_guards` and `20261011074137_catalogue_policy_tuning`; 95 pgTAP assertions passed with synthetic data rolled back. No client catalogue, staff or images were imported into the database, and the delivery did not change Git.
- 11 Oct 2026: Inventoried 150 indexed Drive images across 21 product folders, retained source filenames/links, created `ar-staging/source-images` in Cloudinary and provided manual upload directions after direct Drive transfer failed. No Drive files were edited.
- 11 Oct 2026: Approved documentation-only update adds a client-storefront-review priority overlay, reconciles external foundation progress against actual application code, and records the Cloudinary/catalogue placement gates. Original backlog and historical log retained; no implementation tasks newly marked complete.
- 11 Oct 2026: TASK-005 ten-file environment-validation patch committed to the roadmap branch by explicit approval. Lockfile regeneration and runtime acceptance remain pending; no main merge or deployment action.
- 11 Oct 2026: Approved 13-file real-catalogue preview implemented and committed on the roadmap branch. Exact source-value and pure catalogue behavior checks passed; full build/browser tests remain pending. Four ambiguous groups withheld, purchases disabled, unknown sizes/stock explicit. Database, Cloudinary assets and Drive unchanged.
- 11 Oct 2026: At Pranav's request, edited GitHub directly to generate route types before typecheck, pin Vitest 5.0.3, align Node typings to 24.x and add a script regression assertion. Recorded user-provided local typecheck success and the remaining nine high audit findings. No generated lockfile was available to commit, no scripts were approved, and main remains unchanged.
