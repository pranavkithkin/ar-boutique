"use client"

import * as React from "react"
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
import { AdminOrderListItem } from "../types"
import { orderColumns } from "./columns"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingBag } from "lucide-react"

interface OrdersTableProps {
  orders: AdminOrderListItem[]
  total: number
  currentPage: number
  totalPages: number
  pageSize?: number
  startTransition?: React.TransitionStartFunction
}

export function OrdersTable({
  orders,
  total,
  currentPage,
  totalPages,
  pageSize = 10,
  startTransition: externalStartTransition,
}: OrdersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, internalStartTransition] = React.useTransition()
  const triggerTransition = externalStartTransition || internalStartTransition

  const table = useReactTable({
    data: orders,
    columns: orderColumns,
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
    const qs = params.toString()
    return `/admin/orders${qs ? `?${qs}` : ""}`
  }

  function handleNavigate(e: React.MouseEvent<HTMLAnchorElement>, targetPage: number) {
    e.preventDefault()
    if (targetPage === currentPage || targetPage < 1 || targetPage > totalPages) return
    triggerTransition(() => router.push(getPageUrl(targetPage)))
  }

  function getVisiblePages(): (number | "ellipsis")[] {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, 4, "ellipsis", totalPages]
    if (currentPage >= totalPages - 2)
      return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages]
  }

  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(total, currentPage * pageSize)
  const visiblePages = getVisiblePages()

  // Empty state
  if (total === 0) {
    return (
      <div className="border border-border bg-card p-16 text-center rounded-none">
        <ShoppingBag className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
        <h3 className="font-sans text-base font-semibold text-foreground">No orders yet</h3>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mx-auto font-sans leading-relaxed">
          Orders will appear here once customers complete checkout. The orders table is
          provisioned in Phase 6 of the build.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Data Table */}
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/40 transition-colors border-border"
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
                    colSpan={orderColumns.length}
                    className="h-32 text-center text-xs text-muted-foreground font-sans"
                  >
                    No orders match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div className="text-xs text-muted-foreground font-sans">
            Showing{" "}
            <span className="font-mono font-medium text-foreground">{startItem}</span> to{" "}
            <span className="font-mono font-medium text-foreground">{endItem}</span> of{" "}
            <span className="font-mono font-medium text-foreground">{total}</span> orders
            {totalPages > 1 && (
              <span className="ml-2 text-muted-foreground/70 font-mono text-[11px]">
                (Page {currentPage} of {totalPages})
              </span>
            )}
          </div>

          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    href={getPageUrl(currentPage - 1)}
                    onClick={(e) => handleNavigate(e, currentPage - 1)}
                    className={`h-8 rounded-none text-xs border border-border/80 ${
                      currentPage <= 1
                        ? "pointer-events-none opacity-30"
                        : "hover:bg-muted"
                    }`}
                    aria-disabled={currentPage <= 1}
                  />
                </PaginationItem>

                {visiblePages.map((p, i) =>
                  p === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${i}`}>
                      <PaginationEllipsis className="size-8" />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href={getPageUrl(p)}
                        onClick={(e) => handleNavigate(e, p)}
                        isActive={p === currentPage}
                        className={`size-8 rounded-none text-xs font-mono border ${
                          p === currentPage
                            ? "bg-foreground text-background font-medium border-foreground"
                            : "border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    href={getPageUrl(currentPage + 1)}
                    onClick={(e) => handleNavigate(e, currentPage + 1)}
                    className={`h-8 rounded-none text-xs border border-border/80 ${
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-30"
                        : "hover:bg-muted"
                    }`}
                    aria-disabled={currentPage >= totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  )
}
