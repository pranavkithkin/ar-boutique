# AR Boutique: storefront review first, operations next

Planning checkpoint: 11 October 2026. Target client review: Monday, 12 October 2026. Updated after PR #10 and the approved TASK-094 supporting-page implementation. The date remains a target, not a delivery promise.

## Decision and current evidence

The next milestone is **Client Storefront Review**, not ecommerce complete except payments. A coherent visual review can demonstrate progress, but it is not full data-backed M1 acceptance, working admin or a commerce launch. Never invent client values or weaken RLS to make a demo look complete.

PR #10 merged seven commits/22 files into main at `5f1bbd137cce4fffcb77e3f27babd5c06f1b0489`. It includes environment validation, a static real-catalogue preview and the npm-regenerated lockfile. Pranav supplied local passing typecheck, 55 environment tests plus 17 catalogue tests, lint and Next production build. Those 72 passes are user-provided local evidence, not independent CI or browser certification. Main and the source branch were preserved using a normal merge commit.

Preview failed because the six required variables were scoped only to Production, as confirmed by Pranav's screenshot. Validation and credentials were not changed. After approval and merge, Pranav reported production deployment complete. Deployment success and browser behavior have not been independently verified by the assistant. TASK-009 Preview configuration remains open.

The exact audit reports nine high-severity package entries propagated from one unpatched braces advisory (GHSA-vfj7-8cjw-p6xm), no critical entries. Runtime reachability remains unverified; shadcn is a production dependency and supplies imported CSS. Do not force downgrade Next tooling/shadcn, invent overrides or blanket-approve scripts. unrs-resolver install-script review and clean npm-ci reproduction remain pending.

## What exists versus what remains

| Area | Evidence | Still open |
|---|---|---|
| Main storefront | 17 approved styles, 34 source SKUs, 124 explicit image keys; distinct slugs, filters, sort, galleries and disabled purchases | Browser QA, approved canonical names/sizes/stock/categories and live Supabase integration |
| Supporting pages | TASK-094 branch implements eight contextual approval placeholders and a shared shell | Full branch runtime checks, browser acceptance, final client-approved content and separate merge |
| Database | 14 tables, three applied migrations, RLS and guards; earlier 95 passing rolled-back pgTAP assertions | Repository/CI integration, real auth flow and live catalogue; business catalogue tables remain empty |
| Media | Client photographs uploaded to Cloudinary; preview uses original allowlisted keys | Binary/visual reconciliation, reviewed cover/order/alt text, final UUID-based keys and production adapter |
| Admin/commerce | Documented roadmap and database primitives | No secure admin UI, operational inventory, cart, checkout, reservations, orders or payments |

Source counts from the original workbook roadmap were historical planning counts, not a clean import count. The sheet contains 42 rows and 39 literal distinct SKUs, including duplicate/misplaced tail rows. Never present it as 42 unique valid SKUs or use checkbox counts as a completion percentage.

## Current approved TASK-094 scope

Branch: `feature/TASK-094-supporting-pages`, from the merged main baseline. Exactly 22 paths: 15 updates and 7 additions. This scope does not include a PR, main merge or explicit deployment action. Push-triggered Preview behavior is not certified.

Updated source: StoreHeader, StoreFooter, ComingSoon, CatalogueGrid, home, collections, PDP, About, Contact, Journal, 404 and root layout. Added source: typed `features/content/preview-pages.ts`, four policy routes, Size Guide and `tests/unit/storefront-content.test.ts`. Updated docs: TASKS, MEMORY and this milestone record.

Reuse existing components and brand: Sheet navigation and StoreButton link rendering, existing logo/hero/theme tokens. No new packages or hand-edited UI primitives. One header/footer across storefront routes; remove duplicate shell definitions and inactive purchase/account/search controls. Footer destinations are real routes, not dead links. Contextual pending-approval content replaces generic broken-encoding placeholders. No fabricated phone, email, address, legal policy, refund/delivery promise, article or size chart. Privacy placeholder makes no data-handling guarantee. Keep review noindex, while recognizing that noindex is not access control.

Executed for TASK-094: Node checks for eight content/route contracts, navigation route existence/footer coverage and current-link matching; syntax-only TypeScript transpilation of 19 TS/TSX files; shared-shell/skip-target source checks; exact unchanged catalogue card/filter implementation. New Vitest regression suite is committed but unexecuted here. Full semantic typecheck, lint, Vitest, Next build and browser QA are pending. Earlier 72 passing tests apply only to the preceding baseline.

## Milestones and acceptance gates

### M0. Reconcile the foundation

1. Bring the three already-applied migrations, generated types and pgTAP suite into Git without reapplying or rewriting them.
2. Complete server-only Supabase/catalogue/media boundaries and money helpers. Browser exports must contain only public configuration. Future integration secrets should be required only when their features are implemented.
3. Add reproducible database and application test setup. Do not claim scripts in planning docs already exist in package.json.
4. Retain root-level app/components/features/services/lib; do not fold in a directory migration to match old src documentation.
5. Reconcile all expected Cloudinary intake assets against source identity, not just counts.

References: TASK-005, 006, 007, 009, 010, 012 through 020 and 029.

### M1. Client Storefront Review

- Home: preserve established brand and inspect baked-in hero text before overlays; approved photographs/content, correct product pairing and meaningful CTAs; no invented promotions, availability, delivery claims or testimonials.
- Collection: distinct products, correct image/price pairing, meaningful filters/sort, truthful availability and empty state. Remove decorative controls whose behavior is not implemented.
- PDP: slug resolves to its own product, unknown slug returns 404, correct colourway gallery/details and integer-fils formatting. No mock item repeated under unrelated slugs.
- Variant UX for the live catalogue: colour before size, reset incompatible selections, per-colour galleries/details, server-rendered colour query links, hide unnecessary pickers, verified sold-out states. Unknown size is not proof of a no-size product.
- Supporting routes: About, Contact, Journal, Shipping, Returns, Terms, Privacy and Size Guide resolve with approved facts or explicit approval placeholders. Header/footer must not imply working cart/account/checkout or link to nonexistent categories/posts.
- Preview controls: disabled purchase state is explicit. Static real-photo review is permitted, not fictitious inventory or published draft records.
- Review QA: 375/768/1440; keyboard and visible focus; mobile Sheet open/close/Escape/focus return; skip targets; no overflow; gallery/image/link integrity; two different real PDPs; unknown-slug 404; search/filter/sort/reset; loading/error/empty states and no runtime errors.
- Acceptance: record client review against actual agreed milestone/payment terms, not a claim that only payment integration remains.

References: TASK-039, 040, 041, 091, 094, relevant 029/037/097/106. Static review does not close their full original acceptance criteria.

### M2. Secure basic catalogue/inventory admin

Supabase admin login, active-admin allowlist, TOTP MFA, hook activation, server and database enforcement; product/colourway/SKU editing; exact source codes and per-SKU prices; per-colour galleries and publish checks; on-hand/held/available stock; reasoned adjustments with actor/time/history and filters. Prevent direct writes bypassing stock/publish functions. Test hidden colours, inactive SKUs and all four product shapes. SQL existence is not an operational UI or activated auth hook.

References: TASK-020 through 038 and 042. Manual validated editing may precede transactional sheet import/export (TASK-113 through 115), which remains separately tracked.

### M3. Transactional commerce

Cart, server price/availability validation, UAE address collection, stock reservations, order state machine, Stripe test mode, signed/idempotent webhooks, expiry/reconciliation and communications. Accounts, COD, returns, bilingual invoices and reports remain in scope subject to existing commercial/client gates. References: TASK-043 through 089 and 116 through 125.

### M4. Launch readiness

Approved policies, shipping/VAT, live providers, authorization/security review, accessibility/performance, monitoring, backup/recovery, domain/SSL and end-to-end live purchase/refund acceptance. References: TASK-090, 092, 093, 095 through 112 as applicable. Do not block visual review on a complete CMS, but do not call a placeholder a published policy.

## Database and source-value boundaries

Retain `products -> product_colours -> product_variants -> stock_levels`. Images belong to colourways; inventory adjustments record SKU stock movements. Style codes and garment details are per colourway. Price/compare-at price are integer fils per SKU. A colourway's size SKUs share photographs. No stock on products, galleries per size, generated source codes or automatic product grouping by colour.

Support sizes only, colours plus sizes, colours only and no-choice products. Preserve SKU/style/colour/size/details/description values exactly, including casing and misspellings. Case-insensitive SKU uniqueness must not mutate original values. Missing sizes cannot silently become no-size variants. Draft zero-stock defaults are not evidence of the client's inventory.

Public reads expose only published/visible/active data and constrained availability. Exact quantities remain private except the deliberately limited low-stock indicator at three or fewer. Never relax RLS for a demo. adjust_stock does not implement checkout reservations, transactional imports or COD accounting.

## Media placement: only after approved records

Current intake: `ar-staging/source-images`. Current public IDs can be bare filenames despite folder location. Media Library folder and delivery ID are separate.

Final folder: `ar-staging/products/{productId}/{productColourId}`.
Final public ID/database key: `ar-staging/products/{productId}/{productColourId}/{assetId}`.
Use real database UUIDs and a safe application asset segment, no extension; Cloudinary immutable asset ID need not change.

1. Compare each source filename with uploaded assets; retain original filename/folder/link, immutable asset ID, current public ID, bytes and dimensions. Exclude system files. Equal counts are insufficient.
2. Review actual photographs for cover/order, defects, duplicates, resolution and rights. Do not infer quality from one sample, force crops or promise zoom detail.
3. Resolve data/mappings and preview exact draft product/colourway/SKU records before import.
4. Generate final IDs from real records and preview exact source/target assets and counts before any move/rename.
5. Rename without overwriting; place media in final folders; retain original attribution and provenance. Never mutate Drive or delete originals.
6. Validate keys/properties, attach to the correct colourway and store approved ordering/alt text. Keep incomplete catalogue records Draft.
7. Record success/failure by immutable asset ID and resume safely. Cloudinary and Postgres are not one transaction.

No media move/rename or catalogue import is authorized by this page batch.

## Inputs still blocking live catalogue and policies

| Issue | Required resolution |
|---|---|
| Product Name, Size, Stock | Client-approved values; no guesses or suffix-derived sizes |
| Category | Approved merchandising; draft may remain unassigned |
| Rows 38 to 43 | Client corrections to duplicate/misplaced J0395, JNE4124 and J0478 values |
| Four withheld groups | Explicit mapping for J0395-DR, J0478-KR-NP, JNE4124-KR and JNE4380-TP |
| JNE4380-TP versus JNE4380 | Confirm alias without changing source values |
| JAA25ST01341 uploaded | Preserve provenance; local folder cleanup is not a catalogue-code change |
| JNE4207 folder / JNE4207-TP filename stems | Preserve identifiers and association |
| Multi-colour grouping | Explicit product-group mapping, not inference |
| Currency/VAT/delivery/returns/legal | AED is approved for static review; final commercial and legal claims need approval |
| JAA25KB02100 | One photograph; accept that limitation or obtain more |
| Filename suffix gaps | Review flags only; not proof of missing assets |

## Suggested client wording after acceptance

Only after storefront checks pass and the payment milestone is confirmed:

> The storefront review milestone is ready: the homepage, catalogue and product-page experience are available for review, with supporting page structure in place. The catalogue and inventory database foundation has been implemented. Admin workflows, checkout/payment integration and launch testing remain in progress or pending in the delivery plan.

Do not say only payment integration remains. The contract and payment trigger were not verified, and client acceptance has not been recorded.

## Evidence and history

The original 11 Oct planning audit used main `6b461b9a0312d543eafda9ac0efc41c5d2d2d9d2`, when storefront pages used mocks. Its proposed three-file roadmap change was implemented before TASK-005 and the 13-file catalogue preview. Those original observations are historical; current source and verification state are above. TASKS retains the full numbered backlog; MEMORY retains the chronological log. No original task is newly marked complete by this update.

- [Merged preview PR #10](https://github.com/pranavkithkin/ar-boutique/pull/10)
- [Npm-generated lockfile commit](https://github.com/pranavkithkin/ar-boutique/commit/70695d29ca32269e016fffba0202396fdf867f1c)
- [Merged main baseline](https://github.com/pranavkithkin/ar-boutique/commit/5f1bbd137cce4fffcb77e3f27babd5c06f1b0489)
- [Braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [Applied foundation package](https://u260612127.p.clickup-attachments.com/u260612127/850bb32a-b9c8-5320-a99e-bcc947a02475/AR-Boutique-Database-Foundation.zip?view=open)
- [Database handoff](https://u260612127.p.clickup-attachments.com/u260612127/0ed4fcf9-3251-53f5-b813-3880e4b41aa6/AR-Boutique-Database-Handoff.md?view=open)
- [Image inventory workbook](https://u260612127.p.clickup-attachments.com/u260612127/1b02a45b-4fd5-5b89-a95c-33444b3d7110/AR-Boutique-Image-Upload-Plan.xlsx?view=open)

This batch modifies repository source/documentation only. No database, Cloudinary, Drive, credentials, main merge, PR creation or explicit deployment action occurs. Runtime and browser verification of the new branch remain outstanding.
