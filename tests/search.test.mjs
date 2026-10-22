import test from "node:test"
import assert from "node:assert/strict"
import { formatAED } from "../lib/money.ts"

// Mock product catalogue fixture matching Supabase schema
const mockProducts = [
  {
    id: "prod-1",
    name: "Set AR0478",
    slug: "set-j0478",
    categories: { name: "Set", slug: "set" },
    product_colours: [
      {
        id: "cw-1",
        style_code: "J0478",
        colours: { name: "Sea green" },
        product_images: [{ media_key: "products/set-1/img1", sort: 0 }],
        product_variants: [
          { id: "var-1", price_fils: 15800, is_active: true },
          { id: "var-2", price_fils: 15800, is_active: true },
        ],
      },
    ],
  },
  {
    id: "prod-2",
    name: "Kurta AR4124",
    slug: "kurta-jne4124",
    categories: { name: "Kurta", slug: "kurta" },
    product_colours: [
      {
        id: "cw-2",
        style_code: "JNE4124",
        colours: { name: "Wine" },
        product_images: [{ media_key: "products/kurta-2/img1", sort: 0 }],
        product_variants: [
          { id: "var-3", price_fils: 11000, is_active: true },
        ],
      },
    ],
  },
  {
    id: "prod-3",
    name: "Dress AR0395",
    slug: "dress-j0395",
    categories: { name: "Dress", slug: "dress" },
    product_colours: [
      {
        id: "cw-3",
        style_code: "J0395",
        colours: { name: "Powder Blue" },
        product_images: [{ media_key: "products/dress-3/img1", sort: 0 }],
        product_variants: [
          { id: "var-4", price_fils: 12500, is_active: true },
        ],
      },
    ],
  },
]

// Pure matching algorithm mirroring features/search/actions.ts
function matchProducts(products, query) {
  const sanitized = (query || "").trim().toLowerCase()
  if (!sanitized) return []

  const results = []

  for (const product of products) {
    let matched = false
    let score = 0

    const lowerName = (product.name || "").toLowerCase()
    const lowerCategory = (product.categories?.name || "").toLowerCase()
    const primaryCw = product.product_colours?.[0]
    const lowerStyle = (primaryCw?.style_code || "").toLowerCase()
    const lowerColour = (primaryCw?.colours?.name || "").toLowerCase()

    if (lowerName === sanitized) {
      score += 100
      matched = true
    } else if (lowerName.startsWith(sanitized)) {
      score += 70
      matched = true
    } else if (lowerName.includes(sanitized)) {
      score += 50
      matched = true
    }

    if (lowerStyle && lowerStyle.includes(sanitized)) {
      score += 60
      matched = true
    }

    for (const cw of product.product_colours || []) {
      if (cw.style_code && cw.style_code.toLowerCase().includes(sanitized)) {
        score += 45
        matched = true
        break
      }
      if (cw.colours?.name && cw.colours.name.toLowerCase().includes(sanitized)) {
        score += 35
        matched = true
        break
      }
    }

    if (lowerCategory && lowerCategory.includes(sanitized)) {
      score += 40
      matched = true
    }

    if (lowerColour && lowerColour.includes(sanitized)) {
      score += 30
      matched = true
    }

    if (matched) {
      const activeVars = (primaryCw?.product_variants || []).filter((v) => v.is_active)
      const priceFils = activeVars.length > 0
        ? Math.min(...activeVars.map((v) => v.price_fils))
        : 0

      results.push({
        score,
        item: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          categoryName: product.categories?.name,
          styleCode: primaryCw?.style_code,
          colourName: primaryCw?.colours?.name,
          priceFils,
          formattedPrice: formatAED(priceFils),
          href: `/collections/${product.slug}`,
        },
      })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.map((r) => r.item)
}

test("search: matches products by full or partial name", () => {
  const res = matchProducts(mockProducts, "Kurta")
  assert.equal(res.length, 1)
  assert.equal(res[0].name, "Kurta AR4124")
  assert.equal(res[0].formattedPrice, "AED 110")
})

test("search: matches products by client style code", () => {
  const res = matchProducts(mockProducts, "J0478")
  assert.equal(res.length, 1)
  assert.equal(res[0].name, "Set AR0478")
  assert.equal(res[0].styleCode, "J0478")
})

test("search: matches products by colour name", () => {
  const res = matchProducts(mockProducts, "Sea green")
  assert.equal(res.length, 1)
  assert.equal(res[0].name, "Set AR0478")
  assert.equal(res[0].colourName, "Sea green")
})

test("search: matches products by category", () => {
  const res = matchProducts(mockProducts, "Dress")
  assert.equal(res.length, 1)
  assert.equal(res[0].name, "Dress AR0395")
  assert.equal(res[0].categoryName, "Dress")
})

test("search: case-insensitive and trims whitespace", () => {
  const res = matchProducts(mockProducts, "   sEa GrEeN  ")
  assert.equal(res.length, 1)
  assert.equal(res[0].name, "Set AR0478")
})

test("search: empty query returns empty array", () => {
  const res = matchProducts(mockProducts, "   ")
  assert.equal(res.length, 0)
})
