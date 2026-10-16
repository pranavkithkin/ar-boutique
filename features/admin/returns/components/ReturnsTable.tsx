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
import { AdminReturnListItem } from "../types"
import { returnColumns } from "./columns"
import { RotateCcw } from "lucide-react"

interface ReturnsTableProps {
  returns: AdminReturnListItem[]
  total: number
  currentPage: number
  totalPages: number
  pageSize?: number
  startTransition?: React.TransitionStartFunction
}

export function ReturnsTable({
  returns,
  total,
  currentPage,
  totalPages,
  pageSize = 10,
  startTransition: externalStartTransition,
}: ReturnsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, internalStartTransition] = React.useTransition()
  const triggerTransition = externalStartTransition || internalStartTransition

  const table = useReactTable({
    data: returns,
    columns: returnColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
  })

  function onPageChange(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", String(newPage))
    triggerTransition(() => router.push(`/admin/returns?${next.toString()}`))
  }

  const fromItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const toItem = Math.min(currentPage * pageSize, total)

  return (
    <div className="space-y-4">
      <div className="border border-border bg-card rounded-none overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-[11px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground h-10 px-4"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                  className="border-border hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={returnColumns.length}
                  className="h-44 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <RotateCcw className="size-8 stroke-[1.25] text-muted-foreground/60" />
                    <p className="text-sm font-medium text-foreground">
                      No returns found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try selecting another status tab or clear your search term.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-1">
          <p className="text-xs text-muted-foreground font-sans">
            Showing <span className="font-medium text-foreground">{fromItem}</span> to{" "}
            <span className="font-medium text-foreground">{toItem}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span> returns
          </p>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(currentPage - 1)}
                  className={`cursor-pointer rounded-none text-xs h-8 px-2.5 ${
                    currentPage <= 1
                      ? "pointer-events-none opacity-40"
                      : "hover:bg-muted"
                  }`}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isCurrent = p === currentPage
                const isEdge = p === 1 || p === totalPages
                const isNear = Math.abs(p - currentPage) <= 1

                if (!isEdge && !isNear) {
                  if (p === 2 || p === totalPages - 1) {
                    return (
                      <PaginationItem key={p}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )
                  }
                  return null
                }

                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      onClick={() => onPageChange(p)}
                      isActive={isCurrent}
                      className={`cursor-pointer rounded-none text-xs h-8 w-8 ${
                        isCurrent
                          ? "bg-foreground text-background font-medium"
                          : "hover:bg-muted"
                      }`}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(currentPage + 1)}
                  className={`cursor-pointer rounded-none text-xs h-8 px-2.5 ${
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-40"
                      : "hover:bg-muted"
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
