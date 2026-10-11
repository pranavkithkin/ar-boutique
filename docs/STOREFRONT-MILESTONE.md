# AR Boutique: storefront review first, operations next

Planning checkpoint: 11 October 2026. Requested client review: Monday, 12 October 2026.

## Decision

Make the next acceptance milestone **Client Storefront Review**, not "ecommerce complete except payments".

The home, collection and product pages should demonstrate the boutique convincingly, using the client's photographs and approved catalogue values. Supporting pages must resolve cleanly, with approved basic content or explicit placeholders. Checkout remains unavailable until the transactional backend is tested.

The existing database model is suitable for colour/size variants and basic stock management. Do not rebuild it. The immediate engineering gap is connecting that foundation to the repository and storefront, then delivering a secure inventory interface.

The requested Monday date is a target, not a validated delivery promise. Catalogue inputs and code-level QA remain blocking acceptance conditions.

## What is actually ready

| Area | Verified state | What this does not mean |
|---|---|---|
| Storefront | Home, collection and PDP visual components exist | Product routes still use mocks; selectors and purchase controls are not working commerce |
| Database | 14 foundation tables, RLS, three applied migrations | No business catalogue has been imported; no complete ecommerce database |
| Database testing | Earlier foundation receipt records 95 passing pgTAP assertions, rolled back | Not application tests, CI, browser tests, payment tests or a new test run today |
| Cloudinary | Connected cloud; uploads arriving in `ar-staging/source-images/<source folder>` | Upload completion, duplicate checking and product mapping are not yet signed off |
| Vercel | Founder reports variables added and redeployment completed | Adding variables does not connect the application; deployment was not independently checked through Vercel |
| Inventory admin | Detailed roadmap plus database stock functions | No login, product editor or stock screen in the current app |

Source audit: repository commit `6b461b9a0312d543eafda9ac0efc41c5d2d2d9d2`. There are six checked numbered tasks in the existing roadmap. This is not an effort percentage. In particular, TASK-039 and TASK-091 describe visual scaffolding, not final client acceptance.

## Reordered milestones

### M0. Reconcile the existing foundation

Do this before treating the catalogue as live.

1. Add the already-applied migrations, test suite and generated types to the repository through a separately reviewed change. Preserve their actual applied versions; do not reapply or rewrite them.
2. Implement TASK-005 environment validation and server-only Supabase/catalogue/media boundaries. Keep secrets out of public modules.
3. Add money helpers, relevant test scripts and a reproducible database-test command. Do not claim that commands listed in documentation already exist: `package.json` currently has only dev, build, start and lint.
4. Keep the current root-level `app/`, `components/`, `features/`, `lib/` layout for this delivery. Resolve the documents' `src/` mismatch explicitly rather than mixing in a large directory migration.
5. Reconcile the finished Cloudinary upload against the 150-image, 21-folder Drive inventory.

Existing task references: TASK-005, 006, 007, 009, 010, 012 through 019, 020 and 029. Some have partial external evidence, not full repository/CI completion.

### M1. Client Storefront Review: nearest milestone

**Acceptance is a coherent client walkthrough, not a production checkout.**

- **Home:** preserve the established brand/design baseline; inspect existing baked-in hero text before adding overlays; make every displayed CTA meaningful; use the correct products and approved photos in new arrivals. No invented promotions, stock assertions, delivery promises or testimonials.
- **Collection:** real product-to-page identity, accurate image/price pairing, truthful availability, useful filters/sort when shown, clear empty state. Remove decorative controls if their behavior is not ready.
- **PDP:** distinct products for distinct slugs, unknown slugs return 404, matching colourway photos and garment details, unambiguous SKU selection, exact client values and correct price formatting. Never render the same mock item under every slug.
- **Variant UX:** select colour before size; hide unnecessary pickers; colour changes reset incompatible size selection and switch gallery/details; preserve `?colour=`. Disabled sold-out states require verified availability, not guessed stock.
- **Supporting routes:** About, Contact, Journal, Shipping, Returns, Terms, Privacy and Size Guide resolve with approved facts or a clear "content awaiting approval" state. Header search/account/cart are either implemented or explicitly unavailable, never dead controls. Fix or remove the nonexistent category and journal-post destinations.
- **Preview controls:** cart/checkout must not imply a successful purchase. Until implemented, show a clear catalogue-preview state rather than a clickable dead Add to Cart.
- **Review QA:** check 375, 768 and 1440 widths; keyboard navigation; gallery behavior; no broken images or accidental 404s; no console/runtime errors; two different real product pages; loading/error/empty states.

TASK references: 039, 040, 041, 091, 094, relevant parts of 029, 037, 097 and 106. Track this milestone separately from the original full acceptance criteria.

**Data gate:** Product Name, Size, Stock and Category are incomplete in the workbook, and rows 38 to 43 need client correction. Do not guess them. If the data is still unavailable, a clearly labelled visual review can use the real photographs and supplied details with visible approval placeholders, without inserting fictitious catalogue values or claiming live inventory. That is design review only, not M1's full data-backed acceptance.

### M2. Basic catalogue and inventory administration

Keep the operational first release small but real.

- Supabase Auth admin login, active-admin allowlist and TOTP MFA; enforce authorization in database/functions and server actions, not just routing.
- Product list with name/style/SKU search, draft/published status, colourways, sizes, SKU prices and per-colourway galleries.
- Per-SKU stock grid: on hand, held and available; adjustment requires reason and records actor, timestamp, delta and history. Low/out-of-stock filters.
- Do not let direct table edits bypass stock or publishing functions.
- Enable and test the existing access-token hook only with the approved auth setup and staff account; it is not enabled merely because its SQL exists.
- Validate publishing, hidden colours, inactive SKUs and every supported product shape.
- For the initial release, manual validated editing can precede stock-sheet import/export; full transactional import remains a distinct task, not a hidden requirement of the first stock screen.

TASK references: 020 through 038, 042; later 113 through 115. Inventory ledger foundations are already built; the interface and integration are not.

### M3. Transactional commerce

Cart, server price/availability validation, address capture, stock reservations, order state machine, Stripe test mode, verified idempotent webhooks, expiry/reconciliation and customer communications.

Customer accounts, COD, returns, bilingual invoices and related reports stay visible in the full backlog and depend on commercial/client confirmation where already noted. They are not silently dropped to justify "only payments left".

TASK references: 043 through 089, 116 through 125 and relevant email/invoice tasks.

### M4. Launch readiness

Approved legal/policy text, shipping/VAT settings, live provider configuration, production security and authorization review, accessibility/performance checks, monitoring, backup/recovery procedures, domain setup and a real end-to-end purchase/refund acceptance test.

TASK references: 090, 092, 093, 095 through 112 as applicable. Content administration can follow the review storefront; do not block visual review on a full CMS.

## Database: retain the implemented model

`products -> product_colours -> product_variants -> stock_levels`

`product_images` belongs to `product_colours`; `inventory_adjustments` records SKU stock movement.

One colourway can have several size SKUs sharing the same photographs. Price and compare-at price belong to SKUs and use integer fils. Do not copy galleries for M and XL, store stock on products, or group unrelated styles merely because their colour names match.

Supported shapes remain sizes only, colours and sizes, colours only and no choices. A product can initially have a single colourway. Additional colourways are grouped only from explicit product-group information or approved mapping.

Case-insensitive SKU uniqueness preserves original client casing. A missing size is not permission to declare a genuinely sized product "no size". The initial zero-stock row is a safe draft default, not evidence that the client has no inventory.

Public reads expose published/visible/active catalogue data and constrained availability. Exact stock counts remain private except the deliberately limited low-stock indicator. Draft catalogue records must not be exposed by weakening RLS for a demo.

The stock/import/order functions are separate concerns: foundation `adjust_stock()` does not mean reservation, checkout, import or COD accounting is implemented.

## Cloudinary: finish intake, then place assets once

Current source folder: `ar-staging/source-images`.

Final intended Media Library folder:

`ar-staging/products/{productId}/{productColourId}`

Final database media key / Cloudinary public ID:

`ar-staging/products/{productId}/{productColourId}/{assetId}`

Here `productId` and `productColourId` are real database UUIDs. The final `assetId` segment is an application-owned safe identifier, not a requirement to change Cloudinary's immutable asset ID. Do not include a filename extension in the public ID.

Observed sample: `JAC25ST01935` is stored inside its source folder but currently has a bare public ID. Folder placement and delivery ID are separate in this environment; moving a folder alone will not satisfy the database key format.

### Placement sequence

1. Wait until uploads finish; compare every expected source filename with the Cloudinary inventory. Preserve original filename, folder, immutable asset ID, current public ID, bytes and dimensions in the reconciliation manifest. Exclude system files. Equal counts alone do not prove a match.
2. Review actual images for cover/order, defects, duplicates, resolution and rights concerns. One sampled image is 640 x 853, not evidence all images share that resolution; do not promise large zoom detail or blindly force crops. The one-image source folder and skipped suffixes remain review flags.
3. Resolve catalogue mappings and required fields, then preview the exact draft product/colourway/SKU records before any bulk import.
4. Generate final target IDs from those real records; show exact file counts, source and target paths before the Cloudinary batch.
5. Rename public IDs without overwriting; move the associated folders to their final locations. Preserve originals' attribution and original filenames in metadata/manifest. Do not mutate Drive or delete source photographs.
6. Validate returned media properties and final keys, attach images to the correct colourway and set reviewed gallery order/alt text. Keep incomplete products in Draft.
7. Reconcile success/failure by immutable asset ID. Cloudinary and Postgres are not one atomic transaction: record each completed operation and resume safely after failure, rather than rerunning blindly.

No renames/moves are authorized by this document's preparation. A later approval must cover the exact reconciled assets and targets.

## Inputs that block a clean import

The client's values stay unchanged. The existing workbook is not a valid 42-unique-SKU import.

| Issue | Required resolution |
|---|---|
| Missing Product Name, Size and Stock | Client-approved values; do not derive names, infer sizes from suffixes or invent quantities |
| Missing Category | Confirm before category merchandising; can remain unassigned in a draft |
| Rows 38 to 43 | Client corrects duplicate SKU/size-like Style values for J0395, JNE4124 and J0478 |
| `JNE4380-TP` folder vs `JNE4380` Style | Confirm the alias without altering the original client codes |
| `JAA25ST01341 uploaded` | Preserve provenance; local label cleanup is not permission to alter catalogue values |
| `JNE4207` folder vs `JNE4207-TP` filenames | Preserve both original identifiers; verify the association |
| Product grouping | No automatic merge of separate styles into one multi-colour product |
| Currency, VAT, shipping and policies | Confirm monetary interpretation and claims before publication |
| JAA25KB02100 has one source photograph | Accept a one-image gallery explicitly or obtain more photographs |

The image workbook records the remaining suffix/gap flags and proposed mappings.

## Roadmap reconciliation

Keep every original task ID and original scope. Add a dated milestone-priority overlay rather than deleting future phases or ticking incomplete tasks.

- TASK-006: partial, live migrations/types exist outside Git; local setup, repository integration and reproducibility remain.
- TASK-009: user-reported deployment and variables; preview pipeline not verified.
- TASK-012 through 016: implementation evidence exists in the applied foundation and test receipt; repository/CI acceptance remains outstanding.
- TASK-017: stock ledger/function foundation exists; do not imply completed import/COD callers.
- TASK-018: earlier rolled-back test fixtures are not the persistent local seed/admin requested by this task.
- TASK-019: not done; database tests have not been wired to CI.
- TASK-023: SQL hook exists; activation and login flow remain.
- TASK-029: partial external Cloudinary setup/intake; no application media adapter.
- TASK-037: SQL guards exist; no admin publishing form.
- TASK-039 and 091: retain historical visual-work completion, add explicit client-review/link/content/data QA still open.
- TASK-040 and 041: UI prototypes exist, real data and behavior remain incomplete.

Update `docs/MEMORY.md` so its current status and next task no longer imply only setup. Preserve the historical log. Replace the obsolete Cloudflare media dependency with the Cloudinary decision, retaining separate DNS requirements only where applicable.

## Proposed first repository change

Suggested branch: `doc/storefront-review-milestone`.

Three files:

1. `TASKS.md`: dated M0-M4 priority overlay and task-status caveats, original backlog retained.
2. `docs/MEMORY.md`: accurate foundation/asset/code state, corrected media dependency, blockers and next task, existing history retained.
3. `docs/STOREFRONT-MILESTONE.md`: this plan.

Suggested commit: `docs(roadmap): prioritize client storefront review`.

This is documentation only, on a new branch, not a push to `main` or a production deployment. It does not authorize product imports, image moves/renames, new schema changes, staff setup, payments or source-code implementation. Those proceed as bounded tasks with their own tests and any required write previews.

## Client progress-payment wording

Use this only after the storefront acceptance checks actually pass:

> The storefront review milestone is ready: the homepage, catalogue and product-page experience are available for your review, with supporting page structure in place. The catalogue and inventory database foundation has been implemented. Admin workflows, checkout/payment integration and launch testing remain in progress or pending, as shown in the delivery plan.

Do not say "only payment integration remains" or "the admin is being created" as a substitute for evidence of those exact states. A credible milestone payment request is tied to approved deliverables and the agreed payment schedule; the contract and payment trigger were not available in this review.

## Evidence and limitations

- [Repository working rules](https://github.com/pranavkithkin/ar-boutique/blob/6b461b9a0312d543eafda9ac0efc41c5d2d2d9d2/AGENTS.md)
- [Original roadmap](https://github.com/pranavkithkin/ar-boutique/blob/6b461b9a0312d543eafda9ac0efc41c5d2d2d9d2/TASKS.md)
- [Project handoff](https://github.com/pranavkithkin/ar-boutique/blob/6b461b9a0312d543eafda9ac0efc41c5d2d2d9d2/docs/MEMORY.md)
- [Catalogue rules](https://github.com/pranavkithkin/ar-boutique/blob/6b461b9a0312d543eafda9ac0efc41c5d2d2d9d2/.agents/rules/catalogue.md)
- [Backend rules](https://github.com/pranavkithkin/ar-boutique/blob/6b461b9a0312d543eafda9ac0efc41c5d2d2d9d2/.agents/rules/backend.md)
- [Current PDP source](https://github.com/pranavkithkin/ar-boutique/blob/6b461b9a0312d543eafda9ac0efc41c5d2d2d9d2/app/collections/%5Bslug%5D/page.tsx)
- [Current package scripts](https://github.com/pranavkithkin/ar-boutique/blob/6b461b9a0312d543eafda9ac0efc41c5d2d2d9d2/package.json)
- [Applied foundation package and test receipt](https://u260612127.p.clickup-attachments.com/u260612127/850bb32a-b9c8-5320-a99e-bcc947a02475/AR-Boutique-Database-Foundation.zip?view=open)
- [Database handoff](https://u260612127.p.clickup-attachments.com/u260612127/0ed4fcf9-3251-53f5-b813-3880e4b41aa6/AR-Boutique-Database-Handoff.md?view=open)
- [Image inventory and mapping workbook](https://u260612127.p.clickup-attachments.com/u260612127/1b02a45b-4fd5-5b89-a95c-33444b3d7110/AR-Boutique-Image-Upload-Plan.xlsx?view=open)

Live Supabase table and migration reads reconfirmed the existing foundation. Cloudinary was inspected while uploads were still progressing; no final upload count or image-quality audit is claimed. The repository route audit was read-only, and no build, lint, browser or application test was run in this planning pass. No Git, database or Cloudinary changes were made during this review.
