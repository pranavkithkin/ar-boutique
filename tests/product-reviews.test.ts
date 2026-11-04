import { describe, it, expect } from "vitest"
import { calculateReviewBreakdown } from "@/features/reviews/service"
import { createReviewSchema, moderateReviewSchema } from "@/features/reviews/schemas"
import type { ProductReview } from "@/features/reviews/types"

describe("Product Reviews Feature", () => {
  describe("Rating Breakdown Calculations", () => {
    it("returns zero stats when reviews list is empty", () => {
      const breakdown = calculateReviewBreakdown([])

      expect(breakdown.totalCount).toBe(0)
      expect(breakdown.averageRating).toBe(0)
      expect(breakdown.ratingCounts).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
      expect(breakdown.fitDistribution.totalWithFit).toBe(0)
    })

    it("accurately calculates average rating and star counts", () => {
      const mockReviews: ProductReview[] = [
        {
          id: "1",
          product_slug: "linen-dress",
          customer_name: "Fatima",
          customer_email: "fatima@example.com",
          rating: 5,
          title: "Stunning craftsmanship",
          comment: "Fabric feels incredible.",
          fit_feedback: "true_to_size",
          status: "approved",
          is_verified_buyer: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          product_slug: "linen-dress",
          customer_name: "Mariam",
          customer_email: "mariam@example.com",
          rating: 4,
          title: "Lovely silhouette",
          comment: "Very elegant drape.",
          fit_feedback: "true_to_size",
          status: "approved",
          is_verified_buyer: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          product_slug: "linen-dress",
          customer_name: "Layla",
          customer_email: "layla@example.com",
          rating: 5,
          title: "Perfection",
          comment: "Will order in another colour.",
          fit_feedback: "runs_small",
          status: "approved",
          is_verified_buyer: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      const breakdown = calculateReviewBreakdown(mockReviews)

      // Average: (5 + 4 + 5) / 3 = 14 / 3 = 4.666... -> 4.7
      expect(breakdown.totalCount).toBe(3)
      expect(breakdown.averageRating).toBe(4.7)
      expect(breakdown.ratingCounts[5]).toBe(2)
      expect(breakdown.ratingCounts[4]).toBe(1)
      expect(breakdown.ratingCounts[3]).toBe(0)

      // Fit Distribution
      expect(breakdown.fitDistribution.totalWithFit).toBe(3)
      expect(breakdown.fitDistribution.true_to_size).toBe(2)
      expect(breakdown.fitDistribution.runs_small).toBe(1)
      expect(breakdown.fitDistribution.runs_large).toBe(0)
    })
  })

  describe("Review Validation Schemas", () => {
    it("accepts valid review submission payload", () => {
      const validPayload = {
        productSlug: "silk-abaya-noir",
        rating: 5,
        title: "Exceptional quality",
        comment: "The drape and weight are truly luxurious. Fits beautifully.",
        fitFeedback: "true_to_size" as const,
        customerName: "Amina K.",
      }

      const res = createReviewSchema.safeParse(validPayload)
      expect(res.success).toBe(true)
    })

    it("rejects reviews with ratings out of range", () => {
      const lowRating = {
        productSlug: "silk-abaya-noir",
        rating: 0,
        title: "Too small",
        comment: "Did not fit well.",
      }

      const highRating = {
        productSlug: "silk-abaya-noir",
        rating: 6,
        title: "Way too high",
        comment: "Not possible rating.",
      }

      expect(createReviewSchema.safeParse(lowRating).success).toBe(false)
      expect(createReviewSchema.safeParse(highRating).success).toBe(false)
    })

    it("rejects blank or overly short comments", () => {
      const shortComment = {
        productSlug: "silk-abaya-noir",
        rating: 4,
        title: "Good",
        comment: "Ok",
      }

      const res = createReviewSchema.safeParse(shortComment)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0]?.message).toContain("Review must be at least 5 characters")
      }
    })

    it("validates admin moderation action payload", () => {
      const valid = {
        reviewId: "11111111-2222-3333-4444-555555555555",
        status: "approved" as const,
        adminNotes: "Verified customer order via Dubai showroom",
      }

      expect(moderateReviewSchema.safeParse(valid).success).toBe(true)

      const invalidStatus = {
        reviewId: "11111111-2222-3333-4444-555555555555",
        status: "unknown_status",
      }

      expect(moderateReviewSchema.safeParse(invalidStatus).success).toBe(false)
    })
  })
})
