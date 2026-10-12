/**
 * Cart Domain Types
 * Cart lines reference a specific variant/SKU per ADR-023 and docs/ARCHITECTURE.md.
 */

export interface CartItem {
  id: string // Unique line identifier (typically sku or variantId)
  variantId: string // Reference to product_variants.id
  sku: string // The client's SKU exactly as stored
  productId: string
  productName: string
  productSlug: string
  colourName: string
  sizeLabel: string
  priceFils: number // Integer fils (AED * 100)
  image: string // Cloudinary image URL or media key
  quantity: number // 1 to 5 per line max (TASK-048, docs/TEST_PLAN.md)
}

export interface CartStore {
  items: CartItem[]
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void
  updateQuantity: (sku: string, quantity: number) => void
  removeItem: (sku: string) => void
  clearCart: () => void
  getItemCount: () => number
  getSubtotalFils: () => number
}
