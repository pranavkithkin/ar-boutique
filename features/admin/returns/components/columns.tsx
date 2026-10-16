"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { AdminReturnListItem, ReturnStatus } from "../types"
import { formatAED } from "@/lib/money"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  const config: Record<
    ReturnStatus,
    { label: string; className: string }
  > = {
    requested: {
      label: "Requested",
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    approved: {
      label: "Approved",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    in_transit: {
      label: "In Transit",
      className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
    received: {
      label: "Received",
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    rejected: {
      label: "Rejected",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    closed: {
      label: "Closed",
      className: "bg-muted text-muted-foreground border-border",
    },
  }

  const { label, className } = config[status] || {
    label: status,
    className: "bg-muted text-muted-foreground",
  }

  return (
    <Badge
      variant="outline"
      className={`text-[11px] font-sans tracking-wide font-medium rounded-none px-2 py-0.5 border ${className}`}
    >
      {label}
    </Badge>
  )
}

export const returnColumns: ColumnDef<AdminReturnListItem>[] = [
  {
    accessorKey: "return_number",
    header: "Return",
    cell: ({ row }) => {
      const ret = row.original
      return (
        <div className="space-y-0.5">
          <Link
            href={`/admin/returns/${ret.id}`}
            className="font-sans text-xs font-semibold text-foreground hover:underline block"
          >
            {ret.return_number}
          </Link>
          <span className="text-[11px] text-muted-foreground font-sans">
            {new Date(ret.created_at).toLocaleDateString("en-AE", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "order_number",
    header: "Order & Method",
    cell: ({ row }) => {
      const ret = row.original
      return (
        <div className="space-y-1">
          <Link
            href={`/admin/orders/${ret.order_id}`}
            className="font-sans text-xs font-medium text-muted-foreground hover:text-foreground hover:underline block"
          >
            #{ret.order_number}
          </Link>
          <Badge
            variant="outline"
            className="text-[10px] font-sans uppercase tracking-wider rounded-none px-1.5 py-0 border-border/80"
          >
            {ret.payment_method === "cod" ? "COD" : "Card"}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "customer_name",
    header: "Customer",
    cell: ({ row }) => {
      const ret = row.original
      return (
        <div className="space-y-0.5 max-w-[180px]">
          <p className="text-xs font-medium text-foreground truncate">
            {ret.customer_name}
          </p>
          <p className="text-[11px] text-muted-foreground truncate font-sans">
            {ret.customer_email}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return <ReturnStatusBadge status={row.original.status} />
    },
  },
  {
    accessorKey: "item_count",
    header: "Items",
    cell: ({ row }) => {
      const count = row.original.item_count
      return (
        <span className="text-xs font-sans text-muted-foreground">
          {count} {count === 1 ? "item" : "items"}
        </span>
      )
    },
  },
  {
    accessorKey: "total_refund_fils",
    header: "Claimed Value",
    cell: ({ row }) => {
      return (
        <span className="text-xs font-mono font-medium text-foreground">
          {formatAED(row.original.total_refund_fils)}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      return (
        <div className="flex justify-end">
          <Link
            href={`/admin/returns/${row.original.id}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-sans px-2.5 py-1.5 border border-border/80 hover:border-foreground transition-colors"
          >
            <span>Review</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      )
    },
  },
]
