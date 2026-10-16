import { DashboardKpiStats } from "../types"
import { formatAED } from "@/lib/money"
import { ShoppingBag, DollarSign, Layers, Receipt } from "lucide-react"

interface DashboardKpiCardsProps {
  kpis: DashboardKpiStats
}

export function DashboardKpiCards({ kpis }: DashboardKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Gross Revenue */}
      <div className="bg-card border border-border p-5 rounded-none space-y-3">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-sans font-medium uppercase tracking-wider">
            Gross Revenue
          </span>
          <div className="p-1.5 bg-muted/60 border border-border">
            <DollarSign className="size-4 text-foreground" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-mono font-semibold text-foreground tracking-tight">
            {formatAED(kpis.grossRevenueFils)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] font-sans text-muted-foreground">
            <span>Card: <strong className="font-mono text-foreground">{formatAED(kpis.cardRevenueFils)}</strong></span>
            <span>•</span>
            <span>COD: <strong className="font-mono text-foreground">{formatAED(kpis.codRevenueFils)}</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Orders Count */}
      <div className="bg-card border border-border p-5 rounded-none space-y-3">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-sans font-medium uppercase tracking-wider">
            Orders Received
          </span>
          <div className="p-1.5 bg-muted/60 border border-border">
            <ShoppingBag className="size-4 text-foreground" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-mono font-semibold text-foreground tracking-tight">
            {kpis.orderCount}
          </div>
          <div className="mt-1 text-[11px] font-sans text-muted-foreground">
            Confirmed & completed transactions
          </div>
        </div>
      </div>

      {/* 3. Average Order Value */}
      <div className="bg-card border border-border p-5 rounded-none space-y-3">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-sans font-medium uppercase tracking-wider">
            Average Order Value
          </span>
          <div className="p-1.5 bg-muted/60 border border-border">
            <Receipt className="size-4 text-foreground" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-mono font-semibold text-foreground tracking-tight">
            {formatAED(kpis.averageOrderValueFils)}
          </div>
          <div className="mt-1 text-[11px] font-sans text-muted-foreground">
            Basket size across period orders
          </div>
        </div>
      </div>

      {/* 4. Active Catalogue */}
      <div className="bg-card border border-border p-5 rounded-none space-y-3">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-sans font-medium uppercase tracking-wider">
            Active Catalogue
          </span>
          <div className="p-1.5 bg-muted/60 border border-border">
            <Layers className="size-4 text-foreground" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-mono font-semibold text-foreground tracking-tight">
            {kpis.activeProducts} <span className="text-sm font-sans font-normal text-muted-foreground">Products</span>
          </div>
          <div className="mt-1 text-[11px] font-sans text-muted-foreground">
            <strong className="font-mono text-foreground">{kpis.totalSkus}</strong> total SKUs tracked
          </div>
        </div>
      </div>
    </div>
  )
}
