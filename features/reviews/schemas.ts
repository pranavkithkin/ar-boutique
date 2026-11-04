import { z } from "zod"

export const createReviewSchema = z.object({
  productSlug: z.string().min(1, "Product slug is required"),
  rating: z.number().int().min(1, "Rating must be at least 1 star").max(5, "Rating cannot exceed 5 stars"),
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120, "Title is too long"),
  comment: z.string().trim().min(5, "Review must be at least 5 characters").max(1500, "Review is too long"),
  fitFeedback: z.enum(["runs_small", "true_to_size", "runs_large"]).optional().nullable(),
  customerName: z.string().trim().min(1, "Name is required").max(60).optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>

export const moderateReviewSchema = z.object({
  reviewId: z.string().uuid("Invalid review ID"),
  status: z.enum(["approved", "rejected", "pending"]),
  adminNotes: z.string().max(500).optional().nullable(),
})

export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>
