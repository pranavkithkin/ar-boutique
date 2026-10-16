"use client"

import * as React from "react"
import { OrdersToolbar } from "./OrdersToolbar"
import { OrdersTable } from "./OrdersTable"
import { AdminOrderListItem } from "../types"
import { Skeleton } from "@/components/ui/skeleton"

interface OrdersClientContainerProps {
  initialOrders: AdminOrderListItem[]
  total: number
  currentPage: number
  totalPages: number
  pageSize: number
  currentSearch: string
  currentStatus: string
  currentPaymentMethod: string
}

export function OrdersClientContainer({
  initialOrders,
  total,
  currentPage,
  totalPages,
  pageSize,
  currentSearch,
  currentStatus,
  currentPaymentMethod,
}: OrdersClientContainerProps) {
  const [isPending, startTransition] = React.useTransition()

  return (
    <div className="space-y-6">
      <OrdersToolbar
        currentSearch={currentSearch}
        currentStatus={currentStatus}
        currentPaymentMethod={currentPaymentMethod}
        totalCount={total}
        startTransition={startTransition}
      />

      {isPending ? (
        /* Instant Skeleton Loader when switching tabs/filters */
        <div className="border border-border bg-card rounded-none overflow-hidden animate-pulse">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3.5">
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-20 rounded-none" />
                <Skeleton className="h-5 w-20 rounded-none" />
                <Skeleton className="size-7 rounded-none" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <OrdersTable
          orders={initialOrders}
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
