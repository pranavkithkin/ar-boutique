"use server"

import "server-only"
import { auth, currentUser } from "@clerk/nextjs/server"
import { isClerkConfigured } from "@/lib/clerk"
import { getCurrentCustomerAction } from "@/features/auth/actions"
import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface DatabaseWishlistItem {
  id: string
  productId: string
  productSlug: string
  productName: string
  priceText: string
  imageSrc: string | null
  colourName: string | null
  createdAt: string
}

export interface WishlistActionResult {
  success: boolean
  error?: string
  items?: DatabaseWishlistItem[]
  isInWishlist?: boolean
  requiresAuth?: boolean
}

/**
 * Resolves the currently authenticated customer's email and ID.
 */
async function resolveCustomer(): Promise<{
  id: string
  email: string
  clerkUserId?: string | null
} | null> {
  if (isClerkConfigured()) {
    try {
      const { userId } = await auth()
      if (userId) {
        const user = await currentUser()
        const primaryEmail = user?.primaryEmailAddress?.emailAddress
        if (primaryEmail) {
          return {
            id: userId,
            email: primaryEmail.toLowerCase().trim(),
            clerkUserId: userId,
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  const fallback = await getCurrentCustomerAction()
  if (fallback?.email) {
    return {
      id: fallback.id,
      email: fallback.email.toLowerCase().trim(),
    }
  }

  return null
}

/**
 * Get all wishlist items from Supabase for the authenticated customer.
 */
export async function getCustomerWishlistAction(): Promise<WishlistActionResult> {
  const customer = await resolveCustomer()
  if (!customer) {
    return { success: false, requiresAuth: true, items: [] }
  }

  try {
    const adminDb = createAdminClient()
    const { data, error } = await adminDb
      .from("wishlist_items")
      .select("id, product_id, product_slug, product_name, price_text, image_src, colour_name, created_at")
      .eq("customer_email", customer.email)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("getCustomerWishlistAction error:", error)
      return { success: false, error: error.message, items: [] }
    }

    const items: DatabaseWishlistItem[] = (data || []).map((row) => ({
      id: row.id,
      productId: row.product_id,
      productSlug: row.product_slug,
      productName: row.product_name,
      priceText: row.price_text,
      imageSrc: row.image_src,
      colourName: row.colour_name,
      createdAt: row.created_at,
    }))

    return { success: true, items }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load wishlist"
    return { success: false, error: msg, items: [] }
  }
}

/**
 * Add a product to the authenticated customer's wishlist in Supabase.
 */
export async function addToWishlistAction(payload: {
  slug: string
  productId?: string
  name: string
  price: string
  imageSrc?: string
  colourName?: string
}): Promise<WishlistActionResult> {
  const customer = await resolveCustomer()
  if (!customer) {
    return {
      success: false,
      requiresAuth: true,
      error: "Please sign in to save pieces to your wishlist.",
    }
  }

  try {
    const adminDb = createAdminClient()

    // 1. Resolve product_id if not passed
    let resolvedProductId: string | null = payload.productId || null
    if (!resolvedProductId || resolvedProductId === payload.slug) {
      const { data: prod } = await adminDb
        .from("products")
        .select("id")
        .eq("slug", payload.slug)
        .maybeSingle()
      if (prod?.id) {
        resolvedProductId = prod.id
      }
    }

    // 2. Resolve customer_id from customers table if available
    let customerUuid: string | null = null
    const { data: custRow } = await adminDb
      .from("customers")
      .select("id")
      .ilike("email", customer.email)
      .maybeSingle()
    if (custRow?.id) {
      customerUuid = custRow.id
    }

    // 3. Upsert into wishlist_items
    const { error } = await adminDb.from("wishlist_items").upsert(
      {
        customer_id: customerUuid,
        customer_email: customer.email,
        product_id: resolvedProductId,
        product_slug: payload.slug,
        product_name: payload.name,
        price_text: payload.price,
        image_src: payload.imageSrc || null,
        colour_name: payload.colourName || null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "customer_email,product_slug" }
    )

    if (error) {
      console.error("addToWishlistAction error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/account")
    return { success: true, isInWishlist: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to add to wishlist"
    return { success: false, error: msg }
  }
}

/**
 * Remove a product from the customer's wishlist in Supabase.
 */
export async function removeFromWishlistAction(slug: string): Promise<WishlistActionResult> {
  const customer = await resolveCustomer()
  if (!customer) {
    return { success: false, requiresAuth: true, error: "Authentication required" }
  }

  try {
    const adminDb = createAdminClient()
    const { error } = await adminDb
      .from("wishlist_items")
      .delete()
      .eq("customer_email", customer.email)
      .eq("product_slug", slug)

    if (error) {
      console.error("removeFromWishlistAction error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/account")
    return { success: true, isInWishlist: false }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to remove from wishlist"
    return { success: false, error: msg }
  }
}

/**
 * Clear all items in the customer's wishlist in Supabase.
 */
export async function clearWishlistAction(): Promise<WishlistActionResult> {
  const customer = await resolveCustomer()
  if (!customer) {
    return { success: false, requiresAuth: true, error: "Authentication required" }
  }

  try {
    const adminDb = createAdminClient()
    const { error } = await adminDb
      .from("wishlist_items")
      .delete()
      .eq("customer_email", customer.email)

    if (error) {
      console.error("clearWishlistAction error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/account")
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to clear wishlist"
    return { success: false, error: msg }
  }
}
