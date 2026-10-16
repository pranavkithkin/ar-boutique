"use client"

import { useState, useTransition } from "react"
import { DashboardData, DashboardPeriod } from "../types"
import { getAdminDashboardData } from "../actions"
import { DashboardKpiCards } from "./DashboardKpiCards"
import { DashboardActionQueues } from "./DashboardActionQueues"
import { DashboardRevenueChart } from "./DashboardRevenueChart"
import { DashboardRecentFeeds } from "./DashboardRecentFeeds"
import { RefreshCw } from "lucide-react"

interface DashboardClientContainerProps {
  initialData: DashboardData
}

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: "Today",
  "7d": "7 Days",
  "30d": "30 Days",
  all: "All Time",
}

export function DashboardClientContainer({
  initialData,
}: DashboardClientContainerProps) {
  const [data, setData] = useState<DashboardData>(initialData)
  const [period, setPeriod] = useState<DashboardPeriod>(initialData.period)
  const [isPending, startTransition] = useTransition()

  const handlePeriodChange = (newPeriod: DashboardPeriod) => {
    setPeriod(newPeriod)
    startTransition(async () => {
      try {
        const freshData = await getAdminDashboardData(newPeriod)
        setData(freshData)
      } catch (err) {
        console.error("Failed to load dashboard data:", err)
      }
    })
  }

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const freshData = await getAdminDashboardData(period)
        setData(freshData)
      } catch (err) {
        console.error("Failed to refresh dashboard data:", err)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Executive Overview
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl text-foreground font-semibold tracking-tight mt-0.5">
            Store Performance & Operations
          </h1>
          <p className="mt-1 text-xs text-muted-foreground font-sans">
            Real-time analytics across catalogue inventory, Stripe card transactions, and courier Cash on Delivery.
          </p>
        </div>

        {/* Controls: Live pulse, period tabs, refresh */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-muted/40 border border-border text-xs text-muted-foreground font-mono">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Boutique Operations</span>
          </div>

          {/* Period Selector Tabs */}
          <div className="inline-flex p-0.5 bg-muted/60 border border-border">
            {(["today", "7d", "30d", "all"] as DashboardPeriod[]).map((p) => {
              const active = period === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePeriodChange(p)}
                  disabled={isPending}
                  className={`px-2.5 py-1 text-xs font-sans font-medium transition-colors ${
                    active
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              )
            })}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            title="Refresh dashboard metrics"
            className="p-1.5 bg-card border border-border text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`size-3.5 ${isPending ? "animate-spin text-foreground" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className={`space-y-6 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
        {/* 1. Real KPI Summary Cards */}
        <DashboardKpiCards kpis={data.kpis} />

        {/* 2. Priority Operational Queues */}
        <DashboardActionQueues queues={data.queues} />

        {/* 3. Revenue Trend Chart and Channel Distribution */}
        <DashboardRevenueChart chartData={data.chartData} kpis={data.kpis} />

        {/* 4. Live Activity Feeds: Recent Orders, Low Stock Alert, Returns */}
        <DashboardRecentFeeds
          recentOrders={data.recentOrders}
          lowStockItems={data.lowStockItems}
          recentReturns={data.recentReturns}
        />
      </div>
    </div>
  )
}
