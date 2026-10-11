import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { footerNavigation, isNavigationCurrent, mainNavigation, previewPageMetadata, previewPages } from "../../features/content/preview-pages";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const entries = Object.entries(previewPages);

 describe("supporting-page content contract", () => {
  it("covers exactly the eight approved destinations", () => {
    expect(entries.map(([, page]) => page.href).sort()).toEqual([
      "/about", "/contact", "/journal", "/policies/shipping",
      "/policies/returns", "/policies/terms", "/policies/privacy", "/size-guide",
    ].sort());
  });

  it.each(entries)("keeps %s contextual, routed and explicitly unapproved", (key, page) => {
    expect(page.title.length).toBeGreaterThan(3);
    expect(page.summary).toMatch(/awaiting|no published articles/i);
    expect(page.pending.length).toBeGreaterThan(0);
    expect(new Set(page.pending).size).toBe(page.pending.length);
    const route = read(`app${page.href}/page.tsx`);
    expect(route).toContain(`previewPages.${key}`);
    expect(route).toContain(`previewPageMetadata("${key}")`);
    expect(previewPageMetadata(key as keyof typeof previewPages).robots).toEqual({ index: false, follow: false });
  });

  it("does not invent contact details, measurements or policy promises", () => {
    const content = JSON.stringify(previewPages);
    expect(content).not.toMatch(/mailto:|tel:|https?:|@\w|\+\d{2,}|\b\d+\s*(days?|hours?|cm|inches|AED)\b/i);
    expect(content).not.toMatch(/free delivery|secure payments|easy returns/i);
  });

  it("routes every navigation link to an implemented page", () => {
    const links = [...mainNavigation, ...footerNavigation.flatMap((group) => group.links)];
    for (const { href, label } of links) {
      expect(label.length).toBeGreaterThan(0);
      expect(href).not.toMatch(/#|\/account|\/cart|\/checkout/);
      expect(existsSync(resolve(process.cwd(), `app${href === "/" ? "" : href}/page.tsx`))).toBe(true);
    }
  });

  it("covers every supporting page in the footer", () => {
    const paths = footerNavigation.flatMap((group) => group.links.map((link) => link.href));
    for (const [, page] of entries) expect(paths).toContain(page.href);
  });

  it.each([
    ["/", "/", true], ["/about", "/", false],
    ["/collections", "/collections", true],
    ["/collections/jaa25cd01945", "/collections", true],
    ["/collections-other", "/collections", false],
    [null, "/collections", false],
  ] as const)("matches navigation %s against %s", (pathname, href, expected) => {
    expect(isNavigationCurrent(pathname, href)).toBe(expected);
  });
});

 describe("preview shell source regressions (not browser QA)", () => {
  it.each(["app/page.tsx", "app/collections/page.tsx", "app/collections/[slug]/page.tsx", "app/not-found.tsx", "components/store/ComingSoon.tsx"])(
    "%s uses one shared shell and an accessible skip target", (path) => {
      const text = read(path);
      expect(text).toContain("<StoreHeader />");
      expect(text).toContain("<StoreFooter />");
      expect(text).toContain('id="main-content" tabIndex={-1}');
      expect(text).not.toMatch(/PreviewHeader|PreviewFooter/);
    },
  );

  it("keeps a labelled mobile menu, active links and no dead commerce controls", () => {
    const text = read("components/store/StoreHeader.tsx");
    expect(text).toContain('href="#main-content"');
    expect(text).toContain("<SheetTitle");
    expect(text).toContain("aria-current=");
    expect(text).toContain("setOpen(false)");
    expect(text).not.toMatch(/href="\/(account|cart|checkout)"|aria-label="Search"/);
  });

  it("removes unapproved trust/payment claims from the displayed footer", () => {
    expect(read("components/store/StoreFooter.tsx")).not.toMatch(/TrustStrip|VISA|MASTERCARD|APPLE PAY|free delivery|easy returns/i);
  });

  it("renders links through the button primitive, not nested interactive controls", () => {
    for (const path of ["components/store/ComingSoon.tsx", "app/not-found.tsx"]) {
      const text = read(path);
      expect(text).toContain('nativeButton={false} render={<Link');
      expect(text).not.toMatch(/<Link[^>]*>\s*<StoreButton/);
      expect(text).toContain("<h1");
    }
  });

  it("removes the duplicate shell from the catalogue grid", () => {
    expect(read("features/catalog/components/CatalogueGrid.tsx")).not.toMatch(/function PreviewHeader|function PreviewFooter/);
  });

  it("inherits noindex for review-only supporting routes", () => {
    expect(read("app/layout.tsx")).toContain("robots: { index: false, follow: false }");
  });

  it("has no encoding damage or hard-coded colour literals in shared content", () => {
    for (const path of ["components/store/ComingSoon.tsx", "components/store/StoreHeader.tsx", "components/store/StoreFooter.tsx", "app/not-found.tsx"]) {
      expect(read(path)).not.toMatch(/â€|Â©|#[0-9a-fA-F]{3,8}\b|(?:bg|text|border)-(?:black|white)/);
    }
  });
});
