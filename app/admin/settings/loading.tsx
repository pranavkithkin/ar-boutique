import { AppShell } from "@/components/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminSettingsLoading() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* ── Header ── */}
        <div className="pb-4 border-b border-border">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-48 sm:w-60" />
            <Skeleton className="h-3 w-80 max-w-full" />
          </div>
        </div>

        {/* ── Section Cards ── */}
        <div className="space-y-6">
          {/* 1. Store Details */}
          <SectionCardSkeleton
            titleWidth="w-28"
            descWidth="w-72"
            rows={[
              { labelWidth: "w-24", inputHeight: "h-9" },
              { labelWidth: "w-24", inputHeight: "h-9" },
              { labelWidth: "w-20", inputHeight: "h-9" },
              { labelWidth: "w-20", inputHeight: "h-20" },
            ]}
          />

          {/* 2. Tax (VAT) */}
          <SectionCardSkeleton
            titleWidth="w-20"
            descWidth="w-96"
            rows={[
              { labelWidth: "w-16", inputHeight: "h-9" },
              { labelWidth: "w-24", inputHeight: "h-6", isCheckbox: true },
            ]}
          />

          {/* 3. Delivery */}
          <SectionCardSkeleton
            titleWidth="w-20"
            descWidth="w-80"
            rows={[
              { labelWidth: "w-24", inputHeight: "h-9" },
              { labelWidth: "w-32", inputHeight: "h-9" },
            ]}
          />

          {/* 4. Cash on Delivery */}
          <SectionCardSkeleton
            titleWidth="w-32"
            descWidth="w-88"
            rows={[
              { labelWidth: "w-24", inputHeight: "h-6", isCheckbox: true },
              { labelWidth: "w-20", inputHeight: "h-9" },
              { labelWidth: "w-28", inputHeight: "h-9" },
              { labelWidth: "w-28", inputHeight: "h-9" },
              { labelWidth: "w-36", inputHeight: "h-9" },
            ]}
          />

          {/* 5. Returns & Exchanges */}
          <SectionCardSkeleton
            titleWidth="w-40"
            descWidth="w-80"
            rows={[
              { labelWidth: "w-28", inputHeight: "h-9" },
              { labelWidth: "w-40", inputHeight: "h-9" },
              { labelWidth: "w-36", inputHeight: "h-24" },
            ]}
          />

          {/* 6. Announcement Bar */}
          <SectionCardSkeleton
            titleWidth="w-36"
            descWidth="w-72"
            rows={[
              { labelWidth: "w-24", inputHeight: "h-6", isCheckbox: true },
              { labelWidth: "w-20", inputHeight: "h-9" },
            ]}
          />

          {/* 7. FAQs */}
          <div className="bg-card border border-border rounded-none p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Skeleton className="size-4 rounded-none" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-80 max-w-full" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-none" />
            </div>

            {/* FAQ Accordion items skeleton */}
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="border border-border p-4 bg-muted/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-64" />
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="size-6 rounded-none" />
                      <Skeleton className="size-6 rounded-none" />
                      <Skeleton className="size-6 rounded-none" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>

          {/* 8. Notifications */}
          <SectionCardSkeleton
            titleWidth="w-28"
            descWidth="w-64"
            rows={[
              { labelWidth: "w-24", inputHeight: "h-9" },
              { labelWidth: "w-36", inputHeight: "h-9" },
            ]}
          />
        </div>

        {/* Sticky save footer skeleton */}
        <div className="sticky bottom-0 bg-background/90 backdrop-blur-sm border-t border-border py-3 -mx-4 sm:-mx-6 px-4 sm:px-6 flex items-center justify-between gap-4">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-9 w-32 rounded-none" />
        </div>
      </div>
    </AppShell>
  )
}

function SectionCardSkeleton({
  titleWidth,
  descWidth,
  rows,
}: {
  titleWidth: string
  descWidth: string
  rows: { labelWidth: string; inputHeight: string; isCheckbox?: boolean }[]
}) {
  return (
    <div className="bg-card border border-border rounded-none p-6 space-y-5">
      <div className="flex items-start gap-3 pb-3 border-b border-border">
        <Skeleton className="size-4 mt-0.5 rounded-none shrink-0" />
        <div className="space-y-1">
          <Skeleton className={`h-4 ${titleWidth}`} />
          <Skeleton className={`h-3 ${descWidth} max-w-full`} />
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start"
          >
            <div className="sm:pt-2">
              <Skeleton className={`h-3 ${row.labelWidth}`} />
            </div>
            <div className="sm:col-span-2">
              {row.isCheckbox ? (
                <div className="flex items-center gap-2.5 pt-1">
                  <Skeleton className="size-4 rounded-none shrink-0" />
                  <Skeleton className="h-3.5 w-64 max-w-full" />
                </div>
              ) : (
                <Skeleton className={`${row.inputHeight} w-full rounded-none`} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
