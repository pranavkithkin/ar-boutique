"use client"

import Link from "next/link"
import Image from "next/image"
import { ColumnDef } from "@tanstack/react-table"
import { AdminProductListItem } from "../types"
import { ProductStatusBadge } from "./ProductStatusBadge"
import { formatAED } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Edit2, ExternalLink } from "lucide-react"

export const columns: ColumnDef<AdminProductListItem>[] = [
  {
    accessorKey: "thumbnail_url",
    header: "Item",
    cell: ({ row }) => {
      const p = row.original
      return (
        <div className="relative size-12 bg-muted/60 border border-border/80 overflow-hidden shrink-0">
          {p.thumbnail_url ? (
            <Image
              src={p.thumbnail_url}
              alt={p.name}
              fill
              sizes="48px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="size-full flex items-center justify-center text-muted-foreground/40 text-[9px] font-mono">
              N/A
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "name",
    header: "Product & Slug",
    cell: ({ row }) => {
      const p = row.original
      return (
        <div className="space-y-0.5">
          <Link
            href={`/admin/products/${p.id}`}
            className="font-sans text-xs sm:text-sm font-medium text-foreground hover:underline underline-offset-2 flex items-center gap-1.5"
          >
            <span>{p.name}</span>
            {p.is_final_sale && (
              <span className="text-[9px] font-mono px-1 py-0.2 bg-destructive/10 text-destructive border border-destructive/20 uppercase tracking-widest">
                Final
              </span>
            )}
          </Link>
          <div className="text-[11px] font-mono text-muted-foreground/75 truncate max-w-xs">
            /{p.slug}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "category_name",
    header: "Category",
    cell: ({ row }) => {
      return (
        <span className="text-xs font-sans text-muted-foreground">
          {row.original.category_name || "Uncategorized"}
        </span>
      )
    },
  },
  {
    id: "style_code",
    header: "Style Code",
    cell: ({ row }) => {
      const primaryStyle = row.original.style_codes[0] || "—"
      return (
        <span className="font-mono text-xs text-foreground font-medium">
          {primaryStyle}
        </span>
      )
    },
  },
  {
    accessorKey: "variant_count",
    header: "Variants",
    cell: ({ row }) => {
      const count = row.original.variant_count
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {count} {count === 1 ? "SKU" : "SKUs"}
        </span>
      )
    },
  },
  {
    id: "price",
    header: () => <div className="text-right">Price (AED)</div>,
    cell: ({ row }) => {
      const p = row.original
      const priceDisplay =
        p.min_price_fils !== null
          ? p.min_price_fils === p.max_price_fils
            ? formatAED(p.min_price_fils)
            : `${formatAED(p.min_price_fils)} - ${formatAED(p.max_price_fils!)}`
          : "No price"

      return (
        <div className="text-right font-mono text-xs text-foreground tabular-nums font-medium">
          {priceDisplay}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return <ProductStatusBadge status={row.original.status} />
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const p = row.original
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon-xs"
            variant="ghost"
            className="size-7 rounded-none text-muted-foreground hover:text-foreground"
            title="Edit product"
            render={<Link href={`/admin/products/${p.id}`} />}
          >
            <Edit2 className="size-3.5" />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            className="size-7 rounded-none text-muted-foreground hover:text-foreground"
            title="View on Storefront"
            render={
              <Link
                href={`/collections/${p.slug}`}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <ExternalLink className="size-3.5" />
          </Button>
        </div>
      )
    },
  },
]
