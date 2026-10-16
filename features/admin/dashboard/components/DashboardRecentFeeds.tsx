import Link from "next/link"
import {
  DashboardRecentOrder,
  DashboardLowStockSku,
  DashboardRecentReturn,
} from "../types"
import { formatAED } from "@/lib/money"
import {
  CreditCard,
  Banknote,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  ShoppingBag,
} from "lucide-react"

interface DashboardRecentFeedsProps {
  recentOrders: DashboardRecentOrder[]
  lowStockItems: DashboardLowStockSku[]
  recentReturns: DashboardRecentReturn[]
}

const ORDER_STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
  packed: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/25",
  shipped: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25",
  delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  cancelled: "bg-muted text-muted-foreground border-border",
  returned: "bg-destructive/10 text-destructive border-destructive/25",
}

const RETURN_STATUS_CLASSES: Record<string, string> = {
  requested: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  approved: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  in_transit: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  received: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  closed: "bg-muted text-muted-foreground border-border",
}

export function DashboardRecentFeeds({
  recentOrders,
  lowStockItems,
  recentReturns,
}: DashboardRecentFeedsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Recent Orders Feed (col 1 & 2 on large or col 1) */}
      <div className="lg:col-span-2 bg-card border border-border p-5 rounded-none flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-sans font-semibold text-foreground">
                Recent Orders
              </h3>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-sans text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <span>View all orders</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No orders received yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 px-1 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs font-semibold text-foreground hover:underline underline-offset-2"
                      >
                        #{order.orderNumber}
                      </Link>
                      <span
                        className={`text-[10px] font-sans px-1.5 py-0.5 border ${
                          ORDER_STATUS_CLASSES[order.status] ||
                          "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.customerName}{" "}
                      {order.email && (
                        <span className="text-[11px] text-muted-foreground/70">
                          ({order.email})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {order.paymentMethod === "cod" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400">
                          <Banknote className="size-3" /> COD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-foreground">
                          <CreditCard className="size-3" /> Card
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-mono font-semibold text-foreground">
                      {formatAED(order.totalFils)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Low-Stock Warnings & Returns Feed (col 3) */}
      <div className="space-y-4">
        {/* Low-Stock Alerts */}
        <div className="bg-card border border-border p-5 rounded-none space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-500" />
              <h3 className="text-sm font-sans font-semibold text-foreground">
                Low-Stock Alerts
              </h3>
            </div>
            <Link
              href="/admin/stock"
              className="text-xs font-sans text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              All active SKUs have healthy stock levels.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {lowStockItems.map((item) => (
                <div
                  key={item.variantId}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-foreground truncate">
                      {item.sku}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {item.productName} • {item.colourName}
                      {item.sizeLabel ? ` (${item.sizeLabel})` : ""}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {item.available} left
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {item.onHand} on hand
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Returns */}
        <div className="bg-card border border-border p-5 rounded-none space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <RotateCcw className="size-4 text-purple-500" />
              <h3 className="text-sm font-sans font-semibold text-foreground">
                Recent Returns
              </h3>
            </div>
            <Link
              href="/admin/returns"
              className="text-xs font-sans text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {recentReturns.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No return requests on file.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentReturns.map((ret) => (
                <div
                  key={ret.id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/returns/${ret.id}`}
                      className="font-mono text-xs font-semibold text-foreground hover:underline"
                    >
                      #{ret.returnNumber}
                    </Link>
                    <div className="text-[11px] text-muted-foreground truncate">
                      Order #{ret.orderNumber} • {ret.customerName}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-sans px-1.5 py-0.5 border shrink-0 ${
                      RETURN_STATUS_CLASSES[ret.status] ||
                      "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {ret.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
