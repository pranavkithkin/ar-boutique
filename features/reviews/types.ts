export type ReviewStatus = "pending" | "approved" | "rejected"
export type FitFeedback = "runs_small" | "true_to_size" | "runs_large"

export interface ProductReview {
  id: string
  product_id?: string
  product_slug: string
  product_name?: string
  customer_id?: string | null
  customer_name: string
  customer_email: string
  rating: number // 1 to 5
  title: string
  comment: string
  fit_feedback?: FitFeedback | null
  status: ReviewStatus
  is_verified_buyer: boolean
  admin_notes?: string | null
  created_at: string
  updated_at: string
  approved_at?: string | null
}

export interface ReviewBreakdown {
  averageRating: number
  totalCount: number
  ratingCounts: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  fitDistribution: {
    runs_small: number
    true_to_size: number
    runs_large: number
    totalWithFit: number
  }
}

export interface ProductReviewsData {
  reviews: ProductReview[]
  breakdown: ReviewBreakdown
  userReview?: ProductReview | null
}
