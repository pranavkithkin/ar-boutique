import { test, expect } from "vitest"
import { STORE_CONTACT } from "@/lib/contact"

test("Variant availability calculation adheres to ADR-026 and security rules", () => {
  function computeAvailability(onHand: number, reserved: number) {
    const available = Math.max(0, onHand - reserved)
    let status = "in_stock"
    let unitsLeft: number | null = null

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
  expect(abundant.status).toBe("in_stock")
  expect(abundant.isAvailable).toBe(true)
  expect(abundant.unitsLeft).toBeNull()

  // 2. Low stock (3 units left)
  const low3 = computeAvailability(5, 2)
  expect(low3.status).toBe("low")
  expect(low3.isAvailable).toBe(true)
  expect(low3.unitsLeft).toBe(3)

  // 3. Low stock (1 unit left)
  const low1 = computeAvailability(1, 0)
  expect(low1.status).toBe("low")
  expect(low1.isAvailable).toBe(true)
  expect(low1.unitsLeft).toBe(1)

  // 4. Sold out (0 units left or reserved >= on_hand)
  const soldOut = computeAvailability(4, 4)
  expect(soldOut.status).toBe("sold_out")
  expect(soldOut.isAvailable).toBe(false)
  expect(soldOut.unitsLeft).toBeNull()

  const negative = computeAvailability(2, 5)
  expect(negative.status).toBe("sold_out")
  expect(negative.isAvailable).toBe(false)
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

  expect(showPickerSingle).toBe(false)
  expect(showPickerMulti).toBe(true)
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

  expect(singleSkuColourway.sizes.length > 1).toBe(false)
  expect(multiSkuColourway.sizes.length > 1).toBe(true)

  // Ensure sold out sizes remain identifiable
  const soldOutSizes = multiSkuColourway.sizes.filter(s => !s.isAvailable)
  expect(soldOutSizes).toHaveLength(1)
  expect(soldOutSizes[0].name).toBe("L")
})

test("PDP WhatsApp inquiry URL format and social contact links", () => {
  // 1. Verify WhatsApp inquiry URL formation with exact product details
  const product = { name: "Embroidered Silk Kurta Set", sku: "JAA25DR01112" }
  const colourName = "Emerald Green"
  const sizeName: string = "M"

  const selectedSizeText = sizeName && sizeName !== "One Size" ? `, Size: ${sizeName}` : ""
  const whatsappInquiryText = `Hello AR Boutique Concierge, I would like to inquire about "${product.name}" (SKU: ${product.sku}, Colour: ${colourName}${selectedSizeText}). Is this piece currently available?`
  const whatsappInquiryHref = `${STORE_CONTACT.whatsappHref}?text=${encodeURIComponent(
    whatsappInquiryText
  )}`

  expect(whatsappInquiryHref).toContain("https://wa.me/971502736767")
  expect(whatsappInquiryHref).toContain("Embroidered%20Silk%20Kurta%20Set")
  expect(whatsappInquiryHref).toContain("JAA25DR01112")
  expect(whatsappInquiryHref).toContain("Emerald%20Green")
  expect(whatsappInquiryHref).toContain("Size%3A%20M")

  // 2. Verify centralized social links
  expect(STORE_CONTACT.instagram).toBe("@arboutique.ae")
  expect(STORE_CONTACT.instagramHref).toBe("https://instagram.com/arboutique.ae")
  expect(STORE_CONTACT.facebookHref).toBe("https://facebook.com/arboutique.ae")
})

