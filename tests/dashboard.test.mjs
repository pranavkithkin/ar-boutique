// Run: node --test tests/dashboard.test.mjs
import test from "node:test"
import assert from "node:assert/strict"

test("Dashboard revenue aggregation and fils conversion", () => {
  const orders = [
    { total_fils: 45000, payment_method: "card", payment_status: "paid", status: "confirmed" },
    { total_fils: 32000, payment_method: "cod", payment_status: "pending", status: "confirmed" },
    { total_fils: 15000, payment_method: "card", payment_status: "failed", status: "cancelled" },
  ]

  let grossRevenueFils = 0
  let cardRevenueFils = 0
  let codRevenueFils = 0
  let successfulOrders = 0

  for (const o of orders) {
    const isCompleted =
      o.payment_status === "paid" ||
      ["confirmed", "packed", "shipped", "delivered"].includes(o.status)

    if (isCompleted) {
      grossRevenueFils += o.total_fils
      successfulOrders += 1
      if (o.payment_method === "card") {
        cardRevenueFils += o.total_fils
      } else if (o.payment_method === "cod") {
        codRevenueFils += o.total_fils
      }
    }
  }

  assert.equal(grossRevenueFils, 77000)
  assert.equal(cardRevenueFils, 45000)
  assert.equal(codRevenueFils, 32000)
  assert.equal(successfulOrders, 2)
  assert.equal(Math.round(grossRevenueFils / successfulOrders), 38500)
})

test("Dashboard operational queue classification", () => {
  const orders = [
    { payment_method: "cod", status: "pending", total_fils: 20000 },
    { payment_method: "card", status: "confirmed", total_fils: 30000 },
    { payment_method: "cod", status: "confirmed", total_fils: 25000 },
    { payment_method: "cod", status: "packed", total_fils: 15000 },
    { payment_method: "card", status: "shipped", total_fils: 40000 },
    { payment_method: "cod", status: "delivered", total_fils: 18000, cash_collected_fils: 18000 },
  ]

  let codToConfirm = 0
  let toPack = 0
  let toShip = 0
  let codCashOutstanding = 0
  let codCashCollected = 0

  for (const o of orders) {
    if (o.payment_method === "cod" && o.status === "pending") {
      codToConfirm += 1
    }
    if (o.status === "confirmed") {
      toPack += 1
    }
    if (o.status === "packed") {
      toShip += 1
    }
    if (o.payment_method === "cod") {
      if (o.status === "delivered") {
        codCashCollected += o.cash_collected_fils || o.total_fils
      } else if (["shipped", "packed"].includes(o.status)) {
        codCashOutstanding += o.total_fils
      }
    }
  }

  assert.equal(codToConfirm, 1)
  assert.equal(toPack, 2)
  assert.equal(toShip, 1)
  assert.equal(codCashOutstanding, 15000)
  assert.equal(codCashCollected, 18000)
})

test("Dashboard low stock calculation logic", () => {
  const threshold = 3
  const variants = [
    { sku: "SKU-1", on_hand: 5, reserved: 2, is_active: true }, // available 3 -> low stock
    { sku: "SKU-2", on_hand: 10, reserved: 1, is_active: true }, // available 9 -> healthy
    { sku: "SKU-3", on_hand: 2, reserved: 2, is_active: true }, // available 0 -> low stock
    { sku: "SKU-4", on_hand: 1, reserved: 0, is_active: false }, // inactive -> ignore
  ]

  const lowStock = variants.filter((v) => {
    const available = v.on_hand - v.reserved
    return v.is_active && available <= threshold
  })

  assert.equal(lowStock.length, 2)
  assert.equal(lowStock[0].sku, "SKU-1")
  assert.equal(lowStock[1].sku, "SKU-3")
})
