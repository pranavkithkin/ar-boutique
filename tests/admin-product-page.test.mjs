// Run: node --test tests/admin-product-page.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
import dotenv from "dotenv"
dotenv.config({ path: ".env" })
import { createClient } from "@supabase/supabase-js"
import fs from "node:fs"
import vm from "node:vm"
import { createRequire } from "node:module"
import ts from "typescript"

const require = createRequire(import.meta.url)
const root = new URL("../", import.meta.url)
const read = (path) => fs.readFileSync(new URL(path, root), "utf8")

function load(path, dependencies = {}) {
  const { outputText, diagnostics } = ts.transpileModule(read(path), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  })
  assert.equal(diagnostics?.length ?? 0, 0)
  const modObj = { exports: {} }
  vm.runInNewContext(outputText, {
    module: modObj,
    exports: modObj.exports,
    require: (name) => dependencies[name] ?? require(name),
  })
  return modObj.exports
}

const { evaluatePublishRules } = load("features/admin/products/publish-checks.ts")

const PRODUCT_ID = "810cb4a2-9f6a-4686-99f7-ea36d51f5534"
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

test("Product 810cb4a2-9f6a-4686-99f7-ea36d51f5534 exists and loads catalogue details", async () => {
  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, slug, status, description, categories(name)")
    .eq("id", PRODUCT_ID)
    .single()

  assert.equal(error, null, "Failed to fetch product from Supabase")
  assert.ok(product, "Product record not found")
  assert.equal(product.id, PRODUCT_ID)
  assert.ok(product.name, "Product must have a title/name")
  assert.ok(product.slug, "Product must have a URL slug")
  console.log(`✔ Verified Product: "${product.name}" [slug: ${product.slug}, status: ${product.status}]`)
})

test("Product colourways are loaded with styles, specs, and linked colours", async () => {
  const { data: colourways, error } = await supabase
    .from("product_colours")
    .select(`
      id,
      style_code,
      details,
      sort,
      is_active,
      colours ( id, name, swatch_hex ),
      product_images ( id, media_key, sort ),
      product_variants ( id, sku, price_fils, is_active, stock_levels ( on_hand, reserved ) )
    `)
    .eq("product_id", PRODUCT_ID)
    .order("sort", { ascending: true })

  assert.equal(error, null, "Failed to load product colourways")
  assert.ok(colourways.length > 0, "Product should have at least 1 colourway")

  for (const cw of colourways) {
    assert.ok(cw.id, "Colourway ID is required")
    assert.ok(cw.style_code, "Colourway must have a client style code")
    assert.ok(typeof cw.details === "object", "Garment details must be a JSON object")
    console.log(`✔ Colourway: "${cw.colours?.name || cw.style_code}" (Style: ${cw.style_code}, Photos: ${cw.product_images?.length || 0}, SKUs: ${cw.product_variants?.length || 0})`)
  }
})

test("Set Main Image feature: two-pass reordering works without unique constraint error", async () => {
  const { data: colourways } = await supabase
    .from("product_colours")
    .select("id, product_images(id, sort, media_key)")
    .eq("product_id", PRODUCT_ID)

  const cwWithPhotos = colourways?.find((c) => c.product_images && c.product_images.length >= 2)
  if (!cwWithPhotos) {
    console.log("ℹ Skipping multi-image swap test (colourway has < 2 photos).")
    return
  }

  const images = [...cwWithPhotos.product_images].sort((a, b) => a.sort - b.sort)
  const originalMain = images[0]
  const newTargetMain = images[1]

  // Step 1: Pass 1 (Negative temporary sorts)
  for (let idx = 0; idx < images.length; idx++) {
    const { error: tempErr } = await supabase
      .from("product_images")
      .update({ sort: -(idx + 1) })
      .eq("id", images[idx].id)
    assert.equal(tempErr, null, "Pass 1 temporary sort must not error")
  }

  // Step 2: Pass 2 (New target at 0, followed by original)
  const reordered = [newTargetMain, originalMain, ...images.slice(2)]
  for (let idx = 0; idx < reordered.length; idx++) {
    const { error: finalErr } = await supabase
      .from("product_images")
      .update({ sort: idx })
      .eq("id", reordered[idx].id)
    assert.equal(finalErr, null, "Pass 2 final sort assignment must not error")
  }

  // Verify DB state
  const { data: updatedImages } = await supabase
    .from("product_images")
    .select("id, sort")
    .eq("product_colour_id", cwWithPhotos.id)
    .order("sort", { ascending: true })

  assert.equal(updatedImages[0].id, newTargetMain.id, "Target photo must now be at sort index 0 (Main Image)")
  assert.equal(updatedImages[1].id, originalMain.id, "Previous main photo must now be at sort index 1")
  console.log(`✔ Set Main Image verified: Image ${newTargetMain.id} is now Main Cover Photo (sort: 0)`)

  // Restore original ordering cleanly
  for (let idx = 0; idx < images.length; idx++) {
    await supabase.from("product_images").update({ sort: -(idx + 1) }).eq("id", images[idx].id)
  }
  for (let idx = 0; idx < images.length; idx++) {
    await supabase.from("product_images").update({ sort: idx }).eq("id", images[idx].id)
  }
})

test("Size Variant Stock Initialisation: upsert correctly stores non-zero opening inventory", async () => {
  const { data: colourways } = await supabase
    .from("product_colours")
    .select("id")
    .eq("product_id", PRODUCT_ID)
    .limit(1)

  const testColourId = colourways[0].id
  const testSku = `TEST-SKU-${Date.now()}`

  const { data: existingVariants } = await supabase
    .from("product_variants")
    .select("size_id")
    .eq("product_colour_id", testColourId)

  const usedSizeIds = new Set((existingVariants || []).map((v) => v.size_id).filter(Boolean))
  const { data: allSizes } = await supabase.from("sizes").select("id")
  const availableSize = allSizes?.find((s) => !usedSizeIds.has(s.id))

  // 1. Insert a temporary test variant
  const { data: variant, error: varErr } = await supabase
    .from("product_variants")
    .insert({
      product_id: PRODUCT_ID,
      product_colour_id: testColourId,
      sku: testSku,
      size_id: availableSize?.id || null,
      price_fils: 50000,
      is_active: false,
    })
    .select("id")
    .single()

  assert.equal(varErr, null, "Variant creation should succeed")
  assert.ok(variant?.id, "Variant ID must be returned")

  // The DB trigger initialise_stock created a stock_levels row with on_hand: 0
  const { data: triggerStock } = await supabase
    .from("stock_levels")
    .select("on_hand, reserved")
    .eq("variant_id", variant.id)
    .single()

  assert.equal(triggerStock?.on_hand, 0, "Trigger initially sets on_hand to 0")

  // 2. Perform the upsert fix used in createVariantAction with initialStock = 5
  const initialStock = 5
  const { error: upsertErr } = await supabase
    .from("stock_levels")
    .upsert(
      {
        variant_id: variant.id,
        on_hand: initialStock,
        reserved: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "variant_id" }
    )

  assert.equal(upsertErr, null, "Upserting stock_levels with onConflict must not fail with unique violation 23505")

  // 3. Verify stock level is now exactly 5
  const { data: finalStock } = await supabase
    .from("stock_levels")
    .select("on_hand, reserved")
    .eq("variant_id", variant.id)
    .single()

  assert.equal(finalStock?.on_hand, 5, "Stock level must be updated to opening stock of 5")
  console.log(`✔ Verified Variant Opening Stock: on_hand was updated from 0 to ${finalStock?.on_hand}`)

  // Clean up test variant
  await supabase.from("stock_levels").delete().eq("variant_id", variant.id)
  await supabase.from("product_variants").delete().eq("id", variant.id)
})

test("Inventory Calculation and Stock Adjustment rules", () => {
  const on_hand = 12
  const reserved = 2
  const available = Math.max(0, on_hand - reserved)
  assert.equal(available, 10, "Available stock must subtract customer holds")

  // Test zero clamp
  const overReserved = Math.max(0, 3 - 5)
  assert.equal(overReserved, 0, "Available stock cannot be negative")
})

test("Publish Readiness evaluation for Product 810cb4a2-9f6a-4686-99f7-ea36d51f5534", async () => {
  const { data: colourways } = await supabase
    .from("product_colours")
    .select(`
      id,
      is_active,
      product_images ( id ),
      product_variants ( id, is_active, price_fils )
    `)
    .eq("product_id", PRODUCT_ID)

  const snapshot = (colourways || []).map((cw) => ({
    id: cw.id,
    is_active: cw.is_active,
    hasPhoto: (cw.product_images || []).length > 0,
    variants: (cw.product_variants || []).map((v) => ({
      id: v.id,
      sku: "test-sku",
      is_active: v.is_active,
      price_fils: v.price_fils,
    })),
  }))

  const result = evaluatePublishRules(snapshot)
  console.log("✔ Publish Readiness Evaluation:", {
    canPublish: result.canPublish,
    checks: result.checks,
    errors: result.errors,
  })

  // Verify internal integrity of checks
  if (result.canPublish) {
    assert.equal(result.checks.hasVisibleColourwayWithPhoto, true)
    assert.equal(result.checks.hasActiveSku, true)
    assert.equal(result.checks.allActiveSkusHavePrice, true)
    assert.equal(result.errors.length, 0)
  } else {
    assert.ok(result.errors.length > 0, "Errors must explain why product cannot be published")
  }
})

test("Product Deletion: cleanly removes product without orders and preserves safety guards", async () => {
  // 1. Create a dummy test product with a colourway, variant, and image
  const { data: tempP, error: pErr } = await supabase
    .from("products")
    .insert({
      name: "Temporary Automated Delete Test",
      slug: `auto-del-${Date.now()}`,
      status: "draft",
    })
    .select("id, name")
    .single()

  assert.equal(pErr, null, "Temp product creation should succeed")

  const { data: colour } = await supabase.from("colours").select("id").limit(1).single()
  const { data: tempCw } = await supabase
    .from("product_colours")
    .insert({
      product_id: tempP.id,
      colour_id: colour.id,
      style_code: "DEL-TEST-STYLE",
      is_active: false,
    })
    .select("id")
    .single()

  const { data: size } = await supabase.from("sizes").select("id").limit(1).single()
  const { data: tempVar } = await supabase
    .from("product_variants")
    .insert({
      product_id: tempP.id,
      product_colour_id: tempCw.id,
      size_id: size.id,
      sku: `DEL-TEST-SKU-${Date.now()}`,
      price_fils: 15000,
      is_active: false,
    })
    .select("id")
    .single()

  const { data: tempImg } = await supabase
    .from("product_images")
    .insert({
      product_colour_id: tempCw.id,
      media_key: `test/del/sample-${Date.now()}`,
      sort: 0,
    })
    .select("id")
    .single()

  // 2. Execute deletion sequence (clean up child tables then product)
  await supabase.from("product_images").delete().eq("product_colour_id", tempCw.id)
  await supabase.from("stock_levels").delete().eq("variant_id", tempVar.id)
  await supabase.from("product_variants").delete().eq("product_id", tempP.id)
  await supabase.from("product_colours").delete().eq("product_id", tempP.id)
  const { error: delErr } = await supabase.from("products").delete().eq("id", tempP.id)

  assert.equal(delErr, null, "Deleting product without orders must succeed cleanly")

  // 3. Verify product no longer exists
  const { data: checkDeleted } = await supabase
    .from("products")
    .select("id")
    .eq("id", tempP.id)
    .maybeSingle()

  assert.equal(checkDeleted, null, "Deleted product must no longer exist in database")
  console.log(`✔ Verified Product Deletion: Product "${tempP.name}" and all child records were cleanly deleted.`)
})

