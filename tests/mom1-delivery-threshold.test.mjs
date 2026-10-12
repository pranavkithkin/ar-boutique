// Run: node --test tests/mom1-delivery-threshold.test.mjs
// Isolated logic/render tests, not live checkout or full Next integration.
import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"
import { createRequire } from "node:module"
import ts from "typescript"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

const require = createRequire(import.meta.url)
const root = new URL("../", import.meta.url)
const read = (path) => fs.readFileSync(new URL(path, root), "utf8")
function load(path, dependencies = {}) {
  const { outputText, diagnostics } = ts.transpileModule(read(path), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
    reportDiagnostics: true,
  })
  assert.equal(diagnostics?.length ?? 0, 0)
  const module = { exports: {} }
  vm.runInNewContext(outputText, {
    module, exports: module.exports,
    require: (name) => dependencies[name] ?? require(name),
  })
  return module.exports
}
const money = load("lib/money.ts")
const estimate = money.calculateDeliveryEstimate

for (const [subtotal, fee, free, remaining] of [
  [19900, 2500, false, 100],
  [19999, 2500, false, 1],
  [20000, 0, true, 0],
  [20001, 0, true, 0],
  [50000, 0, true, 0],
]) {
  test(`subtotal ${subtotal} fils has correct delivery and eligibility`, () => {
    const result = estimate(subtotal, true)
    assert.equal(result.deliveryFeeFils, fee)
    assert.equal(result.isFreeShipping, free)
    assert.equal(result.remainingFils, remaining)
  })
}

test("empty carts have no delivery fee and no unlocked reward", () => {
  const result = estimate(0, false)
  assert.equal(result.deliveryFeeFils, 0)
  assert.equal(result.isFreeShipping, false)
  assert.equal(result.progressPercent, 0)
})
test("a non-empty zero-value cart remains below the threshold", () => {
  assert.equal(estimate(0, true).deliveryFeeFils, 2500)
})
test("invalid amounts are rejected instead of granting free delivery", () => {
  for (const value of [-1, 1.5, NaN, Infinity, "20000", Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => estimate(value, true), /non-negative integer fils/)
  }
})
test("progress never rounds up to 100 before eligibility", () => {
  assert.equal(estimate(19999, true).progressPercent, 99)
  assert.equal(estimate(19900, true).progressPercent, 99)
  assert.equal(estimate(20000, true).progressPercent, 100)
  assert.equal(estimate(90000, true).progressPercent, 100)
})
test("exact totals preserve the AED 25 fee only below the threshold", () => {
  assert.equal(19900 + estimate(19900, true).deliveryFeeFils, 22400)
  assert.equal(20000 + estimate(20000, true).deliveryFeeFils, 20000)
})
test("one shared threshold drives labels and calculations", () => {
  assert.equal(money.FREE_DELIVERY_THRESHOLD_FILS, 20000)
  assert.equal(money.STANDARD_DELIVERY_FEE_FILS, 2500)
  assert.equal(money.FREE_DELIVERY_MINIMUM_LABEL, "AED 200 or more")
  assert.equal(money.FREE_DELIVERY_MESSAGE, "Complimentary delivery on orders of AED 200 or more across the UAE")
})
test("existing currency and VAT helpers remain unchanged", () => {
  assert.equal(money.toFils(199.99), 19999)
  assert.equal(money.toAED(20000), 200)
  assert.equal(money.formatAED(2500), "AED 25")
  assert.equal(money.calculateVatPortion(22400), Math.round(22400 * 5 / 105))
})

const banner = load("components/store/AnnouncementBar.tsx", { "@/lib/money": money }).AnnouncementBar
test("announcement renders the inclusive threshold and preserves custom text", () => {
  assert.match(renderToStaticMarkup(React.createElement(banner)), /AED 200 or more/)
  assert.match(renderToStaticMarkup(React.createElement(banner, { text: "Custom notice" })), /Custom notice/)
})

const passthrough = ({ children }) => React.createElement("div", null, children)
const accordions = load("components/store/ProductAccordions.tsx", {
  "@/lib/money": money,
  "@/components/ui/accordion": {
    Accordion: passthrough, AccordionContent: passthrough,
    AccordionItem: passthrough, AccordionTrigger: passthrough,
  },
}).ProductAccordions
test("product delivery details render the same inclusive threshold", () => {
  const html = renderToStaticMarkup(React.createElement(accordions, { product: {} }))
  assert.match(html, /orders of AED 200 or more/)
  assert.doesNotMatch(html, /AED (150|500)/)
})

function cartMarkup(subtotal, hasItems = true) {
  const item = {
    sku: "AR-TEST", productName: "Test product", productSlug: "test-product",
    image: "/test.jpg", quantity: 1, priceFils: subtotal, sizeLabel: "M",
  }
  const CartView = load("features/cart/components/CartView.tsx", {
    react: { ...React, useState: () => [true, () => {}], useEffect: () => {} },
    "@/lib/money": money,
    "@/features/cart/store": { useCartStore: () => ({
      items: hasItems ? [item] : [], getSubtotalFils: () => subtotal,
      updateQuantity: () => {}, removeItem: () => {}, clearCart: () => {},
    }) },
    "next/link": ({ children, href }) => React.createElement("a", { href }, children),
    "next/image": ({ src, alt }) => React.createElement("img", { src, alt }),
    "@/components/store/StoreButton": { StoreButton: passthrough },
    "lucide-react": new Proxy({}, { get: () => () => null }),
  }).CartView
  return renderToStaticMarkup(React.createElement(CartView))
}
test("cart rendering at AED 199 shows the fee, AED 224 total and AED 1 remaining", () => {
  const html = cartMarkup(19900)
  assert.match(html, /AED 25/)
  assert.match(html, /AED 224/)
  assert.match(html, /AED 1<\/span> more/)
  assert.match(html, /99%/)
  assert.doesNotMatch(html, /unlocked free/)
})
test("cart rendering at AED 200 shows FREE and the unlocked state", () => {
  const html = cartMarkup(20000)
  assert.match(html, />FREE</)
  assert.match(html, /unlocked free UAE delivery/)
  assert.match(html, /100%/)
  assert.doesNotMatch(html, /AED 25|AED 500/)
})
test("cart rendering at AED 199.99 still requires one fil", () => {
  const html = cartMarkup(19999)
  assert.match(html, /AED 0.01/)
  assert.match(html, /99%/)
  assert.doesNotMatch(html, /unlocked free/)
})
test("empty-cart rendering stays empty rather than showing a delivery charge", () => {
  const html = cartMarkup(0, false)
  assert.match(html, /Shopping Bag is Empty/)
  assert.doesNotMatch(html, /Estimated Delivery|unlocked free/)
})
test("edited storefront files have no old numeric delivery thresholds", () => {
  for (const path of [
    "components/store/AnnouncementBar.tsx",
    "components/store/ProductAccordions.tsx",
    "features/cart/components/CartView.tsx",
  ]) {
    const source = read(path)
    assert.doesNotMatch(source, /AED (150|500)|50000|FREE_SHIPPING_THRESHOLD_FILS/)
    assert.match(source, /from "@\/lib\/money"/)
  }
})
