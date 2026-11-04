"use client"

import * as React from "react"
import { CheckCircle2, Edit2, Trash2 } from "lucide-react"
import { StarRating } from "./StarRating"
import type { ProductReview } from "@/features/reviews/types"

interface ReviewItemCardProps {
  review: ProductReview
  isOwner?: boolean
  onEdit?: (review: ProductReview) => void
  onDelete?: (review: ProductReview) => void
}

export function ReviewItemCard({
  review,
  isOwner,
  onEdit,
  onDelete,
}: ReviewItemCardProps) {
  const formattedDate = new Date(review.created_at).toLocaleDateString("en-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <div className="py-6 sm:py-8 space-y-3">
      {/* Header row: Star rating + Client name + Verified Buyer badge + Date & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <StarRating rating={review.rating} size="sm" />
          <span className="font-sans font-medium text-xs text-foreground">
            {review.customer_name}
          </span>
          {isOwner && (
            <span className="inline-flex items-center text-[10px] font-sans font-medium text-primary bg-primary/10 px-1.5 py-0.2 border border-primary/20">
              Your Review
            </span>
          )}
          {review.is_verified_buyer && (
            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
              <CheckCircle2 className="size-3" />
              Verified Buyer
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-[11px] text-muted-foreground font-sans">
            {formattedDate}
          </span>

          {isOwner && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-border">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(review)}
                  title="Edit your review"
                  className="inline-flex items-center gap-1 text-[11px] font-sans text-muted-foreground hover:text-foreground p-1 transition-colors"
                >
                  <Edit2 className="size-3" />
                  <span>Edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(review)}
                  title="Delete your review"
                  className="inline-flex items-center gap-1 text-[11px] font-sans text-muted-foreground hover:text-destructive p-1 transition-colors"
                >
                  <Trash2 className="size-3" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Headline & Fit Pill */}
      <div className="flex items-center gap-2 flex-wrap">
        <h4 className="font-sans text-sm font-semibold text-foreground tracking-tight">
          {review.title}
        </h4>
        {review.fit_feedback && (
          <span className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground border border-border/80 px-2 py-0.5 bg-background">
            {review.fit_feedback === "true_to_size" && "True to Size"}
            {review.fit_feedback === "runs_small" && "Runs Small"}
            {review.fit_feedback === "runs_large" && "Runs Large"}
          </span>
        )}
      </div>

      {/* Comment Body */}
      <p className="text-xs text-muted-foreground leading-relaxed font-sans whitespace-pre-line">
        {review.comment}
      </p>
    </div>
  )
}
