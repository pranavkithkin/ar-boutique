import { AppShell } from "@/components/app-shell"
import { BannersSkeleton } from "@/features/admin/banners/components/BannersSkeleton"

export default function AdminBannersLoading() {
  return (
    <AppShell>
      <BannersSkeleton />
    </AppShell>
  )
}
