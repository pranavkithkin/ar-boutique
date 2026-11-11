# Development Rules

> The AI rulebook for this project. Antigravity reads `AGENTS.md` and `.agents/rules/*.md`, which hold the same rules split by area. When a rule changes, update both.

## General
- Use TypeScript in strict mode. No `any` without a comment explaining why.
- Reuse existing components, services and helpers before writing new ones.
- Do not duplicate logic.
- Keep functions small and single-purpose.
- Do not modify unrelated files.
- Do not add dependencies without asking. Use the libraries in ADR-021 (plus `@sentry/nextjs`, ADR-027).
- Do not change a decision in `DECISIONS.md` without approval. Propose a new ADR instead.
- If the docs don't answer a question, stop and ask. Never invent requirements.
- Work on one task from `TASKS.md` at a time.
- Spell it `colour` everywhere we name things (tables, columns, params, components, copy). Use `color` only where CSS or a library requires it.

## Before Coding
- Read `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/RULES.md`, `docs/DECISIONS.md`, `docs/MEMORY.md` and `TASKS.md`.
- Inspect the existing implementation.
- Reuse existing functionality where possible.
- For large changes, write a plan and wait for approval.
- Confirm the task's acceptance criteria and the tests you'll add.

## Architecture
- UI components never call Supabase, Stripe, Resend or R2 directly.
- Database and third-party calls live in `src/services/*` (server only).
- Every Server Action and Route Handler: check auth -> validate input with Zod -> call a service -> return a typed result.
- Orders, stock, returns and refunds change only through Postgres functions.
- Server Components by default. Add `"use client"` only when needed.
- Keep business logic out of components.

## Data and Auth
- Refund authorization overrides the MFA requirement below: a verified signed-in, active admin may refund without 2FA (ADR-040).
- Customers: `requireCustomer()` (Clerk `auth()`). Admins: `requireAdmin()` (Supabase `getClaims()`, `aal2`, active admin).
- Never use `auth.uid()` in RLS policies. Compare `auth.jwt()->>'sub'` as text.
- Every new table gets RLS, policies and tests in `supabase/tests`.
- The secret (service-role) key is only for webhooks, cron jobs and PDF generation.
- Add new migrations; never edit an applied one.
- Regenerate database types after schema changes (`npm run db:types`).

## Catalogue, Payments and Stock
- A product has colourways; each colourway has SKUs, usually one per size (`product_variants` rows). Cart lines, holds, order lines, returns and stock changes always reference the SKU.
- The client's data is used exactly as written (ADR-029). Never generate, suggest, tidy or fix SKUs, style codes, names, details, descriptions or prices. If something looks wrong, return an error or a warning with the row; never change the value.
- Price and compare-at price live on the SKU. Style code and details live on the colourway.
- Photos belong to a product colour. Never attach photos to a size or directly to a product.
- SKUs: the client's, exactly as written (no capitals forced), unique ignoring letter case, checked (never generated) by `src/lib/sku.ts`, locked once sold. Deactivate SKUs with history; never delete or reuse them.
- Stock sheet upload: the preview never writes; `apply_catalogue_import()` applies all rows or none; an empty cell changes nothing; SKUs missing from the sheet are never deleted or zeroed.
- Never send stock counts to the browser. Use `variant_availability()` statuses.
- Never mark a card order paid outside the Stripe webhook. A COD order is paid only through the admin's cash-collected action.
- COD orders are placed only through `place_cod_order()`, which re-checks eligibility, prices, fee and stock. COD stock is deducted at Shipped.
- Never trust prices, totals or stock from the browser.
- Money is integer fils. Format it only in the UI with `formatAED()`.
- Use idempotency keys for Stripe writes. Webhooks must be safe to replay.
- Never restock automatically.

## Media
- Use `src/services/media` only. Store keys, never URLs.
- Product photos are uploaded into the colour's folder (`products/{productId}/{productColourId}/`).
- Admin photos: the original goes to the private bucket; sharp makes the WebP copies into the public bucket, once, at upload. Every upload gets a new key.
- Return photos stay in the private bucket and are shown only through 1-hour signed links.
- Check every upload's size and type on the server after it lands in R2.

## UI
- Follow `DESIGN.md`. Use shadcn/ui primitives from `src/components/ui`.
- Use theme tokens only: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `bg-secondary`, `bg-accent`, `border-border`, `border-input`, `font-heading`, `font-sans`. No hex codes, arbitrary colour values or font names in components (`npm run check:tokens` fails on them).
- Never hand-edit files in `src/components/ui/`. Compose or wrap them in our own components, because a preset apply can reinstall them.
- Keep every screen responsive (375 / 768 / 1440).
- Include loading, error and empty states.
- Make it accessible: labels, keyboard support, visible focus, alt text.
- Use `next/image` with our media loader (`src/lib/media-loader.ts`). Files in `public/` use `unoptimized`.

## Errors and Monitoring
- Return expected errors (validation, sold out, not allowed) to the UI as typed results. Don't report them to Sentry.
- Report unexpected errors to Sentry with IDs as tags (`order_id`, `return_id`, `refund_id`, `job`), never names, emails, phone numbers or addresses.
- Use `Sentry.logger` for key business events. Never `console.log` personal data.
- Never show stack traces or internal details to users.

## Security
- Never expose API keys. Only `NEXT_PUBLIC_*` values may reach the browser.
- Validate all user input with Zod.
- Verify authorization on the server, every time.
- Follow `SECURITY.md` for uploads, webhooks, headers and monitoring.

## Testing
- Add tests for important functionality (see `TEST_PLAN.md`).
- After implementing, run `npm run typecheck`, `npm run lint`, `npm run check:tokens`, `npm test` and the relevant DB, integration or E2E tests.
- Fix failing tests before continuing.
- Every bug fix gets a test that would have caught it.

## Git
- Branch names, commit messages and pull requests follow `.agents/rules/git.md`. Never run git commands unless asked in that message.
- Never commit `.env*` files except `.env.example`.

## After Each Task
Report:
1. Files changed
2. What was implemented
3. Tests executed
4. Remaining issues

Then mark the task done in `TASKS.md` and update `docs/MEMORY.md`.
