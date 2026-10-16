"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { AdminOrderListItem, OrderStatus, PaymentMethod, PaymentStatus } from "../types"
import { formatAED } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Eye, CreditCard, Banknote } from "lucide-react"

// ── Status badge ─────────────────────────────────────────────────────────────

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending:   "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
  packed:    "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/25",
  shipped:   "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25",
  delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  cancelled: "bg-muted text-muted-foreground border-border",
  returned:  "bg-destructive/10 text-destructive border-destructive/25",
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:   "Pending",
  confirmed: "Confirmed",
  packed:    "Packed",
  shipped:   "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned:  "Returned",
}

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending:  "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
  paid:     "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  refunded: "bg-muted text-muted-foreground border-border",
  failed:   "bg-destructive/10 text-destructive border-destructive/25",
}

// ── Columns ───────────────────────────────────────────────────────────────────

export const orderColumns: ColumnDef<AdminOrderListItem>[] = [
  {
    accessorKey: "order_number",
    header: "Order",
    cell: ({ row }) => {
      const o = row.original
      return (
        <div className="space-y-0.5">
          <Link
            href={`/admin/orders/${o.id}`}
            className="font-mono text-xs font-semibold text-foreground hover:underline underline-offset-2"
          >
            #{o.order_number}
          </Link>
          <div className="text-[10px] font-sans text-muted-foreground">
            {new Date(o.created_at).toLocaleDateString("en-AE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "customer_name",
    header: "Customer",
    cell: ({ row }) => {
      const o = row.original
      return (
        <div className="space-y-0.5 min-w-0">
          <div className="text-xs font-sans font-medium text-foreground truncate max-w-[160px]">
            {o.customer_name || "—"}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[160px]">
            {o.customer_email}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            {o.customer_phone}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "item_count",
    header: "Items",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground tabular-nums">
        {row.original.item_count} {row.original.item_count === 1 ? "item" : "items"}
      </span>
    ),
  },
  {
    id: "total",
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-xs font-medium text-foreground tabular-nums">
        {formatAED(row.original.total_fils)}
      </div>
    ),
  },
  {
    accessorKey: "payment_method",
    header: "Payment",
    cell: ({ row }) => {
      const method: PaymentMethod = row.original.payment_method
      return (
        <div className="flex items-center gap-1.5">
          {method === "card" ? (
            <CreditCard className="size-3.5 text-muted-foreground shrink-0" />
          ) : (
            <Banknote className="size-3.5 text-muted-foreground shrink-0" />
          )}
          <span className="text-xs font-sans text-foreground">
            {method === "card" ? "Card" : "Cash on Delivery"}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "payment_status",
    header: "Paid",
    cell: ({ row }) => {
      const ps: PaymentStatus = row.original.payment_status
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${PAYMENT_STATUS_STYLES[ps]}`}
        >
          {ps}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s: OrderStatus = row.original.status
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${ORDER_STATUS_STYLES[s]}`}
        >
          {ORDER_STATUS_LABELS[s]}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">View</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          size="icon-xs"
          variant="ghost"
          className="size-7 rounded-none text-muted-foreground hover:text-foreground"
          title="View order"
          render={<Link href={`/admin/orders/${row.original.id}`} />}
        >
          <Eye className="size-3.5" />
        </Button>
      </div>
    ),
  },
]
