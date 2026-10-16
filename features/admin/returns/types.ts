export type ReturnStatus =
  | "requested"
  | "approved"
  | "in_transit"
  | "received"
  | "rejected"
  | "closed"

export type ItemCondition =
  | "pending_inspection"
  | "unopened"
  | "inspected_pass"
  | "damaged"
  | "worn_rejected"

export type RefundMethod = "card" | "bank_transfer"

export type RefundStatus = "pending" | "succeeded" | "failed"

export interface AdminReturnListItem {
  id: string
  return_number: string
  order_id: string
  order_number: string
  payment_method: "card" | "cod"
  created_at: string
  customer_name: string
  customer_email: string
  customer_phone: string
  status: ReturnStatus
  item_count: number
  total_refund_fils: number
}

export interface AdminReturnItem {
  id: string
  return_id: string
  order_item_id: string
  variant_id: string | null
  product_name: string
  colour_name: string
  style_code: string
  size_label: string | null
  sku: string
  media_key: string | null
  image_url?: string | null
  unit_price_fils: number
  quantity: number
  reason: string
  condition: ItemCondition
  refund_amount_fils: number
  is_restocked: boolean
  created_at: string
}

export interface AdminReturnPhoto {
  id: string
  return_id: string
  media_key: string
  image_url?: string | null
  caption: string | null
  created_at: string
}

export interface AdminReturnEvent {
  id: string
  return_id: string
  event_type: string
  from_status: ReturnStatus | null
  to_status: ReturnStatus | null
  note: string | null
  actor_sub: string
  created_at: string
}

export interface AdminRefund {
  id: string
  order_id: string
  return_id: string | null
  amount_fils: number
  method: RefundMethod
  status: RefundStatus
  stripe_refund_id: string | null
  bank_transfer_date: string | null
  bank_transfer_reference: string | null
  reason: string | null
  admin_notes: string | null
  processed_by: string
  created_at: string
}

export interface AdminReturnDetail {
  id: string
  return_number: string
  order_id: string
  order_number: string
  payment_method: "card" | "cod"
  payment_status: string
  order_total_fils: number
  clerk_user_id: string | null
  customer_name: string
  email: string
  phone: string
  status: ReturnStatus
  customer_comment: string | null
  admin_instructions: string | null
  rejection_reason: string | null
  close_reason: string | null
  bank_name: string | null
  account_holder_name: string | null
  iban: string | null
  requested_at: string
  approved_at: string | null
  received_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  items: AdminReturnItem[]
  photos: AdminReturnPhoto[]
  events: AdminReturnEvent[]
  refunds: AdminRefund[]
}
