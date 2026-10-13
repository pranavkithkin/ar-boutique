// node --test tests/mom2-journal-disabled.test.mjs
// Source contracts and route-function tests, not live Next.js HTTP checks.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"

const require = createRequire(import.meta.url)
const root = new URL("../", import.meta.url)
const read = (path) => readFileSync(new URL(path, root), "utf8")
const sentinel = new Error("NEXT_NOT_FOUND_TEST")
let dataReads = 0

function compile(path) {
  const result = ts.transpileModule(read(path), {
    fileName: path,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  })
  assert.equal(result.diagnostics?.length ?? 0, 0)
  const exports = {}
  vm.runInNewContext(result.outputText, {
    exports,
    require: (name) => {
      if (name === "@/lib/journal") return { JOURNAL_ENABLED: false }
      if (name === "next/navigation") return { notFound: () => { throw sentinel } }
      if (name === "@/features/blog/data") {
        return new Proxy({}, { get: () => () => { dataReads++; throw new Error("Blog data read while disabled") } })
      }
      if (name.startsWith("@/") || name.startsWith("next/") || name === "lucide-react") return {}
      return require(name)
    },
  })
  return exports
}

const listing = compile("app/journal/page.tsx")
const article = compile("app/journal/[slug]/page.tsx")

test("Journal defaults to disabled and is not controlled by a URL or browser setting", () => {
  assert.match(read("lib/journal.ts"), /export const JOURNAL_ENABLED: boolean = false/)
  assert.doesNotMatch(read("lib/journal.ts"), /process\.env|localStorage|searchParams/)
})

test("listing returns not-found before reading any article data", () => {
  assert.throws(() => listing.default(), (error) => error === sentinel)
  assert.equal(dataReads, 0)
})

test("disabled listing metadata is not indexable and has no editorial description", () => {
  assert.equal(listing.metadata.robots.index, false)
  assert.equal(listing.metadata.robots.follow, false)
  assert.equal(listing.metadata.description, undefined)
})

test("disabled Journal generates no static article paths", async () => {
  assert.equal((await article.generateStaticParams()).length, 0)
  assert.equal(dataReads, 0)
})

const slugs = [
  "poetry-of-handcrafted-zardozi",
  "how-to-transition-your-wardrobe-for-the-new-season",
  "the-making-of-our-latest-collection",
  "effortless-looks-for-your-festive-getaway",
  "the-architecture-of-silhouette",
  "sustainable-elegance-natural-weaves",
  "unknown-article",
]

for (const slug of slugs) {
  test(`article and metadata are blocked: ${slug}`, async () => {
    const props = { params: Promise.resolve({ slug }) }
    await assert.rejects(article.default(props), (error) => error === sentinel)
    await assert.rejects(article.generateMetadata(props), (error) => error === sentinel)
    assert.equal(dataReads, 0)
  })
}

test("header, homepage and About gate every public Journal entry point", () => {
  const header = read("components/store/StoreHeader.tsx")
  assert.equal((header.match(/\{JOURNAL_ENABLED && <Link href="\/journal"/g) ?? []).length, 2)
  assert.equal((header.match(/href="\/journal"/g) ?? []).length, 2)
  for (const path of ["app/page.tsx", "app/about/page.tsx"]) {
    const source = read(path)
    const guard = source.indexOf("{JOURNAL_ENABLED && (")
    const firstLink = source.indexOf('href="/journal"')
    assert.ok(guard >= 0 && firstLink > guard, path)
  }
  assert.match(read("app/page.tsx"), /\{JOURNAL_ENABLED && \(\s*<AnimatedSection/)
  assert.doesNotMatch(read("components/store/StoreFooter.tsx"), /href=["'`]\/journal/)
})

test("catalogue, hero, promo and About copy remain in place", () => {
  const home = read("app/page.tsx")
  assert.match(home, /<HeroSlider \/>/)
  assert.match(home, /getProductsPage\(\{\s*limit: 10,\s*sort: "newest",/)
  assert.match(home, /imageSrc="\/images\/promo_banner_summer\.png"/)
  assert.match(read("app/about/page.tsx"), /A Family Legacy of Fine Textiles/)
})
