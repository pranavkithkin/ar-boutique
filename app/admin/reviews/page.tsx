import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { getAdminReviewsAction } from "@/features/reviews/actions"
import { ReviewsManagerView } from "@/features/admin/reviews/components/ReviewsManagerView"

export const metadata: Metadata = {
  title: "Customer Reviews & Moderation | AR Boutique Admin",
  description: "Moderate, approve, and manage customer product ratings, sizing feedback, and reviews.",
  robots: { index: false, follow: false },
}

export default async function AdminReviewsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const res = await getAdminReviewsAction()
  const reviews = res.reviews || []
  const stats = res.stats || {
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalCount: 0,
    averageRating: 0,
  }

  return (
    <AppShell>
      <ReviewsManagerView initialReviews={reviews} initialStats={stats} />
    </AppShell>
  )
}
