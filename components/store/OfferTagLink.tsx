import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { ProductOfferTag } from "@/features/offers/types"
import type { MouseEventHandler } from "react"

export function OfferTagLink({ tag, className, onClick }: { tag: ProductOfferTag; className?: string; onClick?: MouseEventHandler<HTMLAnchorElement> }) {
  return (
    <Link href={`/offers/${tag.slug}`} title={tag.title} aria-label={`${tag.title} campaign offer`} className={className} onClick={onClick}>
      <Badge variant="secondary" className="block max-w-full truncate border border-border bg-background/95 text-foreground shadow-sm">
        {tag.label}
      </Badge>
    </Link>
  )
}
