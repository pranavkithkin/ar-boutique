"use client"

import * as React from "react"
import Link from "next/link"
import { StarRating } from "./StarRating"
import { ReviewFormModal } from "./ReviewFormModal"
import { ReviewItemCard } from "./ReviewItemCard"
import { DeleteReviewDialog } from "./DeleteReviewDialog"
import { Button } from "@/components/ui/button"
import type { ProductReview, ProductReviewsData } from "@/features/reviews/types"
import { calculateReviewBreakdown } from "@/features/reviews/service"
import {
  getProductReviewsAction,
  deleteCustomerReviewAction,
} from "@/features/reviews/actions"
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Edit2,
  MessageSquarePlus,
  Filter,
  ArrowRight,
  Trash2,
} from "lucide-react"

interface ProductReviewsSectionProps {
  productSlug: string
  productName: string
  initialData?: ProductReviewsData
  maxReviews?: number
}

export function ProductReviewsSection({
  productSlug,
  productName,
  initialData,
  maxReviews = 4,
}: ProductReviewsSectionProps) {
  const [data, setData] = React.useState<ProductReviewsData>(
    initialData || {
      reviews: [],
      breakdown: {
        averageRating: 0,
        totalCount: 0,
        ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        fitDistribution: { runs_small: 0, true_to_size: 0, runs_large: 0, totalWithFit: 0 },
      },
      userReview: null,
    }
  )

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [ratingFilter, setRatingFilter] = React.useState<number | null>(null)
  const [reviewToDelete, setReviewToDelete] = React.useState<ProductReview | null>(null)

  // Fetch reviews on mount if not provided or to ensure fresh customer userReview
  React.useEffect(() => {
    let active = true
    getProductReviewsAction(productSlug).then((res) => {
      if (active) setData(res)
    })
    return () => {
      active = false
    }
  }, [productSlug])

  const { reviews, breakdown, userReview } = data
  const totalCount = breakdown.totalCount
  const avgRating = breakdown.averageRating

  // Filtered reviews
  const visibleReviews = React.useMemo(() => {
    if (ratingFilter === null) return reviews
    return reviews.filter((r) => Math.round(r.rating) === ratingFilter)
  }, [reviews, ratingFilter])

  // Limit reviews shown on PDP to maxReviews (e.g., 4)
  const displayedReviews = React.useMemo(() => {
    if (typeof maxReviews === "number" && maxReviews > 0) {
      return visibleReviews.slice(0, maxReviews)
    }
    return visibleReviews
  }, [visibleReviews, maxReviews])

  const hasMoreReviews =
    typeof maxReviews === "number" &&
    maxReviews > 0 &&
    (visibleReviews.length > maxReviews || totalCount > maxReviews)

  // Fit percentage calculation
  const trueToSizePercent =
    breakdown.fitDistribution.totalWithFit > 0
      ? Math.round(
          (breakdown.fitDistribution.true_to_size /
            breakdown.fitDistribution.totalWithFit) *
            100
        )
      : null

  const handleReviewSuccess = (savedReview: ProductReview) => {
    setData((prev) => {
      const existingIdx = prev.reviews.findIndex((r) => r.id === savedReview.id)
      const newReviews = [...prev.reviews]
      if (existingIdx >= 0) {
        newReviews[existingIdx] = savedReview
      } else if (savedReview.status === "approved") {
        newReviews.unshift(savedReview)
      }
      return {
        ...prev,
        reviews: newReviews,
        breakdown: calculateReviewBreakdown(newReviews),
        userReview: savedReview,
      }
    })
  }

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return
    const res = await deleteCustomerReviewAction(reviewToDelete.id)
    if (res.success) {
      setData((prev) => {
        const newReviews = prev.reviews.filter((r) => r.id !== reviewToDelete.id)
        return {
          ...prev,
          reviews: newReviews,
          breakdown: calculateReviewBreakdown(newReviews),
          userReview: prev.userReview?.id === reviewToDelete.id ? null : prev.userReview,
        }
      })
      setReviewToDelete(null)
      setIsModalOpen(false)
    }
  }

  return (
    <section id="product-reviews" className="mt-20 pt-16 border-t border-border scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-1">
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3 text-amber-500" />
            Verified Client Feedback
          </span>
          <h2 className="font-sans font-semibold text-2xl sm:text-3xl text-foreground tracking-tight">
            Client Reviews & Ratings
          </h2>
        </div>

        {/* Action Button */}
        <div>
          <Button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-none h-10 px-5 text-xs uppercase tracking-widest font-sans font-medium"
          >
            {userReview ? (
              <>
                <Edit2 className="size-3.5 mr-2" />
                Edit Your Review
              </>
            ) : (
              <>
                <MessageSquarePlus className="size-3.5 mr-2" />
                Write a Review
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Customer's Own Review Banner (if pending moderation) */}
      {userReview && userReview.status === "pending" && (
        <div className="mb-8 p-4 border border-amber-500/30 bg-amber-500/5 rounded-none flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-foreground">
                Your review is currently pending boutique approval
              </p>
              <p className="text-muted-foreground">
                Our team reviews all client submissions to maintain quality and authenticity. It will appear publicly as soon as approved.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="rounded-none h-8 text-[11px] px-2.5 font-sans gap-1"
            >
              <Edit2 className="size-3" />
              <span>Edit</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReviewToDelete(userReview)}
              className="rounded-none h-8 text-[11px] px-2.5 font-sans text-destructive hover:bg-destructive/10 gap-1"
            >
              <Trash2 className="size-3" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      )}

      {/* Summary Scorecard & Breakdown */}
      {totalCount > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-8 bg-muted/20 border border-border mb-12">
          {/* Average Score Column */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center lg:border-r lg:border-border lg:pr-8 py-2">
            <span className="font-sans font-bold text-5xl sm:text-6xl text-foreground tracking-tight">
              {avgRating.toFixed(1)}
            </span>
            <div className="my-2">
              <StarRating rating={avgRating} size="md" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              Based on {totalCount} {totalCount === 1 ? "review" : "reviews"}
            </p>

            {trueToSizePercent !== null && (
              <div className="mt-4 pt-4 border-t border-border/60 w-full max-w-[200px]">
                <p className="text-xs font-sans font-semibold text-foreground">
                  {trueToSizePercent}%
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Report True to Size
                </p>
              </div>
            )}
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="lg:col-span-8 space-y-2.5 justify-center flex flex-col">
            {([5, 4, 3, 2, 1] as const).map((stars) => {
              const count = breakdown.ratingCounts[stars] || 0
              const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
              const isSelected = ratingFilter === stars

              return (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setRatingFilter(isSelected ? null : stars)}
                  className={`group flex items-center gap-3 text-xs w-full text-left p-1 rounded-none transition-colors ${
                    isSelected ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="w-12 text-[11px] font-sans font-medium text-foreground group-hover:text-primary shrink-0">
                    {stars} Star{stars > 1 ? "s" : ""}
                  </span>
                  <div className="flex-1 h-2 bg-muted/60 overflow-hidden rounded-none border border-border/40">
                    <div
                      className="h-full bg-amber-400 dark:bg-amber-300 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-[11px] text-muted-foreground text-right shrink-0">
                    {percentage}%
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="py-12 text-center p-8 bg-muted/20 border border-border mb-12 space-y-3">
          <p className="font-sans font-semibold text-lg text-foreground tracking-tight">
            No client reviews yet
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Be the first to share your thoughts on the silhouette, fabric, and sizing of this piece.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="rounded-none text-xs uppercase tracking-widest font-sans mt-2"
          >
            Review This Garment
          </Button>
        </div>
      )}

      {/* Filter Bar (if multiple reviews) */}
      {totalCount > 1 && (
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            <span className="font-medium text-foreground">
              Showing: {ratingFilter ? `${ratingFilter} Star Reviews` : "All Reviews"} ({visibleReviews.length})
            </span>
          </div>

          {ratingFilter !== null && (
            <button
              type="button"
              onClick={() => setRatingFilter(null)}
              className="text-xs text-primary hover:underline uppercase tracking-wider font-medium"
            >
              Clear Filter
            </button>
          )}
        </div>
      )}

      {/* Reviews Cards List (up to 4 displayed) */}
      <div className="divide-y divide-border">
        {displayedReviews.map((r) => {
          const isUserReview = userReview ? userReview.id === r.id : false
          return (
            <ReviewItemCard
              key={r.id}
              review={r}
              isOwner={isUserReview}
              onEdit={() => setIsModalOpen(true)}
              onDelete={() => setReviewToDelete(r)}
            />
          )
        })}
      </div>

      {/* Read More Reviews Button */}
      {hasMoreReviews && (
        <div className="pt-8 text-center border-t border-border mt-2">
          <Link
            href={`/collections/${productSlug}/reviews`}
            className="inline-flex items-center justify-center gap-2 px-8 h-12 border border-foreground bg-foreground text-background hover:bg-foreground/90 text-xs uppercase font-medium tracking-widest transition-colors rounded-none font-sans"
          >
            <span>Read More Reviews ({totalCount})</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* Review Modal */}
      <ReviewFormModal
        productSlug={productSlug}
        productName={productName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingReview={userReview}
        onSuccess={handleReviewSuccess}
        onDelete={() => {
          setIsModalOpen(false)
          if (userReview) setReviewToDelete(userReview)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteReviewDialog
        open={Boolean(reviewToDelete)}
        onOpenChange={(open) => !open && setReviewToDelete(null)}
        reviewTitle={reviewToDelete?.title}
        onConfirm={handleConfirmDelete}
      />
    </section>
  )
}
