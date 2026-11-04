import type { ProductReview, ReviewBreakdown } from "./types"

/**
 * Calculates rating breakdown statistics from a list of approved reviews.
 */
export function calculateReviewBreakdown(reviews: ProductReview[]): ReviewBreakdown {
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const fitDistribution = {
    runs_small: 0,
    true_to_size: 0,
    runs_large: 0,
    totalWithFit: 0,
  }

  let totalRatingSum = 0

  for (const r of reviews) {
    const rInt = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5
    ratingCounts[rInt]++
    totalRatingSum += r.rating

    if (r.fit_feedback) {
      if (r.fit_feedback === "runs_small") fitDistribution.runs_small++
      else if (r.fit_feedback === "true_to_size") fitDistribution.true_to_size++
      else if (r.fit_feedback === "runs_large") fitDistribution.runs_large++
      fitDistribution.totalWithFit++
    }
  }

  const totalCount = reviews.length
  const averageRating = totalCount > 0 ? Number((totalRatingSum / totalCount).toFixed(1)) : 0

  return {
    averageRating,
    totalCount,
    ratingCounts,
    fitDistribution,
  }
}
