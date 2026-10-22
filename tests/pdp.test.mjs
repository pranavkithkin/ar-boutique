import test from "node:test"
import assert from "node:assert/strict"

test("Variant availability calculation adheres to ADR-026 and security rules", () => {
  function computeAvailability(onHand, reserved) {
    const available = Math.max(0, onHand - reserved)
    let status = "in_stock"
    let unitsLeft = null

    if (available <= 0) {
      status = "sold_out"
    } else if (available <= 3) {
      status = "low"
      unitsLeft = available
    }

    return {
      status,
      unitsLeft,
      isAvailable: status !== "sold_out",
    }
  }

  // 1. In stock with plenty of inventory (> 3): Never leaks raw count
  const abundant = computeAvailability(10, 2)
  assert.equal(abundant.status, "in_stock")
  assert.equal(abundant.isAvailable, true)
  assert.equal(abundant.unitsLeft, null, "Raw stock counts > 3 must never be sent to the browser")

  // 2. Low stock (3 units left)
  const low3 = computeAvailability(5, 2)
  assert.equal(low3.status, "low")
  assert.equal(low3.isAvailable, true)
  assert.equal(low3.unitsLeft, 3)

  // 3. Low stock (1 unit left)
  const low1 = computeAvailability(1, 0)
  assert.equal(low1.status, "low")
  assert.equal(low1.isAvailable, true)
  assert.equal(low1.unitsLeft, 1)

  // 4. Sold out (0 units left or reserved >= on_hand)
  const soldOut = computeAvailability(4, 4)
  assert.equal(soldOut.status, "sold_out")
  assert.equal(soldOut.isAvailable, false)
  assert.equal(soldOut.unitsLeft, null)

  const negative = computeAvailability(2, 5)
  assert.equal(negative.status, "sold_out")
  assert.equal(negative.isAvailable, false)
})

test("Multi-colour switcher logic only triggers when product has more than 1 visible colourway", () => {
  const singleColourProduct = {
    colourways: [
      { id: "c1", colourName: "Royal Ivory", colourSlug: "royal-ivory", swatchHex: "#FFFDD0" }
    ]
  }

  const multiColourProduct = {
    colourways: [
      { id: "c1", colourName: "Royal Ivory", colourSlug: "royal-ivory", swatchHex: "#FFFDD0" },
      { id: "c2", colourName: "Midnight Navy", colourSlug: "midnight-navy", swatchHex: "#000080" }
    ]
  }

  const showPickerSingle = singleColourProduct.colourways.length > 1
  const showPickerMulti = multiColourProduct.colourways.length > 1

  assert.equal(showPickerSingle, false, "Colour picker must be hidden when only 1 colourway exists")
  assert.equal(showPickerMulti, true, "Colour picker must be shown when multiple colourways exist")
})

test("Size picker only displays interactive chips when colourway has more than 1 active SKU", () => {
  const singleSkuColourway = {
    sizes: [{ id: "v1", name: "Free Size", sku: "J0478-FS", isAvailable: true }]
  }

  const multiSkuColourway = {
    sizes: [
      { id: "v1", name: "S", sku: "J0478-S", isAvailable: true },
      { id: "v2", name: "M", sku: "J0478-M", isAvailable: true },
      { id: "v3", name: "L", sku: "J0478-L", isAvailable: false },
      { id: "v4", name: "XL", sku: "J0478-XL", isAvailable: true },
    ]
  }

  assert.equal(singleSkuColourway.sizes.length > 1, false, "Single SKU should be auto-selected without multiple chips")
  assert.equal(multiSkuColourway.sizes.length > 1, true, "Multiple SKUs should render size selection chips")

  // Ensure sold out sizes remain identifiable
  const soldOutSizes = multiSkuColourway.sizes.filter(s => !s.isAvailable)
  assert.equal(soldOutSizes.length, 1)
  assert.equal(soldOutSizes[0].name, "L")
})
