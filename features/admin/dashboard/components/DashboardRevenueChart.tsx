"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
} from "recharts"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta"
import { DashboardRevenueChartPoint, DashboardKpiStats } from "../types"
import { formatAED } from "@/lib/money"
import { CreditCard, Banknote } from "lucide-react"

interface DashboardRevenueChartProps {
  chartData: DashboardRevenueChartPoint[]
  kpis: DashboardKpiStats
}

const chartConfig = {
  revenueAed: {
    label: "Net Revenue",
    color: "var(--chart-2)",
  },
  orders: {
    label: "Orders",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

function CustomGradientBar(
  props: React.SVGProps<SVGRectElement> & {
    index?: number
    dataKey?: string | number
  }
) {
  const {
    fill,
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    dataKey = "revenueAed",
    index = 0,
  } = props
  const gid = `dashboard-gradient-${String(dataKey)}-${index}`

  return (
    <>
      <rect
        fill={`url(#${gid})`}
        height={height}
        stroke="none"
        width={width}
        x={x}
        y={y}
      />
      <rect fill={fill} height={2} stroke="none" width={width} x={x} y={y} />
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.6} />
          <stop offset="100%" stopColor={fill} stopOpacity={0.08} />
        </linearGradient>
      </defs>
    </>
  )
}

export function DashboardRevenueChart({
  chartData,
  kpis,
}: DashboardRevenueChartProps) {
  const [chartType, setChartType] = React.useState<"line" | "bar">("line")

  const cardPct =
    kpis.grossRevenueFils > 0
      ? Math.round((kpis.cardRevenueFils / kpis.grossRevenueFils) * 100)
      : 0
  const codPct =
    kpis.grossRevenueFils > 0
      ? Math.round((kpis.codRevenueFils / kpis.grossRevenueFils) * 100)
      : 0

  const firstDay = chartData[0]?.revenueAed ?? 0
  const lastDay = chartData.at(-1)?.revenueAed ?? firstDay
  const growthPct =
    firstDay > 0 ? (((lastDay - firstDay) / firstDay) * 100).toFixed(1) : "0.0"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Daily Revenue Chart with Shadcn ChartContainer */}
      <div className="lg:col-span-2 bg-card border border-border p-5 rounded-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-sans font-semibold text-foreground">
                Revenue & Order Volume
              </h3>
              {chartData.length > 1 && (
                <Delta value={Number(growthPct)} variant="badge">
                  <DeltaIcon variant="trend" />
                  <DeltaValue />
                </Delta>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Daily revenue in AED across card and confirmed COD transactions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs text-muted-foreground font-sans font-medium tabular-nums">
              Total AED {Math.round(kpis.grossRevenueFils / 100).toLocaleString()}
            </div>
            <div className="inline-flex items-center p-0.5 border border-border bg-muted/40 rounded-xs">
              <button
                type="button"
                onClick={() => setChartType("line")}
                className={`px-2.5 py-1 text-[11px] font-sans font-medium transition-colors rounded-xs ${
                  chartType === "line"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Line
              </button>
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`px-2.5 py-1 text-[11px] font-sans font-medium transition-colors rounded-xs ${
                  chartType === "bar"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Bar
              </button>
            </div>
          </div>
        </div>

        <div className="w-full">
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
              No revenue recorded for this period
            </div>
          ) : (
            <ChartContainer
              className="aspect-auto h-64 w-full"
              config={chartConfig}
            >
              {chartType === "line" ? (
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ top: 12, right: 12, left: 12, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="dashboardRevenueLineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-revenueAed)" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="var(--color-revenueAed)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    className="stroke-border/40"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    className="text-xs text-muted-foreground font-sans"
                  />
                  <ChartTooltip
                    cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "3 3" }}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        formatter={(value, name) => (
                          <div className="flex min-w-36 items-center justify-between text-xs gap-4">
                            <span className="text-muted-foreground">
                              {name === "revenueAed" ? "Net Revenue" : "Orders"}
                            </span>
                            <span className="font-sans font-medium text-foreground tabular-nums">
                              {name === "revenueAed"
                                ? `AED ${Number(value).toLocaleString()}`
                                : value}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenueAed"
                    stroke="var(--color-revenueAed)"
                    strokeWidth={2.5}
                    fill="url(#dashboardRevenueLineGradient)"
                    dot={{
                      r: 3.5,
                      fill: "var(--color-revenueAed)",
                      stroke: "var(--background)",
                      strokeWidth: 1.5,
                    }}
                    activeDot={{
                      r: 6,
                      fill: "var(--color-revenueAed)",
                      stroke: "var(--background)",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ top: 12, right: 12, left: 12, bottom: 4 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    className="stroke-border/40"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    className="text-xs text-muted-foreground font-sans"
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        formatter={(value, name) => (
                          <div className="flex min-w-36 items-center justify-between text-xs gap-4">
                            <span className="text-muted-foreground">
                              {name === "revenueAed" ? "Net Revenue" : "Orders"}
                            </span>
                            <span className="font-sans font-medium text-foreground tabular-nums">
                              {name === "revenueAed"
                                ? `AED ${Number(value).toLocaleString()}`
                                : value}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar
                    dataKey="revenueAed"
                    fill="var(--color-revenueAed)"
                    shape={<CustomGradientBar />}
                  />
                </BarChart>
              )}
            </ChartContainer>
          )}
        </div>
      </div>

      {/* 2. Payment Method Mix (1 col) */}
      <div className="bg-card border border-border p-5 rounded-none space-y-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-sans font-semibold text-foreground">
            Payment Method Split
          </h3>
          <p className="text-xs text-muted-foreground">
            Breakdown of collected gross sales by gateway vs cash.
          </p>
        </div>

        <div className="space-y-4 my-auto">
          {/* Card */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <CreditCard className="size-3.5 text-muted-foreground" />
                Stripe Card
              </span>
              <span className="font-sans font-medium text-muted-foreground tabular-nums">
                {formatAED(kpis.cardRevenueFils)} ({cardPct}%)
              </span>
            </div>
            <div className="h-2 w-full bg-muted/60 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${cardPct}%` }}
              />
            </div>
          </div>

          {/* COD */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Banknote className="size-3.5 text-muted-foreground" />
                Cash on Delivery (COD)
              </span>
              <span className="font-sans font-medium text-muted-foreground tabular-nums">
                {formatAED(kpis.codRevenueFils)} ({codPct}%)
              </span>
            </div>
            <div className="h-2 w-full bg-muted/60 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${codPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-3 bg-muted/40 border border-border text-[11px] text-muted-foreground leading-relaxed">
          Stripe card transactions are automatically settled and marked paid. Cash on delivery orders require courier confirmation and terminal collection receipt.
        </div>
      </div>
    </div>
  )
}
