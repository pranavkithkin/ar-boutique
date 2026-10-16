"use client"

import * as React from "react"
import { CustomersToolbar } from "./CustomersToolbar"
import { CustomersTable } from "./CustomersTable"
import { AdminCustomerListItem } from "../types"
import { Skeleton } from "@/components/ui/skeleton"

interface CustomersClientContainerProps {
  initialCustomers: AdminCustomerListItem[]
  total: number
  currentPage: number
  totalPages: number
  pageSize: number
  currentSearch: string
  currentStatus: string
  activeCodCount: number
  blockedCodCount: number
}

export function CustomersClientContainer({
  initialCustomers,
  total,
  currentPage,
  totalPages,
  pageSize,
  currentSearch,
  currentStatus,
  activeCodCount,
  blockedCodCount,
}: CustomersClientContainerProps) {
  const [isPending, startTransition] = React.useTransition()

  return (
    <div className="space-y-6">
      <CustomersToolbar
        currentSearch={currentSearch}
        currentStatus={currentStatus}
        totalCount={total}
        activeCodCount={activeCodCount}
        blockedCodCount={blockedCodCount}
        startTransition={startTransition}
      />

      {isPending ? (
        /* Instant skeleton loader on filter changes */
        <div className="border border-border bg-card rounded-none overflow-hidden animate-pulse">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-none" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3.5 w-10" />
                <Skeleton className="h-5 w-16 rounded-none" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16 rounded-none" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <CustomersTable
          customers={initialCustomers}
          total={total}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          startTransition={startTransition}
        />
      )}
    </div>
  )
}
