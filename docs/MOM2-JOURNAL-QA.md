# MOM2 Journal validation

## Scope
Six existing files updated: header, homepage, About CTA, Journal listing, article route, homepage image regression test.
Five new files: deployment-time flag, focused route/source tests, browser regression tests, decision record, this QA record.
No product data, inventory, size chart, provider assets, Google Drive or payment code changes.

## Commands
`node --test tests/mom1-homepage-images.test.mjs tests/mom2-journal-disabled.test.mjs`

`PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/mom2-journal-disabled.spec.mjs`

## Evidence boundaries
18 focused tests passed in the sandbox on 14 October 2026. TSX transpilation is not a full strict typecheck.
Focused route tests invoke transpiled route functions with a mocked Next notFound function. They prove guard ordering and no data reads, not HTTP status from a live Next server.
The source contracts protect all five public entry points and preserved shopping content.
Browser tests are provided for real 404 responses (listing, six articles, unknown article), noindex and navigation at 375/768/1440px. They have not been run against Next in this sandbox.
Full Next.js typecheck, lint/build, real browser preview and production checks are separate gates.

## Follow-up
Review the preview and verify direct URLs before merging. Keep this branch after merge.
The supplied checklist's redirect requirement differs from the approved not-found behavior; do not silently rewrite or check it off.
