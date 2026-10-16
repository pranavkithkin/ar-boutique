import { AppShell } from "@/components/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminEditProductLoading() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* ── Header bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            {/* Back button */}
            <Skeleton className="size-8 shrink-0" />
            <div className="space-y-1.5">
              {/* "Edit Catalogue Item" label + status pill */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              {/* Product name h1 */}
              <Skeleton className="h-8 w-64 sm:w-80" />
            </div>
          </div>
          {/* Action buttons: View Live + Save Changes */}
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        {/* ── Form Grid: lg:3 cols ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left col (span-2): Core Garment Details + Variants ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Core Garment Details card */}
            <div className="bg-card border border-border p-6 rounded-none space-y-5">
              <Skeleton className="h-5 w-44 border-b border-border pb-3" />

              <div className="space-y-5">
                {/* Product Name field */}
                <FieldSkeleton labelWidth="w-24" inputHeight="h-10" />
                {/* Slug field */}
                <FieldSkeleton labelWidth="w-40" inputHeight="h-10" />
                {/* Description textarea */}
                <FieldSkeleton labelWidth="w-52" inputHeight="h-28" />
              </div>
            </div>

            {/* Variants / SKU section */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-6 w-72" />
                <Skeleton className="h-3 w-96 opacity-70" />
              </div>

              {/* Variant cards — 2 colourway placeholders */}
              {[0, 1].map((i) => (
                <ColourwayCardSkeleton key={i} />
              ))}
            </div>
          </div>

          {/* ── Right col: Status & Category + Product Visuals ── */}
          <div className="space-y-6">
            {/* Status & Category card */}
            <div className="bg-card border border-border p-6 rounded-none space-y-5">
              <Skeleton className="h-5 w-36" />
              <div className="space-y-5">
                <FieldSkeleton labelWidth="w-28" inputHeight="h-10" />
                <FieldSkeleton labelWidth="w-32" inputHeight="h-10" />
                {/* Final Sale checkbox row */}
                <div className="flex items-start gap-2.5 pt-2 border-t border-border/60">
                  <Skeleton className="size-4 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-2.5 w-56 opacity-70" />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Visuals card */}
            <div className="bg-card border border-border p-6 rounded-none space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
              {/* Two colourway image blocks */}
              {[0, 1].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24 opacity-60" />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((j) => (
                      <Skeleton key={j} className="aspect-[3/4] w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ── Shared sub-skeletons ──────────────────────────────────────────────────────

function FieldSkeleton({
  labelWidth,
  inputHeight,
}: {
  labelWidth: string
  inputHeight: string
}) {
  return (
    <div className="space-y-1.5">
      <Skeleton className={`h-3 ${labelWidth}`} />
      <Skeleton className={`${inputHeight} w-full`} />
    </div>
  )
}

function ColourwayCardSkeleton() {
  return (
    <div className="border border-border bg-card rounded-none overflow-hidden">
      {/* Colourway header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-3">
          <Skeleton className="size-4" />
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20 opacity-70" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-7" />
          <Skeleton className="size-7" />
        </div>
      </div>

      {/* Variant rows */}
      <div className="divide-y divide-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16 ml-auto" />
            <Skeleton className="h-5 w-12" />
            <div className="flex items-center gap-1">
              <Skeleton className="size-7" />
              <Skeleton className="size-7" />
            </div>
          </div>
        ))}
      </div>

      {/* Add variant button row */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/20">
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  )
}
