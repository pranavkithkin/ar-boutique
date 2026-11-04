"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { StarRating } from "./StarRating"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { submitProductReviewAction } from "@/features/reviews/actions"
import type { FitFeedback, ProductReview } from "@/features/reviews/types"
import { X, Loader2, CheckCircle2, Lock, Sparkles, Trash2 } from "lucide-react"

interface ReviewFormModalProps {
  productSlug: string
  productName: string
  isOpen: boolean
  onClose: () => void
  existingReview?: ProductReview | null
  onSuccess: (review: ProductReview) => void
  onDelete?: (reviewId: string) => void
}

export function ReviewFormModal({
  productSlug,
  productName,
  isOpen,
  onClose,
  existingReview,
  onSuccess,
  onDelete,
}: ReviewFormModalProps) {
  const pathname = usePathname()

  const [rating, setRating] = React.useState<number>(existingReview?.rating || 5)
  const [title, setTitle] = React.useState(existingReview?.title || "")
  const [comment, setComment] = React.useState(existingReview?.comment || "")
  const [fitFeedback, setFitFeedback] = React.useState<FitFeedback | null>(
    existingReview?.fit_feedback || "true_to_size"
  )
  const [customerName, setCustomerName] = React.useState(existingReview?.customer_name || "")

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [requiresAuth, setRequiresAuth] = React.useState(false)
  const [isSubmittedSuccess, setIsSubmittedSuccess] = React.useState(false)

  // Sync when existingReview changes
  React.useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating)
      setTitle(existingReview.title)
      setComment(existingReview.comment)
      setFitFeedback(existingReview.fit_feedback || null)
      setCustomerName(existingReview.customer_name)
    }
  }, [existingReview])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (rating < 1 || rating > 5) {
      setErrorMessage("Please select a rating between 1 and 5 stars.")
      return
    }

    if (title.trim().length < 2) {
      setErrorMessage("Please enter a short headline for your review.")
      return
    }

    if (comment.trim().length < 5) {
      setErrorMessage("Please write at least a few words about your experience.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await submitProductReviewAction({
        productSlug,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        fitFeedback: fitFeedback || null,
        customerName: customerName.trim() || undefined,
      })

      if (!res.success) {
        if (res.requiresAuth) {
          setRequiresAuth(true)
        } else {
          setErrorMessage(res.error || "Failed to submit review. Please try again.")
        }
        setIsSubmitting(false)
        return
      }

      if (res.review) {
        onSuccess(res.review)
      }
      setIsSubmittedSuccess(true)
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-card border border-border rounded-none shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3 text-amber-500" />
              Client Experience
            </span>
            <h2 className="font-sans text-xl font-semibold text-foreground tracking-tight mt-1">
              {existingReview ? "Edit Your Review" : "Write a Review"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {productName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-none hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Auth Required State */}
        {requiresAuth ? (
          <div className="py-6 text-center space-y-4">
            <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-primary">
              <Lock className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-sans text-base font-semibold text-foreground">
                Sign In Required
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                To maintain authentic client ratings, only verified boutique account holders can review our garments.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="rounded-none text-xs w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-none text-xs uppercase tracking-widest font-sans w-full sm:w-auto"
                render={
                  <Link
                    href={`/sign-in?redirect_url=${encodeURIComponent(pathname)}`}
                  />
                }
              >
                Sign In to Review
              </Button>
            </div>
          </div>
        ) : isSubmittedSuccess ? (
          /* Submission Success State */
          <div className="py-8 text-center space-y-4">
            <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-sans text-lg font-semibold text-foreground">
                Review Received
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Thank you for your valuable feedback. To ensure boutique standards, reviews are verified by our team and will be published shortly.
              </p>
            </div>
            <div className="pt-3">
              <Button
                type="button"
                onClick={onClose}
                className="rounded-none text-xs uppercase tracking-widest font-sans px-6"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-none">
                {errorMessage}
              </div>
            )}

            {/* Star Rating Selector */}
            <div className="space-y-2 text-center py-2 bg-muted/20 border border-border/50">
              <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Overall Rating
              </label>
              <div className="flex justify-center">
                <StarRating
                  rating={rating}
                  interactive
                  size="lg"
                  onChange={(newVal) => setRating(newVal)}
                />
              </div>
              <p className="text-[11px] font-sans font-medium text-foreground">
                {rating === 5 && "Flawless — 5 Stars"}
                {rating === 4 && "Great — 4 Stars"}
                {rating === 3 && "Good — 3 Stars"}
                {rating === 2 && "Fair — 2 Stars"}
                {rating === 1 && "Poor — 1 Star"}
              </p>
            </div>

            {/* Sizing & Fit Feedback */}
            <div className="space-y-2">
              <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Fit & Sizing Experience
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "runs_small", label: "Runs Small" },
                    { value: "true_to_size", label: "True to Size" },
                    { value: "runs_large", label: "Runs Large" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFitFeedback(opt.value)}
                    className={`py-2 px-3 text-xs font-sans rounded-none border transition-all text-center ${
                      fitFeedback === opt.value
                        ? "border-primary bg-primary text-primary-foreground font-medium"
                        : "border-input bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Headline Title */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Review Headline <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Exquisite tailoring and drape"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
                className="rounded-none text-xs h-9"
              />
            </div>

            {/* Review Comment Body */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Your Review <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Share your thoughts on the silhouette, fabric weight, craftsmanship, and how you styled it..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1500}
                rows={4}
                required
                className="rounded-none text-xs resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {comment.length}/1500
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Public Display Name (Optional)
              </label>
              <Input
                placeholder="e.g. Sarah M."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                maxLength={60}
                className="rounded-none text-xs h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Your email will remain private and is never shown publicly.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
              {existingReview?.id && onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onDelete(existingReview.id)}
                  disabled={isSubmitting}
                  className="rounded-none h-9 text-xs px-3 text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete Review</span>
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-none h-9 text-xs px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-none h-9 text-xs px-6 uppercase tracking-widest font-sans font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      Submitting...
                    </>
                  ) : (
                    <span>{existingReview ? "Update Review" : "Submit for Review"}</span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
