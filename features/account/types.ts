export type AccountTab = "orders" | "addresses" | "profile" | "returns"

export interface AccountAddress {
  id: string
  label: string // e.g. "Home", "Atelier / Office"
  isDefault: boolean
  recipientName: string
  phone: string
  emirate: string
  area: string
  street: string
  building: string
  apartment?: string
  landmark?: string
}

export interface AccountOrderItem {
  id: string
  productName: string
  styleCode: string
  colourName: string
  sizeLabel: string
  quantity: number
  priceFils: number
  imageSrc: string
}

export interface AccountOrder {
  id: string
  orderNumber: string
  date: string
  status: "confirmed" | "shipped" | "delivered" | "cancelled"
  statusLabel: string
  trackingNumber?: string
  courierName?: string
  paymentMethod: "card" | "cod"
  subtotalFils: number
  deliveryFeeFils: number
  vatFils: number
  totalFils: number
  deliveryAddress: AccountAddress
  items: AccountOrderItem[]
}

export interface AccountUserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  memberSince: string
  tier: "Boutique VIP" | "Member"
  preferredLanguage: "en" | "ar"
  notifyWhatsApp: boolean
  notifyEmail: boolean
}
