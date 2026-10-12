// Node 22.18+ / Node 24: node --test tests/mom1-menu-categories.test.mjs
// Uses the installed Zod dependency. All database requests are mocked.
import { afterEach, test } from "node:test"
import assert from "node:assert/strict"
import { GET } from "../app/api/categories/route.ts"

const realFetch = globalThis.fetch
const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const category = (index, overrides = {}) => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  name: `Category ${index}`,
  slug: `category-${index}`,
  sort: index,
  is_active: true,
  ...overrides,
})
function configure() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-public-key"
}
afterEach(() => {
  globalThis.fetch = realFetch
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
  if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey
})

test("reads active categories in database order with only the public key", async () => {
  configure()
  const source = [category(2, { name: "Co-ord set", slug: "co-ord-set", sort: 1 }), category(1, { name: "Dress", slug: "dress", sort: 2 })]
  globalThis.fetch = async (input, options) => {
    const url = new URL(input)
    assert.equal(url.pathname, "/rest/v1/categories")
    assert.equal(url.searchParams.get("is_active"), "eq.true")
    assert.equal(url.searchParams.get("order"), "sort.asc,name.asc,id.asc")
    assert.equal(url.searchParams.get("select"), "id,name,slug,sort,is_active")
    assert.equal(options.cache, "no-store")
    assert.deepEqual(options.headers, { apikey: "test-public-key", Accept: "application/json" })
    assert.equal(options.method, undefined)
    assert.ok(options.signal instanceof AbortSignal)
    return Response.json(source)
  }
  const response = await GET()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("Cache-Control"), "no-store")
  assert.deepEqual(await response.json(), { categories: source.map(({ id, name, slug }) => ({ id, name, slug })) })
})

test("does not return hidden records or duplicate IDs", async () => {
  configure()
  globalThis.fetch = async () => Response.json([category(1), category(2, { is_active: false }), category(1)])
  const result = await (await GET()).json()
  assert.deepEqual(result.categories, [{ id: category(1).id, name: "Category 1", slug: "category-1" }])
})

test("preserves exact names and supports an empty catalogue", async () => {
  configure()
  globalThis.fetch = async () => Response.json([category(1, { name: "Co-ord set & occasion / wear" })])
  assert.equal((await (await GET()).json()).categories[0].name, "Co-ord set & occasion / wear")
  globalThis.fetch = async () => Response.json([])
  const response = await GET()
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { categories: [] })
})

test("reflects additions, renames, reordering and hiding on the next read", async () => {
  configure()
  let rows = [category(1)]
  globalThis.fetch = async () => Response.json(rows)
  assert.equal((await (await GET()).json()).categories[0].name, "Category 1")
  rows = [category(2), category(1, { name: "Renamed category", slug: "renamed" })]
  assert.deepEqual((await (await GET()).json()).categories.map((row) => row.slug), ["category-2", "renamed"])
  rows = [category(1, { is_active: false })]
  assert.deepEqual((await (await GET()).json()).categories, [])
})

test("paginates beyond the first response rather than truncating categories", async () => {
  configure()
  const offsets = []
  globalThis.fetch = async (input) => {
    const offset = Number(new URL(input).searchParams.get("offset"))
    offsets.push(offset)
    return Response.json(offset === 0 ? Array.from({ length: 500 }, (_, i) => category(i + 1)) : [category(501)])
  }
  const result = await (await GET()).json()
  assert.equal(result.categories.length, 501)
  assert.deepEqual(offsets, [0, 500])
})

test("missing or invalid environment configuration fails closed without fetching", async () => {
  configure()
  let called = false
  globalThis.fetch = async () => { called = true; throw new Error("Must not fetch") }
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  assert.equal((await GET()).status, 503)
  configure()
  process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url"
  assert.equal((await GET()).status, 503)
  assert.equal(called, false)
})

for (const [label, mock] of [
  ["upstream HTTP errors", async () => new Response("private upstream detail", { status: 500 })],
  ["network errors", async () => { throw new Error("private network detail") }],
  ["malformed JSON", async () => new Response("not-json", { status: 200 })],
  ["invalid category shapes", async () => Response.json([{ name: "Missing id" }])],
]) {
  test(`${label} return only a generic retryable error`, async () => {
    configure()
    globalThis.fetch = mock
    const response = await GET()
    assert.equal(response.status, 503)
    assert.equal(response.headers.get("Cache-Control"), "no-store")
    assert.deepEqual(await response.json(), { error: "Categories are temporarily unavailable." })
  })
}
