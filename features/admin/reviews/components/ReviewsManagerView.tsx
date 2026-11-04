"use client"

import * as React from "react"
import Link from "next/link"
import { StarRating } from "@/components/store/reviews/StarRating"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  moderateReviewAction,
  deleteReviewAction,
  getAdminReviewsAction,
} from "@/features/reviews/actions"
import type { ProductReview, ReviewStatus } from "@/features/reviews/types"
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Search,
  ExternalLink,
  Loader2,
  AlertCircle,
  Star,
  Check,
  RotateCcw,
} from "lucide-react"
import { AdminDeleteReviewDialog } from "./AdminDeleteReviewDialog"

interface ReviewsManagerViewProps {
  initialReviews: ProductReview[]
  initialStats: {
    pendingCount: number
    approvedCount: number
    rejectedCount: number
    totalCount: number
    averageRating: number
  }
}

export function ReviewsManagerView({
  initialReviews,
  initialStats,
}: ReviewsManagerViewProps) {
  const [reviews, setReviews] = React.useState<ProductReview[]>(initialReviews)
  const [stats, setStats] = React.useState(initialStats)
  const [activeTab, setActiveTab] = React.useState<"all" | ReviewStatus>("pending")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null)
  const [errorNotice, setErrorNotice] = React.useState<string | null>(null)
  const [reviewToDelete, setReviewToDelete] = React.useState<ProductReview | null>(null)

  // Filter reviews locally or by active tab
  const displayedReviews = React.useMemo(() => {
    return reviews.filter((r) => {
      const matchesTab = activeTab === "all" ? true : r.status === activeTab
      if (!matchesTab) return false

      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase().trim()
      return (
        r.product_name?.toLowerCase().includes(term) ||
        r.product_slug.toLowerCase().includes(term) ||
        r.customer_name.toLowerCase().includes(term) ||
        r.customer_email.toLowerCase().includes(term) ||
        r.title.toLowerCase().includes(term) ||
        r.comment.toLowerCase().includes(term)
      )
    })
  }, [reviews, activeTab, searchTerm])

  const handleModerate = async (reviewId: string, status: ReviewStatus) => {
    setActionLoadingId(reviewId)
    setErrorNotice(null)

    try {
      const res = await moderateReviewAction({ reviewId, status })
      if (!res.success) {
        setErrorNotice(res.error || "Failed to update review status")
        return
      }

      // Optimistically update
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, status, approved_at: status === "approved" ? new Date().toISOString() : r.approved_at } : r
        )
      )

      // Refresh stats
      const fresh = await getAdminReviewsAction()
      if (fresh.success) {
        setStats(fresh.stats)
      }
    } catch {
      setErrorNotice("An unexpected error occurred during moderation.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleConfirmDelete = async (reviewId: string) => {
    setActionLoadingId(reviewId)
    setErrorNotice(null)

    try {
      const res = await deleteReviewAction(reviewId)
      if (!res.success) {
        setErrorNotice(res.error || "Failed to delete review")
        return
      }

      // Remove from list
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))

      // Refresh stats
      const fresh = await getAdminReviewsAction()
      if (fresh.success) {
        setStats(fresh.stats)
      }
    } catch {
      setErrorNotice("An unexpected error occurred while deleting the review.")
    } finally {
      setActionLoadingId(null)
      setReviewToDelete(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Luxury Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3 text-amber-500" />
            Client Experience & Quality Control
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mt-1">
            Product Reviews & Ratings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Moderate client ratings and product feedback before they publish live to the boutique storefront.
          </p>
        </div>
      </div>

      {errorNotice && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-none flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Moderation */}
        <div
          className={`p-5 rounded-none border transition-all ${
            stats.pendingCount > 0
              ? "bg-amber-500/10 border-amber-500/40 text-foreground"
              : "bg-card border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans uppercase tracking-widest text-muted-foreground font-medium">
              Pending Approval
            </span>
            <Clock
              className={`size-4 ${
                stats.pendingCount > 0 ? "text-amber-500" : "text-muted-foreground"
              }`}
            />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-sans text-3xl font-semibold text-foreground tabular-nums">
              {stats.pendingCount}
            </span>
            {stats.pendingCount > 0 && (
              <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-medium">
                Action required
              </span>
            )}
          </div>
        </div>

        {/* Live Published */}
        <div className="p-5 bg-card border border-border rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans uppercase tracking-widest text-muted-foreground font-medium">
              Live & Approved
            </span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="font-sans text-3xl font-semibold text-foreground tabular-nums">
              {stats.approvedCount}
            </span>
          </div>
        </div>

        {/* Average Rating */}
        <div className="p-5 bg-card border border-border rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans uppercase tracking-widest text-muted-foreground font-medium">
              Storewide Average
            </span>
            <Star className="size-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-sans text-3xl font-semibold text-foreground tabular-nums">
              {stats.averageRating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground font-sans">
              / 5.0
            </span>
          </div>
        </div>

        {/* Total Submissions */}
        <div className="p-5 bg-card border border-border rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans uppercase tracking-widest text-muted-foreground font-medium">
              Total Submissions
            </span>
            <Sparkles className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <span className="font-sans text-3xl font-semibold text-foreground tabular-nums">
              {stats.totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: "pending", label: "Pending Approval", count: stats.pendingCount },
            { id: "approved", label: "Approved (Live)", count: stats.approvedCount },
            { id: "rejected", label: "Rejected", count: stats.rejectedCount },
            { id: "all", label: "All Reviews", count: stats.totalCount },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 text-xs font-sans rounded-none transition-all flex items-center gap-2 border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary font-medium"
                    : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search garment, client, text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-none"
          />
        </div>
      </div>

      {/* Reviews Table / Card List */}
      {displayedReviews.length === 0 ? (
        <div className="p-12 text-center border border-border bg-card rounded-none space-y-3">
          <p className="font-sans text-base font-semibold text-foreground">
            No reviews found
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {activeTab === "pending"
              ? "All submitted client reviews have been processed! No pending submissions require moderation."
              : "No reviews match the current filter or search criteria."}
          </p>
        </div>
      ) : (
        <div className="border border-border bg-card rounded-none divide-y divide-border">
          {displayedReviews.map((r) => {
            const isLoading = actionLoadingId === r.id
            const dateStr = new Date(r.created_at).toLocaleDateString("en-AE", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })

            return (
              <div
                key={r.id}
                className="p-6 transition-colors hover:bg-muted/10 space-y-4"
              >
                {/* Header row: Product name + Client info + Status badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/collections/${r.product_slug}`}
                        target="_blank"
                        className="font-sans text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        {r.product_name || r.product_slug}
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </Link>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        ({r.product_slug})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium text-foreground">
                        {r.customer_name}
                      </span>
                      <span>•</span>
                      <span>{r.customer_email}</span>
                      {r.is_verified_buyer && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/20">
                            <CheckCircle2 className="size-2.5" />
                            Verified Buyer
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status Badge & Date */}
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground font-sans">
                      {dateStr}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 border ${
                        r.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : r.status === "rejected"
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>

                {/* Rating & Review Content */}
                <div className="space-y-2 bg-muted/20 p-4 border border-border/60">
                  <div className="flex items-center gap-3 flex-wrap">
                    <StarRating rating={r.rating} size="sm" />
                    <span className="font-sans text-xs font-semibold text-foreground">
                      {r.title}
                    </span>
                    {r.fit_feedback && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 bg-background">
                        Fit: {r.fit_feedback === "true_to_size" && "True to Size"}
                        {r.fit_feedback === "runs_small" && "Runs Small"}
                        {r.fit_feedback === "runs_large" && "Runs Large"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/90 font-sans leading-relaxed whitespace-pre-line">
                    {r.comment}
                  </p>
                </div>

                {/* Moderation Action Buttons */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="text-[11px] text-muted-foreground">
                    {r.status === "approved" && r.approved_at && (
                      <span>Approved live on storefront</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Approve Button */}
                    {r.status !== "approved" && (
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleModerate(r.id, "approved")}
                        className="rounded-none h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-sans uppercase tracking-wider px-3"
                      >
                        {isLoading ? (
                          <Loader2 className="size-3 animate-spin mr-1" />
                        ) : (
                          <Check className="size-3 mr-1" />
                        )}
                        Approve & Publish
                      </Button>
                    )}

                    {/* Reject Button */}
                    {r.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => handleModerate(r.id, "rejected")}
                        className="rounded-none h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30 font-sans uppercase tracking-wider px-3"
                      >
                        {isLoading ? (
                          <Loader2 className="size-3 animate-spin mr-1" />
                        ) : (
                          <XCircle className="size-3 mr-1" />
                        )}
                        Reject
                      </Button>
                    )}

                    {/* Reset to Pending (if already decided) */}
                    {r.status !== "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isLoading}
                        onClick={() => handleModerate(r.id, "pending")}
                        className="rounded-none h-8 text-xs text-muted-foreground hover:text-foreground font-sans px-2"
                        title="Reset to Pending"
                      >
                        <RotateCcw className="size-3 mr-1" />
                        Reset
                      </Button>
                    )}

                    {/* Delete Permanently */}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isLoading}
                      onClick={() => setReviewToDelete(r)}
                      className="rounded-none h-8 text-xs text-muted-foreground hover:text-destructive font-sans px-2"
                      title="Delete review"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Warning Modal */}
      <AdminDeleteReviewDialog
        review={reviewToDelete}
        open={Boolean(reviewToDelete)}
        onOpenChange={(open) => !open && setReviewToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
