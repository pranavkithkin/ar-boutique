"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { columns } from "./columns"
import { AdminProductListItem } from "../types"
import { Package, Plus } from "lucide-react"

interface ProductsTableProps {
  products: AdminProductListItem[]
  total: number
  currentPage: number
  totalPages: number
  pageSize?: number
}

export function ProductsTable({
  products,
  total,
  currentPage,
  totalPages,
  pageSize = 10,
}: ProductsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = React.useTransition()

  // TanStack Table instance matching shadcn data-table pattern
  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: {
      pagination: {
        pageIndex: Math.max(0, currentPage - 1),
        pageSize,
      },
    },
  })

  function getPageUrl(targetPage: number): string {
    const params = new URLSearchParams(searchParams.toString())
    if (targetPage <= 1) {
      params.delete("page")
    } else {
      params.set("page", targetPage.toString())
    }
    const queryString = params.toString()
    return `/admin/products${queryString ? `?${queryString}` : ""}`
  }

  function handleNavigate(e: React.MouseEvent<HTMLAnchorElement>, targetPage: number) {
    e.preventDefault()
    if (targetPage === currentPage || targetPage < 1 || targetPage > totalPages) {
      return
    }
    startTransition(() => {
      router.push(getPageUrl(targetPage))
    })
  }

  function getVisiblePages(): (number | "ellipsis")[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, "ellipsis", totalPages]
    }

    if (currentPage >= totalPages - 2) {
      return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages]
  }

  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(total, currentPage * pageSize)
  const visiblePages = getVisiblePages()

  if (products.length === 0 && total === 0) {
    return (
      <div className="border border-border bg-card p-12 text-center rounded-none">
        <Package className="size-10 text-muted-foreground mx-auto mb-3 opacity-60" />
        <h3 className="font-sans text-base font-semibold text-foreground">
          No products found
        </h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto font-sans">
          Try adjusting your search criteria, clear your filters, or create a new catalogue item.
        </p>
        <div className="mt-5">
          <Button
            render={<Link href="/admin/products/new" />}
            variant="outline"
            className="rounded-none text-xs font-sans uppercase tracking-wider h-8 gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>Create Product</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 transition-opacity duration-150 ${isPending ? "opacity-60" : "opacity-100"}`}>
      {/* Shadcn Data Table */}
      <div className="border border-border bg-card rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-border bg-muted/30">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground py-3"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/40 transition-colors border-border group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-xs text-muted-foreground font-sans"
                  >
                    No products found on this page.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Database Pagination Footer */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 py-1">
          <div className="text-xs text-muted-foreground font-sans">
            Showing <span className="font-mono font-medium text-foreground">{startItem}</span> to{" "}
            <span className="font-mono font-medium text-foreground">{endItem}</span> of{" "}
            <span className="font-mono font-medium text-foreground">{total}</span> products
            {totalPages > 1 && (
              <span className="ml-2 text-muted-foreground/70 font-mono text-[11px]">
                (Page {currentPage} of {totalPages})
              </span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center">
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent className="gap-1">
                  {/* Previous Page */}
                  <PaginationItem>
                    <PaginationPrevious
                      href={getPageUrl(currentPage - 1)}
                      onClick={(e) => handleNavigate(e, currentPage - 1)}
                      className={`h-8 rounded-none text-xs border border-border/80 ${
                        currentPage <= 1 ? "pointer-events-none opacity-30 cursor-not-allowed" : "hover:bg-muted"
                      }`}
                      aria-disabled={currentPage <= 1}
                    />
                  </PaginationItem>

                  {/* Numbered Page Buttons */}
                  {visiblePages.map((page, index) => {
                    if (page === "ellipsis") {
                      return (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis className="size-8" />
                        </PaginationItem>
                      )
                    }

                    const isActive = page === currentPage
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href={getPageUrl(page)}
                          onClick={(e) => handleNavigate(e, page)}
                          isActive={isActive}
                          className={`size-8 rounded-none text-xs font-mono border ${
                            isActive
                              ? "bg-foreground text-background font-medium border-foreground"
                              : "border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  {/* Next Page */}
                  <PaginationItem>
                    <PaginationNext
                      href={getPageUrl(currentPage + 1)}
                      onClick={(e) => handleNavigate(e, currentPage + 1)}
                      className={`h-8 rounded-none text-xs border border-border/80 ${
                        currentPage >= totalPages ? "pointer-events-none opacity-30 cursor-not-allowed" : "hover:bg-muted"
                      }`}
                      aria-disabled={currentPage >= totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
