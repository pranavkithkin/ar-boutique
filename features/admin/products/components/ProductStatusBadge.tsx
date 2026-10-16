import * as React from "react"
import { ProductStatus } from "../types"
import { cn } from "@/lib/utils"

export function ProductStatusBadge({
  status,
  className,
}: {
  status: ProductStatus
  className?: string
}) {
  switch (status) {
    case "published":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-sans font-medium uppercase tracking-[0.1em] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
            className
          )}
        >
          <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          Published
        </span>
      )
    case "draft":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-sans font-medium uppercase tracking-[0.1em] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
            className
          )}
        >
          <span className="size-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
          Draft
        </span>
      )
    case "archived":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-sans font-medium uppercase tracking-[0.1em] bg-muted text-muted-foreground border border-border",
            className
          )}
        >
          <span className="size-1.5 rounded-full bg-muted-foreground/60" />
          Archived
        </span>
      )
    default:
      return null
  }
}
