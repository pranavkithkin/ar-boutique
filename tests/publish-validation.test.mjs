// Run: node --test tests/publish-validation.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
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

test("fails when a product has no colourways at all", () => {
  const res = evaluatePublishRules([])
  assert.equal(res.canPublish, false)
  assert.equal(res.checks.hasVisibleColourwayWithPhoto, false)
  assert.equal(res.checks.hasActiveSku, false)
  assert.equal(res.checks.allActiveSkusHavePrice, true) // no active skus missing price
  assert.equal(res.errors.length, 2)
})

test("fails when colourway is inactive even if it has a photo", () => {
  const res = evaluatePublishRules([
    {
      id: "cw-1",
      is_active: false,
      hasPhoto: true,
      variants: [{ id: "v-1", sku: "AR-001", is_active: true, price_fils: 15000 }],
    },
  ])
  assert.equal(res.canPublish, false)
  assert.equal(res.checks.hasVisibleColourwayWithPhoto, false)
  assert.equal(res.checks.hasActiveSku, true)
  assert.equal(res.checks.allActiveSkusHavePrice, true)
  assert.match(res.errors[0], /at least one visible colourway with at least one uploaded photo/i)
})

test("fails when visible colourway has no uploaded photo", () => {
  const res = evaluatePublishRules([
    {
      id: "cw-1",
      is_active: true,
      hasPhoto: false,
      variants: [{ id: "v-1", sku: "AR-001", is_active: true, price_fils: 15000 }],
    },
  ])
  assert.equal(res.canPublish, false)
  assert.equal(res.checks.hasVisibleColourwayWithPhoto, false)
})

test("fails when visible colourway with photo has no active SKUs", () => {
  const res = evaluatePublishRules([
    {
      id: "cw-1",
      is_active: true,
      hasPhoto: true,
      variants: [
        { id: "v-1", sku: "AR-001", is_active: false, price_fils: 15000 },
        { id: "v-2", sku: "AR-002", is_active: false, price_fils: 20000 },
      ],
    },
  ])
  assert.equal(res.canPublish, false)
  assert.equal(res.checks.hasVisibleColourwayWithPhoto, true)
  assert.equal(res.checks.hasActiveSku, false)
  assert.match(res.errors[0], /at least one active SKU/i)
})

test("fails when an active SKU has a missing or zero price", () => {
  const res = evaluatePublishRules([
    {
      id: "cw-1",
      is_active: true,
      hasPhoto: true,
      variants: [
        { id: "v-1", sku: "AR-VALID", is_active: true, price_fils: 25000 },
        { id: "v-2", sku: "AR-NO-PRICE", is_active: true, price_fils: 0 },
        { id: "v-3", sku: "AR-NULL-PRICE", is_active: true, price_fils: null },
      ],
    },
  ])
  assert.equal(res.canPublish, false)
  assert.equal(res.checks.hasVisibleColourwayWithPhoto, true)
  assert.equal(res.checks.hasActiveSku, true)
  assert.equal(res.checks.allActiveSkusHavePrice, false)
  assert.deepEqual(res.details.skusMissingPrice, ["AR-NO-PRICE", "AR-NULL-PRICE"])
  assert.match(res.errors[0], /AR-NO-PRICE, AR-NULL-PRICE/)
})

test("passes when inactive SKU has missing price as long as all active SKUs have valid prices", () => {
  const res = evaluatePublishRules([
    {
      id: "cw-1",
      is_active: true,
      hasPhoto: true,
      variants: [
        { id: "v-1", sku: "AR-ACTIVE", is_active: true, price_fils: 19500 },
        { id: "v-2", sku: "AR-INACTIVE-DRAFT", is_active: false, price_fils: 0 },
      ],
    },
  ])
  assert.equal(res.canPublish, true)
  assert.equal(res.checks.hasVisibleColourwayWithPhoto, true)
  assert.equal(res.checks.hasActiveSku, true)
  assert.equal(res.checks.allActiveSkusHavePrice, true)
  assert.equal(res.errors.length, 0)
})

test("passes full requirements for multi-colourway product", () => {
  const res = evaluatePublishRules([
    {
      id: "cw-hidden",
      is_active: false,
      hasPhoto: false,
      variants: [],
    },
    {
      id: "cw-live",
      is_active: true,
      hasPhoto: true,
      variants: [
        { id: "v-s", sku: "AR-LIVE-S", is_active: true, price_fils: 35000 },
        { id: "v-m", sku: "AR-LIVE-M", is_active: true, price_fils: 35000 },
        { id: "v-l", sku: "AR-LIVE-L", is_active: true, price_fils: 35000 },
      ],
    },
  ])
  assert.equal(res.canPublish, true)
  assert.equal(res.checks.hasVisibleColourwayWithPhoto, true)
  assert.equal(res.checks.hasActiveSku, true)
  assert.equal(res.checks.allActiveSkusHavePrice, true)
  assert.equal(res.details.visibleColourwaysCount, 1)
  assert.equal(res.details.photosCount, 1)
  assert.equal(res.details.activeSkusCount, 3)
})
