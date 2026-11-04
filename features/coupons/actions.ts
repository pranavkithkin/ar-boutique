"use server"

import "server-only"
import { createAdminClient } from "@/lib/supabase/server"
import { auth } from "@clerk/nextjs/server"
import { isClerkConfigured } from "@/lib/clerk"
import { calculateCouponDiscount } from "./service"
import { couponFormSchema, validateCouponSchema, type CouponFormValues } from "./schemas"
import type { Coupon, CouponRedemption, ValidateCouponResult } from "./types"
import { revalidatePath } from "next/cache"

/**
 * Validate a promo code against live database records.
 * Can be called by storefront guest or customer.
 */
export async function validateCouponAction(
  code: string,
  subtotalFils: number,
  customerEmail?: string
): Promise<ValidateCouponResult> {
  try {
    const parsed = validateCouponSchema.safeParse({ code, subtotalFils, customerEmail })
    if (!parsed.success) {
      return {
        valid: false,
        error: parsed.error.issues[0]?.message || "Invalid coupon request",
      }
    }

    const { code: normalizedCode } = parsed.data
    const supabase = createAdminClient()

    // 1. Fetch coupon by code
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", normalizedCode)
      .maybeSingle()

    if (error || !coupon) {
      return {
        valid: false,
        error: "Invalid promo code. Please check and try again.",
      }
    }

    // 2. Count customer redemptions if email is provided
    let customerRedemptionsCount = 0
    let cleanEmail = customerEmail?.toLowerCase().trim()

    if (!cleanEmail && isClerkConfigured()) {
      try {
        const { userId } = await auth()
        if (userId) {
          const { data: clerkOrder } = await supabase
            .from("orders")
            .select("email")
            .eq("clerk_user_id", userId)
            .limit(1)
            .maybeSingle()
          if (clerkOrder?.email) {
            cleanEmail = clerkOrder.email.toLowerCase().trim()
          }
        }
      } catch {
        // Guest fallback
      }
    }

    if (cleanEmail) {
      const { count } = await supabase
        .from("coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .ilike("customer_email", cleanEmail)

      customerRedemptionsCount = count || 0
    }

    // 3. Evaluate discount logic
    const evalResult = calculateCouponDiscount({
      subtotalFils,
      coupon,
      customerRedemptionsCount,
    })

    if (!evalResult.valid) {
      return {
        valid: false,
        error: evalResult.error,
        code: coupon.code,
      }
    }

    return {
      valid: true,
      code: coupon.code,
      discountType: evalResult.discountType,
      discountValue: evalResult.discountValue,
      discountFils: evalResult.discountFils,
      freeShipping: evalResult.freeShipping,
      description: coupon.description,
    }
  } catch (err) {
    console.error("validateCouponAction error:", err)
    return {
      valid: false,
      error: "Could not validate promo code. Please try again.",
    }
  }
}

/**
 * Admin: Get all coupons
 */
export async function getAdminCouponsAction(): Promise<{
  success: boolean
  coupons: Coupon[]
  error?: string
}> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("getAdminCouponsAction error:", error)
      return { success: false, coupons: [], error: error.message }
    }

    return { success: true, coupons: (data || []) as Coupon[] }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load coupons"
    return { success: false, coupons: [], error: msg }
  }
}

/**
 * Admin: Create a new coupon
 */
export async function createCouponAction(formData: CouponFormValues): Promise<{
  success: boolean
  coupon?: Coupon
  error?: string
}> {
  try {
    const parsed = couponFormSchema.safeParse(formData)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid coupon details" }
    }

    const val = parsed.data
    const supabase = createAdminClient()

    // Check duplicate code
    const { data: existing } = await supabase
      .from("coupons")
      .select("id")
      .ilike("code", val.code)
      .maybeSingle()

    if (existing) {
      return { success: false, error: `Promo code "${val.code}" already exists.` }
    }

    // Value mapping: if fixed_fils, convert AED to fils (x 100)
    const discountValue =
      val.discountType === "fixed_fils"
        ? Math.round(val.discountValue * 100)
        : val.discountValue

    const minOrderFils = Math.round(val.minOrderAed * 100)
    const maxDiscountFils =
      val.maxDiscountAed && val.maxDiscountAed > 0
        ? Math.round(val.maxDiscountAed * 100)
        : null

    const { data, error } = await supabase
      .from("coupons")
      .insert({
        code: val.code,
        description: val.description || null,
        discount_type: val.discountType,
        discount_value: discountValue,
        min_order_fils: minOrderFils,
        max_discount_fils: maxDiscountFils,
        usage_limit: val.usageLimit || null,
        usage_count: 0,
        per_customer_limit: val.perCustomerLimit || 1,
        starts_at: val.startsAt ? new Date(val.startsAt).toISOString() : null,
        expires_at: val.expiresAt ? new Date(val.expiresAt).toISOString() : null,
        is_active: val.isActive,
      })
      .select()
      .single()

    if (error) {
      console.error("createCouponAction error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/coupons")
    return { success: true, coupon: data as Coupon }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create coupon"
    return { success: false, error: msg }
  }
}

/**
 * Admin: Update existing coupon
 */
export async function updateCouponAction(
  id: string,
  formData: CouponFormValues
): Promise<{
  success: boolean
  coupon?: Coupon
  error?: string
}> {
  try {
    const parsed = couponFormSchema.safeParse(formData)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid coupon details" }
    }

    const val = parsed.data
    const supabase = createAdminClient()

    // Check duplicate code on other coupons
    const { data: existing } = await supabase
      .from("coupons")
      .select("id")
      .ilike("code", val.code)
      .neq("id", id)
      .maybeSingle()

    if (existing) {
      return { success: false, error: `Promo code "${val.code}" already exists on another coupon.` }
    }

    const discountValue =
      val.discountType === "fixed_fils"
        ? Math.round(val.discountValue * 100)
        : val.discountValue

    const minOrderFils = Math.round(val.minOrderAed * 100)
    const maxDiscountFils =
      val.maxDiscountAed && val.maxDiscountAed > 0
        ? Math.round(val.maxDiscountAed * 100)
        : null

    const { data, error } = await supabase
      .from("coupons")
      .update({
        code: val.code,
        description: val.description || null,
        discount_type: val.discountType,
        discount_value: discountValue,
        min_order_fils: minOrderFils,
        max_discount_fils: maxDiscountFils,
        usage_limit: val.usageLimit || null,
        per_customer_limit: val.perCustomerLimit || 1,
        starts_at: val.startsAt ? new Date(val.startsAt).toISOString() : null,
        expires_at: val.expiresAt ? new Date(val.expiresAt).toISOString() : null,
        is_active: val.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("updateCouponAction error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/coupons")
    return { success: true, coupon: data as Coupon }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update coupon"
    return { success: false, error: msg }
  }
}

/**
 * Admin: Toggle active status
 */
export async function toggleCouponStatusAction(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
    revalidatePath("/admin/coupons")
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update coupon status"
    return { success: false, error: msg }
  }
}

/**
 * Admin: Get redemptions for a specific coupon
 */
export async function getCouponRedemptionsAction(couponId: string): Promise<{
  success: boolean
  redemptions: CouponRedemption[]
  error?: string
}> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("coupon_redemptions")
      .select("*")
      .eq("coupon_id", couponId)
      .order("redeemed_at", { ascending: false })

    if (error) throw error
    return { success: true, redemptions: (data || []) as CouponRedemption[] }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load redemptions"
    return { success: false, redemptions: [], error: msg }
  }
}

/**
 * Admin: Delete coupon
 */
export async function deleteCouponAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("coupons").delete().eq("id", id)

    if (error) throw error
    revalidatePath("/admin/coupons")
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete coupon"
    return { success: false, error: msg }
  }
}
