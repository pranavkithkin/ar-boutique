export interface CheckoutConfig {
  deliveryFeeFils: number
  freeDeliveryThresholdFils: number
  vatEnabled: boolean
  vatRatePct: number
  cardEnabled: boolean
  codEnabled: boolean
  codFeeFils: number
  codMaxOrderFils: number
  codConfirmHours: number
  codRefusedBlockCount: number
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

export interface CodEligibilityStatus {
  eligible: boolean
  reason?: string
  isSignedIn: boolean
  hasOpenCodOrder: boolean
  isBlocked: boolean
  refusalsCount: number
  maxOrderFils: number
}

export interface CustomerCheckoutContext {
  isSignedIn: boolean
  email?: string
  fullName?: string
  phone?: string
  savedAddresses: SavedAddressCandidate[]
  codEligibility: CodEligibilityStatus
}

export interface CheckoutPageData {
  config: CheckoutConfig
  customerContext: CustomerCheckoutContext
}
