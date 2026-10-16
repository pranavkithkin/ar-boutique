import Link from "next/link"
import { DashboardQueueStats } from "../types"
import { formatAED } from "@/lib/money"
import {
  Clock,
  PackageCheck,
  Truck,
  RotateCcw,
  AlertTriangle,
  Banknote,
  ArrowRight,
} from "lucide-react"

interface DashboardActionQueuesProps {
  queues: DashboardQueueStats
}

export function DashboardActionQueues({ queues }: DashboardActionQueuesProps) {
  const queueCards = [
    {
      label: "COD to Confirm",
      count: queues.codToConfirm,
      href: "/admin/orders?status=pending",
      desc: "Pending courier call confirmation",
      icon: Clock,
      urgency: queues.codToConfirm > 0 ? "urgent" : "neutral",
      badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
    },
    {
      label: "Orders to Pack",
      count: queues.toPack,
      href: "/admin/orders?status=confirmed",
      desc: "Ready for warehouse fulfillment",
      icon: PackageCheck,
      urgency: queues.toPack > 0 ? "action" : "neutral",
      badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
    },
    {
      label: "Orders to Ship",
      count: queues.toShip,
      href: "/admin/orders?status=packed",
      desc: "Awaiting courier handover",
      icon: Truck,
      urgency: queues.toShip > 0 ? "action" : "neutral",
      badgeColor: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/25",
    },
    {
      label: "Open Returns",
      count: queues.openReturns,
      href: "/admin/returns",
      desc: "Client RMA inspect & refund",
      icon: RotateCcw,
      urgency: queues.openReturns > 0 ? "urgent" : "neutral",
      badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/25",
    },
    {
      label: "Low-Stock SKUs",
      count: queues.lowStockSkus,
      href: "/admin/stock",
      desc: "At or below safety threshold",
      icon: AlertTriangle,
      urgency: queues.lowStockSkus > 0 ? "warning" : "neutral",
      badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground">
          Priority Operational Queues
        </h2>
        <span className="text-[11px] font-sans text-muted-foreground">
          Click queue to open filtered workspace
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {queueCards.map((q) => {
          const Icon = q.icon
          return (
            <Link
              key={q.label}
              href={q.href}
              className="group bg-card border border-border p-3.5 rounded-none flex flex-col justify-between hover:border-foreground/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {q.label}
                </span>
                <Icon className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>

              <div className="my-2 flex items-baseline justify-between">
                <span className="text-2xl font-mono font-semibold text-foreground">
                  {q.count}
                </span>
                {q.count > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${q.badgeColor}`}>
                    Action req.
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="truncate">{q.desc}</span>
                <ArrowRight className="size-3 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* COD Settlement Balance Banner */}
      <div className="bg-card border border-border p-4 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted/60 border border-border">
            <Banknote className="size-4 text-foreground" />
          </div>
          <div>
            <div className="text-xs font-sans font-semibold text-foreground">
              Cash on Delivery (COD) Courier Reconciliation
            </div>
            <div className="text-[11px] font-sans text-muted-foreground">
              Real-time monitoring of courier collections and pending bank remittances.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 self-end sm:self-auto">
          <div>
            <div className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground">
              In-Transit / Unremitted
            </div>
            <div className="text-sm font-mono font-semibold text-amber-600 dark:text-amber-400">
              {formatAED(queues.codCashOutstandingFils)}
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground">
              Remitted / Settled
            </div>
            <div className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              {formatAED(queues.codCashCollectedFils)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
