export type DiscountType = "percentage" | "fixed_fils" | "free_shipping"

export interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: DiscountType
  discount_value: number // percentage (e.g. 15 for 15%) or fils (e.g. 5000 for 50 AED)
  min_order_fils: number
  max_discount_fils: number | null
  usage_limit: number | null
  usage_count: number
  per_customer_limit: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CouponRedemption {
  id: string
  coupon_id: string
  order_id: string | null
  customer_email: string
  clerk_user_id: string | null
  discount_fils: number
  redeemed_at: string
}

export interface ValidateCouponResult {
  valid: boolean
  error?: string
  code?: string
  discountType?: DiscountType
  discountValue?: number
  discountFils?: number
  freeShipping?: boolean
  description?: string | null
}
