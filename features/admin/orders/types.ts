export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"

export type PaymentMethod = "card" | "cod"

export type PaymentStatus = "pending" | "paid" | "refunded" | "failed"

export interface AdminOrderListItem {
  id: string
  order_number: string
  created_at: string
  customer_name: string
  customer_email: string
  customer_phone: string
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  item_count: number
  total_fils: number
}

export interface AdminOrderItem {
  id: string
  product_id: string | null
  product_colour_id: string | null
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
  total_fils: number
  is_final_sale: boolean
}

export interface AdminOrderEvent {
  id: string
  event_type: string
  from_status: OrderStatus | null
  to_status: OrderStatus | null
  note: string | null
  actor_sub: string
  created_at: string
}

export interface AdminOrderDetail {
  id: string
  order_number: string
  clerk_user_id: string | null
  email: string
  customer_name: string
  phone: string
  emirate: string
  area: string | null
  street_address: string
  building: string | null
  apartment: string | null
  landmark: string | null
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  subtotal_fils: number
  delivery_fee_fils: number
  cod_fee_fils: number
  discount_fils: number
  vat_fils: number
  total_fils: number
  vat_rate_bps: number
  courier: string | null
  tracking_number: string | null
  tracking_url: string | null
  internal_notes: string | null
  cancellation_reason: string | null
  hold_expires_at: string | null
  confirm_by: string | null
  confirmed_at: string | null
  paid_at: string | null
  packed_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  returned_at: string | null
  cash_collected_fils: number | null
  created_at: string
  updated_at: string
  items: AdminOrderItem[]
  events: AdminOrderEvent[]
}
