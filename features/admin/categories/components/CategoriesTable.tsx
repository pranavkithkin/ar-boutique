"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AdminCategoryItem } from "../types"
import {
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  EyeOff,
  Package,
} from "lucide-react"

interface CategoriesTableProps {
  categories: AdminCategoryItem[]
  onEdit: (category: AdminCategoryItem) => void
  onDelete: (category: AdminCategoryItem) => void
  onToggleActive: (category: AdminCategoryItem) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  isReordering?: boolean
}

export function CategoriesTable({
  categories,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  isReordering = false,
}: CategoriesTableProps) {
  if (categories.length === 0) {
    return (
      <div className="border border-dashed border-border p-12 text-center bg-card">
        <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
          <Package className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No categories found</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          No categories match your current search or filter criteria. Add a new category or clear your filters.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border bg-card">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            <TableHead className="w-14 text-center">Photo</TableHead>
            <TableHead>Category & Slug</TableHead>
            <TableHead className="w-28 text-center">Products</TableHead>
            <TableHead className="w-32 text-center">Sort Order</TableHead>
            <TableHead className="w-28 text-center">Visibility</TableHead>
            <TableHead className="w-24 text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y divide-border">
          {categories.map((cat, index) => {
            const isFirst = index === 0
            const isLast = index === categories.length - 1

            return (
              <TableRow key={cat.id} className="hover:bg-muted/20 transition-colors">
                {/* Photo Thumbnail */}
                <TableCell className="w-14 py-3 pl-3 pr-2 text-center">
                  <div className="relative w-11 h-11 border border-border bg-muted flex items-center justify-center overflow-hidden mx-auto">
                    {cat.image_url ? (
                      <Image
                        src={cat.image_url}
                        alt={cat.name}
                        fill
                        sizes="44px"
                        className="object-cover object-center"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                    )}
                  </div>
                </TableCell>

                {/* Name, Slug & Description */}
                <TableCell className="py-3 pr-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground tracking-tight">
                        {cat.name}
                      </span>
                      {!cat.is_active && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 h-4 bg-muted/60 text-muted-foreground border-border"
                        >
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                      <span>/shop/{cat.slug}</span>
                      <Link
                        href={`/shop/${cat.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground/60 hover:text-foreground inline-flex items-center"
                        title="View storefront collection"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 max-w-md">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Products Count */}
                <TableCell className="w-28 py-3 text-center">
                  {cat.product_count > 0 ? (
                    <Link
                      href={`/admin/products?category=${cat.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted/50 hover:bg-muted text-xs font-mono font-medium text-foreground border border-border transition-colors"
                      title="Filter catalogue by this category"
                    >
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span>{cat.product_count}</span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-muted-foreground/60">
                      0
                    </span>
                  )}
                </TableCell>

                {/* Sort Order with Quick Reorder Controls */}
                <TableCell className="w-32 py-3 text-center">
                  <div className="inline-flex items-center gap-1 bg-muted/30 border border-border px-1 py-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onMoveUp(index)}
                      disabled={isFirst || isReordering}
                      className="h-6 w-6 rounded-none text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>

                    <span className="text-xs font-mono font-semibold w-7 text-center">
                      {cat.sort}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onMoveDown(index)}
                      disabled={isLast || isReordering}
                      className="h-6 w-6 rounded-none text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>

                {/* Visibility Toggle Button */}
                <TableCell className="w-28 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onToggleActive(cat)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border transition-colors cursor-pointer ${
                      cat.is_active
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                    title={cat.is_active ? "Click to hide from store" : "Click to show on store"}
                  >
                    {cat.is_active ? (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>
                </TableCell>

                {/* Actions: Edit & Delete */}
                <TableCell className="w-24 py-3 text-right pr-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(cat)}
                      className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Edit Category"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(cat)}
                      className={`h-8 w-8 rounded-none ${
                        cat.product_count > 0
                          ? "text-muted-foreground/40 hover:text-amber-600 hover:bg-amber-500/10"
                          : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      }`}
                      title={
                        cat.product_count > 0
                          ? `Delete locked (${cat.product_count} products linked)`
                          : "Delete Category"
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
