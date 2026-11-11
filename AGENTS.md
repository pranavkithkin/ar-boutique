Rules for AI coding agents working on AR Boutique. The full rulebook is `docs/RULES.md`. When a rule changes, update both.

## Project docs
- What and why: `docs/PRD.md`
- How: `docs/ARCHITECTURE.md`
- Look and feel: `docs/DESIGN.md`
- Decisions (don't change without approval): `docs/DECISIONS.md`
- Current state: `docs/MEMORY.md`
- Tasks: `TASKS.md`
- Tests: `docs/TEST_PLAN.md`
- Security: `docs/SECURITY.md`

## Rules by area
Each file in `.agents/rules/` is always on. Read the ones for the files you touch.
- `.agents/rules/frontend.md`: pages, components, shadcn, product page, checkout UI
- `.agents/rules/backend.md`: services, actions, auth, database, payments, cash on delivery, media, email, errors
- `.agents/rules/catalogue.md`: products, colourways, SKUs, stock, the client's data, stock sheet upload
- `.agents/rules/testing.md`: what to test and how
- `.agents/rules/git.md`: branch names, commit messages, pull requests
- New rules go in a new file in `.agents/rules/` (frontmatter `trigger: always_on`), not here. Keep every file under 12,000 characters.

## Commands
- `npm run dev`: start the dev server
- `npm run typecheck`, `npm run lint`, `npm run check:tokens`: static checks
- `npm test`: unit tests (Vitest)
- `npm run test:db`: RLS and Postgres function tests (pgTAP)
- `npm run test:integration`: webhooks with local Supabase + Stripe CLI
- `npm run test:e2e`: end-to-end tests (Playwright)
- `npm run db:reset`, `npm run db:types`: reset the local database, regenerate types

## Always
- Refund authorization: a verified signed-in, active admin may refund without 2FA (ADR-040).
- Read the relevant docs and inspect the existing code before changing anything.
- Work on one task from `TASKS.md` at a time. For large changes, write a plan and wait for approval.
- TypeScript strict. Reuse existing components, services and helpers. Don't duplicate logic.
- Keep functions small. Don't modify unrelated files.
- Don't add dependencies without asking (approved libraries: ADR-021, plus `@sentry/nextjs` from ADR-027; `exceljs` is proposed in ADR-036; `cloudinary` from ADR-038).
- If the docs don't answer something, stop and ask. Never invent requirements.
- Never expose secrets. Only `NEXT_PUBLIC_*` values may reach the browser.
- Spell it `colour` in names and copy; `color` only where CSS or a library requires it.
- Never generate, suggest or change the client's SKUs, style codes or any value from their stock sheet. Use them exactly as given (ADR-029).
- Never run git commands unless I ask in that message (`.agents/rules/git.md`).

## After each task, report
1. Files changed
2. What was implemented
3. Tests executed
4. Remaining issues
5. A suggested commit message (don't commit)

Then mark the task done in `TASKS.md` and update `docs/MEMORY.md`.
