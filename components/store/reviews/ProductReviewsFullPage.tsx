"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Sparkles, Filter, MessageSquarePlus, Edit2, ArrowUpDown, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { StarRating } from "./StarRating"
import { ReviewItemCard } from "./ReviewItemCard"
import { ReviewFormModal } from "./ReviewFormModal"
import { DeleteReviewDialog } from "./DeleteReviewDialog"
import type { ProductDetail } from "@/lib/product-detail"
import type { ProductReview, ProductReviewsData } from "@/features/reviews/types"
import { calculateReviewBreakdown } from "@/features/reviews/service"
import { deleteCustomerReviewAction } from "@/features/reviews/actions"
import { formatAED } from "@/lib/money"

interface ProductReviewsFullPageProps {
  product: ProductDetail
  initialData: ProductReviewsData
}

type SortOption = "newest" | "highest" | "lowest"

export function ProductReviewsFullPage({
  product,
  initialData,
}: ProductReviewsFullPageProps) {
  const [data, setData] = React.useState<ProductReviewsData>(initialData)
  const [ratingFilter, setRatingFilter] = React.useState<number | null>(null)
  const [sortBy, setSortBy] = React.useState<SortOption>("newest")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [reviewToDelete, setReviewToDelete] = React.useState<ProductReview | null>(null)

  const { reviews, breakdown, userReview } = data
  const totalCount = breakdown.totalCount
  const avgRating = breakdown.averageRating

  // Filter and sort reviews
  const filteredAndSortedReviews = React.useMemo(() => {
    let list = [...reviews]

    if (ratingFilter !== null) {
      list = list.filter((r) => Math.round(r.rating) === ratingFilter)
    }

    if (sortBy === "highest") {
      list.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === "lowest") {
      list.sort((a, b) => a.rating - b.rating)
    } else {
      // Default: newest first
      list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    return list
  }, [reviews, ratingFilter, sortBy])

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

  // Primary product image
  const productImage =
    product.colourways?.[0]?.images?.[0] || product.images?.[0] || "/images/placeholder.jpg"

  // Primary price
  const primaryPriceFils =
    product.colourways?.[0]?.sizes?.[0]?.priceFils || 9000

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6 pb-24">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList className="text-xs sm:text-sm font-sans">
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="text-primary hover:text-primary/80">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/collections" className="text-primary hover:text-primary/80">
              Collections
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/collections/${product.slug}`}
              className="text-primary hover:text-primary/80 line-clamp-1 max-w-[160px] sm:max-w-none"
            >
              {product.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-muted-foreground">
              Customer Reviews
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Product Summary Header Banner */}
      <div className="p-4 sm:p-6 bg-secondary/40 border border-border rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-20 sm:w-20 sm:h-24 bg-muted overflow-hidden border border-border/60 shrink-0">
            <Image
              src={productImage}
              alt={product.name}
              fill
              sizes="80px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-muted-foreground">
              {product.brand || "AR Boutique Atelier"}
            </span>
            <h1 className="font-sans font-semibold text-lg sm:text-xl text-foreground tracking-tight">
              {product.name}
            </h1>
            <p className="text-xs font-sans text-muted-foreground">
              SKU: <span className="font-mono text-foreground">{product.sku}</span> •{" "}
              <span className="font-semibold text-foreground">
                {formatAED(primaryPriceFils)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/collections/${product.slug}`}
            className="inline-flex items-center gap-2 px-4 h-10 border border-border bg-background hover:bg-muted/50 text-foreground text-xs uppercase font-medium tracking-wider transition-colors rounded-none font-sans"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Product</span>
          </Link>
        </div>
      </div>

      {/* Main Reviews Header & Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-border">
        <div className="space-y-1">
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3 text-amber-500" />
            Verified Client Feedback
          </span>
          <h2 className="font-sans font-semibold text-2xl sm:text-3xl text-foreground tracking-tight">
            All Customer Reviews
          </h2>
          <p className="text-xs font-sans text-muted-foreground">
            Read verified experiences and styling notes from clients who purchased this garment.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-none h-11 px-6 text-xs uppercase tracking-widest font-sans font-medium"
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

      {/* Customer's Own Review Banner (if pending moderation) */}
      {userReview && userReview.status === "pending" && (
        <div className="mb-8 p-4 border border-amber-500/30 bg-amber-500/5 rounded-none flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-foreground font-sans">
                Your review is currently pending boutique approval
              </p>
              <p className="text-muted-foreground font-sans">
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

      {/* Scorecard & Breakdown */}
      {totalCount > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-8 bg-muted/20 border border-border mb-10">
          {/* Average Score */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center lg:border-r lg:border-border lg:pr-8 py-2">
            <span className="font-sans font-bold text-5xl sm:text-6xl text-foreground tracking-tight">
              {avgRating.toFixed(1)}
            </span>
            <div className="my-2">
              <StarRating rating={avgRating} size="md" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium font-sans">
              Based on {totalCount} {totalCount === 1 ? "review" : "reviews"}
            </p>

            {trueToSizePercent !== null && (
              <div className="mt-4 pt-4 border-t border-border/60 w-full max-w-[200px]">
                <p className="text-xs font-sans font-semibold text-foreground">
                  {trueToSizePercent}%
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-sans">
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
                  className={`group flex items-center gap-3 text-xs w-full text-left p-1.5 rounded-none transition-colors ${
                    isSelected ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="w-14 text-[11px] font-sans font-medium text-foreground group-hover:text-primary shrink-0">
                    {stars} Star{stars > 1 ? "s" : ""}
                  </span>
                  <div className="flex-1 h-2 bg-muted/60 overflow-hidden rounded-none border border-border/40">
                    <div
                      className="h-full bg-amber-400 dark:bg-amber-300 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-[11px] text-muted-foreground text-right shrink-0 font-sans">
                    {count} ({percentage}%)
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center p-8 bg-muted/20 border border-border mb-10 space-y-3">
          <p className="font-sans font-semibold text-lg text-foreground tracking-tight">
            No client reviews yet
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto font-sans">
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

      {/* Filter and Sort Toolbar */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans flex-wrap">
            <Filter className="size-3.5" />
            <span>
              Showing:{" "}
              <strong className="text-foreground font-medium">
                {ratingFilter ? `${ratingFilter} Star Reviews` : "All Reviews"}
              </strong>{" "}
              ({filteredAndSortedReviews.length})
            </span>

            {ratingFilter !== null && (
              <button
                type="button"
                onClick={() => setRatingFilter(null)}
                className="ml-2 text-xs text-primary hover:underline uppercase tracking-wider font-medium"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs font-sans">
            <ArrowUpDown className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Sort:</span>
            <div className="flex items-center border border-border">
              <button
                type="button"
                onClick={() => setSortBy("newest")}
                className={`px-3 py-1.5 transition-colors ${
                  sortBy === "newest"
                    ? "bg-foreground text-background font-medium"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Newest
              </button>
              <button
                type="button"
                onClick={() => setSortBy("highest")}
                className={`px-3 py-1.5 border-l border-border transition-colors ${
                  sortBy === "highest"
                    ? "bg-foreground text-background font-medium"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Highest
              </button>
              <button
                type="button"
                onClick={() => setSortBy("lowest")}
                className={`px-3 py-1.5 border-l border-border transition-colors ${
                  sortBy === "lowest"
                    ? "bg-foreground text-background font-medium"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Lowest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review List */}
      {filteredAndSortedReviews.length > 0 ? (
        <div className="divide-y divide-border">
          {filteredAndSortedReviews.map((r) => {
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
      ) : totalCount > 0 ? (
        <div className="py-12 text-center p-8 border border-border bg-card space-y-2">
          <p className="font-sans font-medium text-sm text-foreground">
            No reviews match the selected filter.
          </p>
          <button
            type="button"
            onClick={() => setRatingFilter(null)}
            className="text-xs text-primary hover:underline uppercase tracking-wider font-medium font-sans"
          >
            Show All Reviews
          </button>
        </div>
      ) : null}

      {/* Review Submission Modal */}
      <ReviewFormModal
        productSlug={product.slug}
        productName={product.name}
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
    </div>
  )
}
