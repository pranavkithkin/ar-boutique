// Run: node --test tests/mom1-sku-prefixes.test.mjs
// Executes the real Zustand store with in-memory localStorage; no network.
import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequire } from "node:module"
import vm from "node:vm"
import ts from "typescript"

const require = createRequire(import.meta.url)
const helperPath = new URL("../features/cart/sku-migration.ts", import.meta.url)
const helperSource = fs.readFileSync(helperPath, "utf8")
const storeSource = fs.readFileSync(new URL("../features/cart/store.ts", import.meta.url), "utf8")

function execute(source, dependencies = {}, globals = {}) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    reportDiagnostics: true,
  })
  assert.equal(compiled.diagnostics?.length ?? 0, 0)
  const module = { exports: {} }
  vm.runInNewContext(compiled.outputText, {
    module, exports: module.exports,
    require: (name) => dependencies[name] ?? require(name),
    ...globals,
  })
  return module.exports
}

const helper = execute(helperSource)
const PRODUCT = "8c3a236f-6172-47fe-a9cd-45b18ff9a7f9"
const legacy = {
  id: "JAA25CD01945-M", variantId: "eae8e5a3-5f92-47c7-b1e1-8632d3b8885f",
  sku: "JAA25CD01945-M", productId: PRODUCT,
  productName: "Co-ord set JAA25CD01945", productSlug: "co-ord-set-jaa25cd01945",
  colourName: "Original colour", sizeLabel: "M", priceFils: 9900,
  image: "https://example.invalid/unchanged.jpg", quantity: 2,
}
const plain = (value) => JSON.parse(JSON.stringify(value))

function storeWith(items) {
  const data = new Map()
  if (items !== undefined) {
    data.set("ar_boutique_cart", JSON.stringify({ state: { items }, version: 0 }))
  }
  const localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }
  const store = execute(storeSource, { "./sku-migration": helper }, { localStorage }).useCartStore
  return { store, data }
}

test("all 42 approved SKUs replace the full letter prefix without collisions", () => {
  const bases = [...helperSource.matchAll(/"([0-9a-f-]{36})": "([A-Z0-9-]+)"/g)]
  assert.equal(bases.length, 21)
  const targets = new Set()
  for (const [, productId, base] of bases) {
    for (const size of ["M", "XL"]) {
      const sku = `${base}-${size}`
      const result = helper.normaliseApprovedCartSku({ id: sku, sku, productId })
      assert.equal(result.sku, sku.replace(/^[A-Za-z]+/, "AR"))
      assert.equal(result.sku.slice(2), sku.replace(/^[A-Za-z]+/, ""))
      assert.equal(result.id, result.sku)
      targets.add(result.sku)
    }
  }
  assert.equal(targets.size, 42)
})

test("single-letter prefixes preserve leading zeroes", () => {
  const result = helper.normaliseApprovedCartSku({
    id: "J0395-DR-M", sku: "J0395-DR-M",
    productId: "e541ddf1-53c2-417a-877e-b06763d2199d",
  })
  assert.equal(result.sku, "AR0395-DR-M")
})

test("JNE is replaced completely", () => {
  assert.equal(helper.normaliseApprovedCartSku({
    id: "JNE4124-KR-XL", sku: "JNE4124-KR-XL",
    productId: "5395c50a-43aa-47ca-be0a-9f1fc97a1c4d",
  }).sku, "AR4124-KR-XL")
})

test("unapproved products, future SKUs and unapproved sizes are untouched", () => {
  for (const item of [
    { ...legacy, productId: "different-product" },
    { ...legacy, sku: "ABCD123-M" },
    { ...legacy, sku: "JAA25CD01945-S" },
  ]) {
    assert.strictEqual(helper.normaliseApprovedCartSku(item), item)
  }
})

test("migration is idempotent and preserves stable line identifiers", () => {
  const item = { ...legacy, id: legacy.variantId }
  const once = helper.normaliseApprovedCartSku(item)
  assert.equal(once.id, legacy.variantId)
  assert.strictEqual(helper.normaliseApprovedCartSku(once), once)
})

test("prices, quantities, names, photos and product links are preserved", () => {
  const result = plain(helper.normaliseApprovedCartSku(legacy))
  assert.deepEqual(result, { ...legacy, id: "AR25CD01945-M", sku: "AR25CD01945-M" })
})

test("old and new lines for one variant merge, capped at five", () => {
  const updated = { ...helper.normaliseApprovedCartSku(legacy), quantity: 4 }
  const items = helper.restoreCartItems({ items: [legacy, updated] })
  assert.equal(items.length, 1)
  assert.equal(items[0].quantity, 5)
  assert.equal(items[0].sku, "AR25CD01945-M")
})

test("different variant sizes stay separate", () => {
  const xl = { ...legacy, id: "JAA25CD01945-XL", sku: "JAA25CD01945-XL",
    variantId: "dab98ab2-0110-454d-8f5d-95a1158080a1", sizeLabel: "XL" }
  assert.equal(helper.restoreCartItems({ items: [legacy, xl] }).length, 2)
})

test("invalid persisted state is handled safely", () => {
  for (const value of [null, undefined, {}, { items: "wrong" }, { items: [null, {}, { ...legacy, quantity: -1 }] }]) {
    assert.equal(helper.restoreCartItems(value).length, 0)
  }
})

test("real Zustand hydrates the existing version-zero cart without losing totals", () => {
  const { store } = storeWith([legacy])
  assert.equal(store.getState().items[0].sku, "AR25CD01945-M")
  assert.equal(store.getState().getItemCount(), 2)
  assert.equal(store.getState().getSubtotalFils(), 19800)
  assert.equal(store.getState().isOpen, false)
  assert.equal(store.persist.hasHydrated(), true)
})

test("adding the renamed variant to a saved cart updates rather than duplicates", () => {
  const { store, data } = storeWith([legacy])
  store.getState().addItem({ ...legacy, id: "AR25CD01945-M", sku: "AR25CD01945-M" }, 1)
  assert.equal(store.getState().items.length, 1)
  assert.equal(store.getState().items[0].quantity, 3)
  assert.equal(store.getState().isOpen, true)
  assert.equal(JSON.parse(data.get("ar_boutique_cart")).state.items[0].sku, "AR25CD01945-M")
})

test("a stale page adding an old SKU is normalised after the rename", () => {
  const { store } = storeWith([helper.normaliseApprovedCartSku(legacy)])
  store.getState().addItem(legacy, 1)
  assert.equal(store.getState().items.length, 1)
  assert.equal(store.getState().items[0].sku, "AR25CD01945-M")
  assert.equal(store.getState().items[0].quantity, 3)
})

test("quantity changes, removal and clear still work with renamed SKUs", () => {
  const { store } = storeWith([legacy])
  store.getState().updateQuantity("AR25CD01945-M", 4)
  assert.equal(store.getState().getSubtotalFils(), 39600)
  store.getState().removeItem("AR25CD01945-M")
  assert.equal(store.getState().items.length, 0)
  store.getState().addItem(legacy, 2)
  store.getState().clearCart()
  assert.equal(store.getState().getItemCount(), 0)
})

test("repeated hydration is safe and does not inflate quantities", async () => {
  const { store } = storeWith([legacy])
  store.getState().addItem(legacy, 1)
  await store.persist.rehydrate()
  await store.persist.rehydrate()
  assert.equal(store.getState().items.length, 1)
  assert.equal(store.getState().items[0].quantity, 3)
})

test("fresh carts and quantity limits work", () => {
  const { store } = storeWith()
  assert.equal(store.getState().items.length, 0)
  store.getState().addItem(legacy, 99)
  assert.equal(store.getState().getItemCount(), 5)
  store.getState().updateQuantity("AR25CD01945-M", 0)
  assert.equal(store.getState().items.length, 0)
})
