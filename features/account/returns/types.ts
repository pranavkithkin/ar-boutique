export type ReturnStatus =
  | "requested"
  | "approved"
  | "received"
  | "rejected"
  | "closed"

export interface CustomerReturnItem {
  id: string
  orderItemId: string
  variantId?: string
  productName: string
  colourName: string
  sizeLabel: string
  sku: string
  quantity: number
  unitPriceFils: number
  refundAmountFils: number
  reason: string
  condition?: string
  mediaKey?: string
}

export interface CustomerReturnPhoto {
  id: string
  mediaKey: string
  caption?: string
}

export interface CustomerReturnEvent {
  id: string
  eventType: string
  fromStatus: ReturnStatus | null
  toStatus: ReturnStatus | null
  note: string | null
  createdAt: string
}

export interface CustomerRefund {
  id: string
  amountFils: number
  method: "card" | "bank_transfer"
  status: "pending" | "succeeded" | "failed"
  bankTransferDate?: string | null
  bankTransferReference?: string | null
  createdAt: string
}

export interface CustomerReturnRequest {
  id: string
  returnNumber: string
  orderId: string
  orderNumber: string
  status: ReturnStatus
  statusLabel: string
  createdAt: string
  customerComment?: string
  adminInstructions?: string
  rejectionReason?: string
  items: CustomerReturnItem[]
  photos?: CustomerReturnPhoto[]
  events?: CustomerReturnEvent[]
  refunds?: CustomerRefund[]
  bankName?: string
  accountHolderName?: string
  iban?: string
  totalRefundFils: number
}

export interface OrderItemReturnEligibility {
  orderItemId: string
  isEligible: boolean
  ineligibleReason?: string
  orderedQuantity: number
  alreadyReturnedQuantity: number
  maxReturnableQuantity: number
}

export interface OrderReturnEligibility {
  orderId: string
  orderNumber: string
  isEligible: boolean
  ineligibleReason?: string
  deliveredAt?: string
  daysRemaining?: number
  items: OrderItemReturnEligibility[]
}

export interface SubmitReturnInputItem {
  orderItemId: string
  variantId?: string
  productName: string
  colourName: string
  styleCode?: string
  sizeLabel: string
  sku: string
  unitPriceFils: number
  quantity: number
  reason: string
  mediaKey?: string
}

export interface SubmitReturnInput {
  orderId: string
  items: SubmitReturnInputItem[]
  customerComment?: string
  photoKeys?: string[]
  bankDetails?: {
    bankName: string
    accountHolderName: string
    iban: string
  }
}
