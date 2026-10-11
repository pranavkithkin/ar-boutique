# Project Memory

> The project's current state. Update it after every task. Permanent decisions go in `DECISIONS.md`.

## Current Status

11 Oct 2026 checkpoint: prioritize Client Storefront Review, targeted for Monday, 12 Oct. The date is a target, not a verified delivery promise. M0 foundation reconciliation, M1 storefront review, M2 secure basic admin, M3 transactional commerce and M4 launch readiness remain distinct; `docs/STOREFRONT-MILESTONE.md` holds the acceptance gates.

PR #10 merged the approved real-catalogue preview and synchronized lockfile into main at `5f1bbd137cce4fffcb77e3f27babd5c06f1b0489`. The source branch `doc/storefront-review-milestone` is retained at `70695d29ca32269e016fffba0202396fdf867f1c`. The merge covered seven commits and 22 files, used a normal merge commit and did not bypass required checks. Pranav reported production deployment complete afterward; the assistant has not independently verified deployment or browser behavior.

The preview is a static fixture of 17 approved styles, 34 exact source SKUs and 124 explicit Cloudinary image keys. Each style has a distinct slug; unknown slugs call notFound. Search/garment/colour filters, numerical price sorting and gallery selection/loading/error controls exist. Temporary display labels combine supplied colour and Package Contains; Selling Price is shown in AED by explicit approval. Names, sizes, stock and category data were not invented. Purchases remain disabled. J0395-DR, J0478-KR-NP, JNE4124-KR and JNE4380-TP remain withheld. Gallery order follows filenames, not an approved cover/role review.

The separate approved database foundation has 14 tables, three applied migrations, RLS and catalogue/stock/publish guards. Earlier receipts record 95 passing pgTAP assertions with synthetic data rolled back. Catalogue business tables remain empty. The delivered migrations/types/tests have not been integrated into this repository. The SQL admin token hook is neither activated nor tested in a real login. No live catalogue, inventory admin, cart, checkout, reservations, order processing or payments is implied.

Cloudinary photographs are under `ar-staging/source-images/<source folder>`. Drive inventory: 150 JPEGs across 21 style folders. The preview uses 124 approved keys without renaming/moving assets. Current bare public IDs are not the final database UUID-based media contract. Binary/visual quality reconciliation, final mapping and cover/alt approval remain open. Never edit the client's Drive.

## Validation and deployment evidence

Pranav's local WSL/Node 24 output before TASK-094 shows `next typegen && tsc --noEmit`, 55 environment tests plus 17 catalogue tests, ESLint and Next production build passing. Those 72 tests are user-run evidence, not independent CI certification. Regenerated `package-lock.json` was committed through npm output at `70695d29ca32269e016fffba0202396fdf867f1c`; root specifications match the manifest. Vitest is 5.0.3; Node typings resolve to 24.19.2. The prior stale-lockfile blocker is resolved at source level; clean `npm ci` reproduction remains pending.

The supplied complete audit has nine high package entries tracing to GHSA-vfj7-8cjw-p6xm, the unpatched braces stack-exhaustion advisory; zero critical entries in that report. No security clearance is claimed. shadcn is a production dependency with an imported CSS entry; package classification alone does not prove runtime reachability. `unrs-resolver@1.12.2` install-script review remains open. No force audit fix, guessed override or blanket script approval was applied.

The Preview deployment of the approved source commit failed startup validation for all six variables. Pranav's screenshot established that variables were Production-only. The failure was environment scope, not a reason to remove validation or approve npm scripts. Main was merged with explicit user approval, then production deployment was reported complete. TASK-009 Preview environment configuration is still outstanding. This TASK-094 batch does not alter environment variables or explicitly deploy anything.

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
- Approved static catalogue/environment source changes and npm-generated lockfile merged in PR #10; prior local validation evidence recorded above. This does not complete M1 or launch acceptance.

## Current Task

TASK-094 supporting-page review batch on `feature/TASK-094-supporting-pages`, based on main `5f1bbd137cce4fffcb77e3f27babd5c06f1b0489`. Exactly 22 approved paths: 19 source/test files and TASKS/MEMORY/STOREFRONT-MILESTONE. No new dependencies, catalogue data changes, media/database/Drive changes, credential edits, PR creation, main merge or explicit deployment action.

Eight destinations use contextual approval placeholders: About, Contact, Journal, Shipping, Returns, Terms, Privacy and Size Guide. Existing ComingSoon now renders typed content, a proper h1, breadcrumbs, pending-content list and a real collection link through StoreButton's link-render API. No nested link/button controls or fabricated forms/contact/policy content. Shared StoreHeader/StoreFooter replace duplicate catalogue-only shell definitions; mobile Sheet navigation, current links, 44px-plus navigation targets and focusable skip targets are included. Displayed footer no longer uses TrustStrip or payment claims. Logo, hero, tokens, catalogue records and card/filter logic are retained. Root/page metadata is noindex for the review.

Executed here: Node content/route checks for all eight destinations, navigation route existence/footer coverage/current-link behavior; TypeScript syntax transpilation of all 19 changed/new TS/TSX files; shared shell/skip-target source checks; exact unchanged catalogue grid implementation from CardImage onward. This is not semantic TypeScript checking or browser testing. `tests/unit/storefront-content.test.ts` contains deterministic data and source-level regressions; Vitest execution is still pending.

Not executed for this batch: npm install/ci, full typecheck, ESLint, Vitest, Next build, live route/image requests, browser screenshots, keyboard/focus testing, responsive QA. The sandbox has no npm or internet access. A preinstalled TypeScript library was used for syntax-only checks. Earlier passing checks apply to the pre-TASK-094 baseline only. TASK-094 and M1 remain in progress.

## Waiting On
- Client answers to Q1 to Q41 in PRD, especially guest checkout, return window, delivery fee, VAT, stock/names/sizes, problematic workbook rows, courier/COD and categories
- Completed workbook with approved Product Name, Size, Stock and Category; client correction of rows 38 to 43. Never infer sizes from SKU suffixes or silently correct source spelling/codes
- Explicit mapping/grouping approval for the four withheld image groups; no automatic grouping by colour
- Reviewed gallery covers/order/alt text, image quality, product copy and measurement charts
- Approved brand story, contact details, articles and policy texts; placeholders are not final legal or operating policies
- Cloudinary client ownership, named transformations, strict mode and usage alerts per ADR-038; domain/DNS access is separate
- Commercial approval for accounts, returns, bilingual invoices, sheet upload and COD additions; milestone/payment terms and client acceptance

## Known Issues
- No operational admin, live inventory, cart, checkout, reservations, orders or payment integration
- Size and multi-colour selection not implemented; fixture styles have one source colour and unknown sizes/stock
- TASK-094 source is branch-only until separately reviewed and merged; full runtime and browser QA remain
- Docs use `src/` while app uses root-level paths; do not introduce an unrelated migration
- Nine audit entries share one braces advisory; unrs-resolver script review, clean-install verification and Preview variable setup remain
- Original Next security note and historical provider-plan limits were not revalidated as current findings
- Arabic PDF engine (TASK-062, ADR-022) and ExcelJS approval (ADR-036) remain open
- `JAA25KB02100` has one photo; two filename-sequence gaps are review flags, not proof of missing images
- Draft imports and UUID-based final media keys require explicit record/asset approval; never weaken RLS for a demo
- Full test/CI setup, browser performance/accessibility review and launch security remain separate

## Next Step

Validate this branch in the existing configured local checkout without discarding local work or the earlier dependency stash. After safely switching to the branch, run `npm run typecheck`, `npm exec -- vitest run tests/unit/env.test.ts tests/unit/preview-catalogue.test.ts tests/unit/storefront-content.test.ts`, `npm run lint` and `npm run build`. Run a clean `npm ci` reproduction separately when ready to replace the local install. Do not claim unavailable scripts such as check:tokens or full browser suites already exist.

Inspect all eight supporting routes plus home/collection/two distinct PDPs/unknown slug at 375, 768 and 1440. Check mobile Sheet open/close/Escape/focus return, active links, skip navigation, no overflow, footer destinations, gallery/image delivery, filters/sort/reset, empty/error states and disabled purchases. Noindex is not access control. Approval placeholders and static fixtures do not satisfy full M1 acceptance.

Only after validation and explicit approval should this branch enter main. Then reconcile database migrations/types/tests and implement server-only Supabase clients before secure admin work. Do not import incomplete data, move media, activate auth hooks or invent client policies as part of this page pass.

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
- 11 Oct 2026: TASK-005 ten-file environment-validation patch committed to the roadmap branch by explicit approval. Lockfile regeneration and runtime acceptance remain pending; no main merge or deployment action.
- 11 Oct 2026: Approved 13-file real-catalogue preview implemented and committed on the roadmap branch. Exact source-value and pure catalogue behavior checks passed; full build/browser tests remain pending. Four ambiguous groups withheld, purchases disabled, unknown sizes/stock explicit. Database, Cloudinary assets and Drive unchanged.
- 11 Oct 2026: At Pranav's request, edited GitHub directly to generate route types before typecheck, pin Vitest 5.0.3, align Node typings to 24.x and add a script regression assertion. Recorded user-provided local typecheck success and the remaining nine high audit findings. No generated lockfile was available to commit, no scripts were approved, and main remains unchanged.
- 11 Oct 2026, later checkpoint: Pranav supplied passing typecheck, 72 focused tests, lint and production-build output, and committed the npm-generated lockfile at 70695d29ca32269e016fffba0202396fdf867f1c. Reviewed the audit as one braces advisory propagated through nine package entries. PR #10 merged at 5f1bbd137cce4fffcb77e3f27babd5c06f1b0489 after explicit approval; Preview failure traced to Production-only variables. Pranav reported production deployment complete. Earlier log statements remain historical, not current status.
- 11 Oct 2026: Approved TASK-094 branch batch implements eight contextual supporting placeholders, shared preview navigation/footer, noindex metadata and focused regression tests. Node contract/source checks and syntax transpilation passed; full runtime and browser checks remain pending. No main merge, PR creation, explicit deployment, provider data or credential changes in this batch.
