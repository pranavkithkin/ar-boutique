import type { CartItem } from "./types"

// Feedback #7, explicitly approved 2026-10-13. This is a one-time mapping,
// not a rule for generating or rewriting future catalogue SKUs.
const APPROVED_BASES: Readonly<Record<string, string>> = {
  "e541ddf1-53c2-417a-877e-b06763d2199d": "J0395-DR",
  "c3f16c52-ccce-4efb-b2cf-3b5bc1ca6bb6": "J0478-KR-NP",
  "8c3a236f-6172-47fe-a9cd-45b18ff9a7f9": "JAA25CD01945",
  "692950a1-f6f1-4a55-85d5-62310a6d32cd": "JAA25DR01112",
  "aeeb76e9-8fae-4c8c-b090-b57dea4192b0": "JAA25DR01174",
  "55b382e9-331d-490e-88c1-e02bc891a4b9": "JAA25DR01202",
  "f4a84b32-39e3-4230-aeaa-60a40d5a37cd": "JAA25DR01662",
  "cb64ac3a-a2d4-418d-883c-c14d1af8d424": "JAA25KB01291",
  "c54e04b2-431a-4bc3-b388-f71b50158db2": "JAA25KB01295",
  "842199a6-9558-47d4-951c-b74ec4ac8e7b": "JAA25KB01960",
  "500b4cb3-d333-49ce-bef3-f3bcbef9ddef": "JAA25KB02100",
  "7e168b69-0f46-4607-a27e-9467a0c3cacc": "JAA25ST01341",
  "67d757c8-ef93-4d1e-baab-23ca20a6ee98": "JAA25ST01343",
  "8a7f570c-eb0e-4395-b076-dceea35f2591": "JAB24CD00489",
  "c8dd1b6b-4f84-4c50-a5be-dbfc783e2d0b": "JAB24ST00577",
  "aab6743b-7cc4-4f84-bb26-b1010de88c4d": "JAC24DR01633",
  "ac61fd1c-d98f-4382-8108-0f04cac3e500": "JAC24ST01220",
  "c77f2e19-5407-45ae-90f5-9c1f9d4a38bf": "JAC25ST01935",
  "5395c50a-43aa-47ca-be0a-9f1fc97a1c4d": "JNE4124-KR",
  "be7da261-1489-4137-92e9-8bd95750eeb2": "JNE4207-TP",
  "80f5b091-e43f-4398-a51b-4376cf78c8cc": "JNE4380-TP",
}

export function normaliseApprovedCartSku<T extends Pick<CartItem, "id" | "sku" | "productId">>(
  item: T
): T {
  const base = APPROVED_BASES[item.productId]
  if (!base) return item

  const size = item.sku === `${base}-M` ? "M" : item.sku === `${base}-XL` ? "XL" : null
  if (!size) return item

  const sku = `${base.replace(/^[A-Za-z]+/, "AR")}-${size}`
  return { ...item, sku, id: item.id === item.sku ? sku : item.id }
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>
  const strings = [
    "id", "variantId", "sku", "productId", "productName", "productSlug",
    "colourName", "sizeLabel", "image",
  ]
  return strings.every((key) => typeof item[key] === "string") &&
    typeof item.variantId === "string" && item.variantId.length > 0 &&
    typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity > 0 &&
    typeof item.priceFils === "number" && Number.isInteger(item.priceFils) && item.priceFils >= 0
}

export function restoreCartItems(persisted: unknown): CartItem[] {
  if (!persisted || typeof persisted !== "object" || !("items" in persisted)) return []
  if (!Array.isArray(persisted.items)) return []

  const items = new Map<string, CartItem>()
  for (const value of persisted.items) {
    if (!isCartItem(value)) continue
    const item = normaliseApprovedCartSku(value)
    const previous = items.get(item.variantId)
    items.set(item.variantId, {
      ...item,
      quantity: Math.min((previous?.quantity ?? 0) + item.quantity, 5),
    })
  }
  return Array.from(items.values())
}
