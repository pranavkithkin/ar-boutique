import type { CartItem } from "@/features/cart/types"
import type { CheckoutFormValues } from "./schemas"

export interface CheckoutConfig {
  deliveryFeeFils: number
  freeDeliveryThresholdFils: number
  vatRatePct: number
  codEnabled: boolean
  codFeeFils: number
  codMaxOrderFils: number
}

export interface CheckoutPricingBreakdown {
  subtotalFils: number
  deliveryFeeFils: number
  codFeeFils: number
  vatPortionFils: number
  totalFils: number
  isFreeShipping: boolean
}

export interface PlaceOrderResult {
  success: boolean
  orderNumber?: string
  orderId?: string
  paymentMethod?: "card" | "cod"
  error?: string
  redirectUrl?: string
}

export interface SavedAddressCandidate {
  id: string
  label?: string
  recipientName: string
  phone: string
  emirate: string
  area: string
  street: string
  building: string
  apartment?: string
  landmark?: string
  isDefault?: boolean
}
