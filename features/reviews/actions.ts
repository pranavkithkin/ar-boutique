"use server"

import "server-only"
import { createAdminClient } from "@/lib/supabase/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { isClerkConfigured } from "@/lib/clerk"
import { getCurrentCustomerAction } from "@/features/auth/actions"
import {
  createReviewSchema,
  moderateReviewSchema,
  type CreateReviewInput,
  type ModerateReviewInput,
} from "./schemas"
import type {
  ProductReview,
  ReviewBreakdown,
  ProductReviewsData,
  ReviewStatus,
} from "./types"
import { calculateReviewBreakdown } from "./service"
import { revalidatePath } from "next/cache"

/**
 * Helper to resolve the authenticated customer.
 */
async function resolveCustomer(): Promise<{
  id: string
  name: string
  email: string
  clerkUserId?: string | null
} | null> {
  if (isClerkConfigured()) {
    try {
      const { userId } = await auth()
      if (userId) {
        const user = await currentUser()
        const primaryEmail = user?.primaryEmailAddress?.emailAddress
        const fullName =
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          user?.username ||
          primaryEmail?.split("@")[0] ||
          "Verified Customer"

        if (primaryEmail) {
          return {
            id: userId,
            name: fullName,
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
    const fullName =
      [fallback.firstName, fallback.lastName].filter(Boolean).join(" ") ||
      fallback.email.split("@")[0] ||
      "Verified Customer"

    return {
      id: fallback.id,
      name: fullName,
      email: fallback.email.toLowerCase().trim(),
    }
  }

  return null
}

/**
 * Storefront Action: Get public approved reviews and user's own review for a product.
 */
export async function getProductReviewsAction(
  slug: string
): Promise<ProductReviewsData> {
  const defaultBreakdown: ReviewBreakdown = {
    averageRating: 0,
    totalCount: 0,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    fitDistribution: { runs_small: 0, true_to_size: 0, runs_large: 0, totalWithFit: 0 },
  }

  try {
    const supabase = createAdminClient()

    // 1. Fetch all approved reviews for this product slug
    const { data: approvedData, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_slug", slug)
      .eq("status", "approved")
      .order("created_at", { ascending: false })

    if (error) {
      // Table might not exist yet or empty
      return { reviews: [], breakdown: defaultBreakdown, userReview: null }
    }

    const reviews = (approvedData || []) as ProductReview[]
    const breakdown = calculateReviewBreakdown(reviews)

    // 2. Fetch authenticated user's own review (even if still pending)
    let userReview: ProductReview | null = null
    const customer = await resolveCustomer()

    if (customer?.email) {
      const { data: userReviewData } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_slug", slug)
        .eq("customer_email", customer.email)
        .maybeSingle()

      if (userReviewData) {
        userReview = userReviewData as ProductReview
      }
    }

    return {
      reviews,
      breakdown,
      userReview,
    }
  } catch (err) {
    console.error("getProductReviewsAction error:", err)
    return { reviews: [], breakdown: defaultBreakdown, userReview: null }
  }
}

/**
 * Storefront Action: Submit or edit a product review.
 * Only logged-in customers can rate and review a product.
 */
export async function submitProductReviewAction(
  input: CreateReviewInput
): Promise<{
  success: boolean
  error?: string
  requiresAuth?: boolean
  message?: string
  review?: ProductReview
}> {
  try {
    // 1. Validation
    const parsed = createReviewSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid review data",
      }
    }

    // 2. Auth Check: ONLY logged-in users can rate and review
    const customer = await resolveCustomer()
    if (!customer?.email) {
      return {
        success: false,
        requiresAuth: true,
        error: "Please sign in to your account to rate and review this product.",
      }
    }

    const supabase = createAdminClient()

    // 3. Look up product details
    const { data: product } = await supabase
      .from("products")
      .select("id, name, slug")
      .eq("slug", parsed.data.productSlug)
      .maybeSingle()

    // 4. Check if customer is a verified buyer of this product
    let isVerifiedBuyer = false
    try {
      const { data: orderMatches } = await supabase
        .from("orders")
        .select("id, status, items")
        .or(`email.ilike.${customer.email}${customer.clerkUserId ? `,clerk_user_id.eq.${customer.clerkUserId}` : ""}`)
        .in("status", ["confirmed", "processing", "shipped", "delivered"])
        .limit(10)

      if (orderMatches && orderMatches.length > 0) {
        // Check line items in order
        for (const order of orderMatches) {
          const items = Array.isArray(order.items) ? order.items : []
          const found = items.some((it: any) =>
            it.slug === parsed.data.productSlug ||
            (product?.id && it.productId === product.id)
          )
          if (found) {
            isVerifiedBuyer = true
            break
          }
        }
      }
    } catch {
      // Verified buyer check non-critical
    }

    const displayName = parsed.data.customerName || customer.name || customer.email.split("@")[0]

    // 5. Save review with 'pending' status for boutique moderation
    const reviewPayload = {
      product_slug: parsed.data.productSlug,
      customer_id: customer.id,
      customer_name: displayName,
      customer_email: customer.email,
      rating: parsed.data.rating,
      title: parsed.data.title,
      comment: parsed.data.comment,
      fit_feedback: parsed.data.fitFeedback || null,
      status: "pending" as ReviewStatus, // Requires admin approval
      is_verified_buyer: isVerifiedBuyer,
      updated_at: new Date().toISOString(),
    }

    // Check if customer already submitted a review for this product
    const { data: existingReview } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("product_slug", parsed.data.productSlug)
      .eq("customer_email", customer.email)
      .maybeSingle()

    let inserted: ProductReview | null = null
    let saveError: any = null

    if (existingReview?.id) {
      const { data, error } = await supabase
        .from("product_reviews")
        .update(reviewPayload)
        .eq("id", existingReview.id)
        .select()
        .single()
      inserted = data as ProductReview
      saveError = error
    } else {
      const { data, error } = await supabase
        .from("product_reviews")
        .insert(reviewPayload)
        .select()
        .single()
      inserted = data as ProductReview
      saveError = error
    }

    if (saveError) {
      console.error("submitProductReviewAction error:", saveError)
      return {
        success: false,
        error: "Unable to submit your review. Please try again.",
      }
    }

    revalidatePath(`/collections/${parsed.data.productSlug}`)
    revalidatePath(`/collections/${parsed.data.productSlug}/reviews`)
    revalidatePath("/admin/reviews")

    return {
      success: true,
      message: existingReview?.id
        ? "Your review has been updated and submitted for review moderation."
        : "Thank you! Your review has been submitted for moderation and will appear once approved by our boutique team.",
      review: inserted as ProductReview,
    }
  } catch (err) {
    console.error("submitProductReviewAction error:", err)
    return {
      success: false,
      error: "An unexpected error occurred while saving your review.",
    }
  }
}

/**
 * Customer Action: Delete customer's own review.
 * Strictly verifies ownership so that only the logged-in review author can delete it.
 */
export async function deleteCustomerReviewAction(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const customer = await resolveCustomer()
    if (!customer?.email) {
      return {
        success: false,
        error: "Please sign in to delete your review.",
      }
    }

    const supabase = createAdminClient()

    // 1. Fetch review to verify customer ownership
    const { data: targetReview, error: fetchError } = await supabase
      .from("product_reviews")
      .select("id, customer_email, product_slug")
      .eq("id", reviewId)
      .maybeSingle()

    if (fetchError || !targetReview) {
      return {
        success: false,
        error: "Review could not be found.",
      }
    }

    // Verify authenticated customer's email matches review record
    const authorEmail = targetReview.customer_email.toLowerCase().trim()
    const activeEmail = customer.email.toLowerCase().trim()
    if (authorEmail !== activeEmail) {
      return {
        success: false,
        error: "You are only permitted to delete reviews submitted from your account.",
      }
    }

    // 2. Delete the review
    const { error: deleteError } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", reviewId)

    if (deleteError) {
      console.error("deleteCustomerReviewAction error:", deleteError)
      return {
        success: false,
        error: "Unable to delete review. Please try again.",
      }
    }

    // 3. Revalidate paths
    revalidatePath(`/collections/${targetReview.product_slug}`)
    revalidatePath(`/collections/${targetReview.product_slug}/reviews`)
    revalidatePath("/admin/reviews")

    return { success: true }
  } catch (err) {
    console.error("deleteCustomerReviewAction error:", err)
    return {
      success: false,
      error: "An unexpected error occurred while deleting your review.",
    }
  }
}

/**
 * Admin Action: Get all reviews with status and search filters.
 */
export async function getAdminReviewsAction(filter?: {
  status?: string
  search?: string
}): Promise<{
  success: boolean
  reviews: ProductReview[]
  stats: {
    pendingCount: number
    approvedCount: number
    rejectedCount: number
    totalCount: number
    averageRating: number
  }
  error?: string
}> {
  const defaultStats = {
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalCount: 0,
    averageRating: 0,
  }

  try {
    const supabase = createAdminClient()

    let query = supabase.from("product_reviews").select("*")

    if (filter?.status && filter.status !== "all") {
      query = query.eq("status", filter.status)
    }

    if (filter?.search) {
      const term = `%${filter.search}%`
      query = query.or(
        `product_slug.ilike.${term},customer_name.ilike.${term},customer_email.ilike.${term},title.ilike.${term}`
      )
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      return { success: false, reviews: [], stats: defaultStats, error: error.message }
    }

    // Fetch storewide review counts
    const { data: allReviews } = await supabase
      .from("product_reviews")
      .select("status, rating")

    let pendingCount = 0
    let approvedCount = 0
    let rejectedCount = 0
    let ratingSum = 0

    if (allReviews) {
      for (const r of allReviews) {
        if (r.status === "pending") pendingCount++
        else if (r.status === "approved") {
          approvedCount++
          ratingSum += r.rating
        } else if (r.status === "rejected") rejectedCount++
      }
    }

    const avg = approvedCount > 0 ? Number((ratingSum / approvedCount).toFixed(1)) : 0

    return {
      success: true,
      reviews: (data || []) as ProductReview[],
      stats: {
        pendingCount,
        approvedCount,
        rejectedCount,
        totalCount: allReviews?.length || 0,
        averageRating: avg,
      },
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load admin reviews"
    return { success: false, reviews: [], stats: defaultStats, error: msg }
  }
}

/**
 * Admin Action: Approve, reject, or reset a review status.
 */
export async function moderateReviewAction(
  input: ModerateReviewInput
): Promise<{ success: boolean; error?: string; review?: ProductReview }> {
  try {
    const parsed = moderateReviewSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid moderation request" }
    }

    const supabase = createAdminClient()

    const updatePayload: Record<string, unknown> = {
      status: parsed.data.status,
      admin_notes: parsed.data.adminNotes ?? null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("product_reviews")
      .update(updatePayload)
      .eq("id", parsed.data.reviewId)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin/reviews")
    if (data?.product_slug) {
      revalidatePath(`/collections/${data.product_slug}`)
    }

    return { success: true, review: data as ProductReview }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to moderate review"
    return { success: false, error: msg }
  }
}

/**
 * Admin Action: Delete a review permanently.
 */
export async function deleteReviewAction(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Retrieve slug first for path revalidation
    const { data: target } = await supabase
      .from("product_reviews")
      .select("product_slug")
      .eq("id", reviewId)
      .maybeSingle()

    const { error } = await supabase.from("product_reviews").delete().eq("id", reviewId)
    if (error) throw error

    revalidatePath("/admin/reviews")
    if (target?.product_slug) {
      revalidatePath(`/collections/${target.product_slug}`)
    }

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete review"
    return { success: false, error: msg }
  }
}
