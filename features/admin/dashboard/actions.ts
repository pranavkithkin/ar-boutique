"use server"

import "server-only"
import { createAdminClient } from "@/lib/supabase/server"
import {
  DashboardData,
  DashboardPeriod,
  DashboardKpiStats,
  DashboardQueueStats,
  DashboardRecentOrder,
  DashboardLowStockSku,
  DashboardRecentReturn,
  DashboardRevenueChartPoint,
} from "./types"

interface OrderDbRow {
  id: string
  order_number: string
  created_at: string
  customer_name: string | null
  email: string | null
  status: string
  payment_method: string
  payment_status: string
  total_fils: number
  cash_collected_fils: number | null
  order_items?: Array<{ id: string; quantity: number }>
}

interface ReturnDbRow {
  id: string
  return_number: string
  order_id: string
  status: string
  created_at: string
  orders?: {
    order_number: string
    customer_name: string | null
    email: string | null
  } | null
}

interface VariantDbRow {
  id: string
  sku: string
  is_active: boolean
  sizes?: { label: string } | null
  stock_levels?: { on_hand: number; reserved: number } | null
  product_colours?: {
    colours?: { name: string } | null
    products?: { name: string } | null
  } | null
}

export async function getAdminDashboardData(
  period: DashboardPeriod = "7d"
): Promise<DashboardData> {
  const adminDb = createAdminClient()

  // 1. Fetch store settings for low stock threshold
  const { data: storeSettings } = await adminDb
    .from("settings")
    .select("low_stock_threshold")
    .limit(1)
    .single()

  const lowStockThreshold = storeSettings?.low_stock_threshold ?? 3

  // 2. Determine date filter boundary
  const now = new Date()
  let fromDate: Date | null = null
  if (period === "today") {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (period === "7d") {
    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (period === "30d") {
    fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  // 3. Fetch all orders with items
  const { data: rawOrders } = await adminDb
    .from("orders")
    .select(`
      id,
      order_number,
      created_at,
      customer_name,
      email,
      status,
      payment_method,
      payment_status,
      total_fils,
      cash_collected_fils,
      order_items (
        id,
        quantity
      )
    `)
    .order("created_at", { ascending: false })

  const allOrders: OrderDbRow[] = (rawOrders as unknown as OrderDbRow[]) || []

  // 4. Calculate operational queues across ALL orders
  let codToConfirm = 0
  let toPack = 0
  let toShip = 0
  let codCashCollectedFils = 0
  let codCashOutstandingFils = 0

  for (const o of allOrders) {
    if (o.payment_method === "cod" && o.status === "pending") {
      codToConfirm += 1
    }
    if (o.status === "confirmed") {
      toPack += 1
    }
    if (o.status === "packed") {
      toShip += 1
    }
    if (o.payment_method === "cod") {
      if (o.payment_status === "paid" || o.status === "delivered") {
        codCashCollectedFils += o.cash_collected_fils || o.total_fils || 0
      } else if (["shipped", "packed"].includes(o.status)) {
        codCashOutstandingFils += o.total_fils || 0
      }
    }
  }

  // 5. Filter orders for KPI calculations within selected period
  const filteredOrders = fromDate
    ? allOrders.filter((o) => new Date(o.created_at) >= fromDate)
    : allOrders

  let grossRevenueFils = 0
  let cardRevenueFils = 0
  let codRevenueFils = 0
  let successfulOrdersCount = 0

  for (const o of filteredOrders) {
    const isCompleted =
      o.payment_status === "paid" ||
      ["confirmed", "packed", "shipped", "delivered"].includes(o.status)

    if (isCompleted) {
      grossRevenueFils += o.total_fils || 0
      successfulOrdersCount += 1

      if (o.payment_method === "card") {
        cardRevenueFils += o.total_fils || 0
      } else if (o.payment_method === "cod") {
        codRevenueFils += o.total_fils || 0
      }
    }
  }

  const averageOrderValueFils =
    successfulOrdersCount > 0 ? Math.round(grossRevenueFils / successfulOrdersCount) : 0

  // 6. Fetch Catalogue Inventory stats & low stock SKUs
  const { data: rawVariants } = await adminDb
    .from("product_variants")
    .select(`
      id,
      sku,
      is_active,
      sizes ( label ),
      stock_levels ( on_hand, reserved ),
      product_colours (
        colours ( name ),
        products ( name )
      )
    `)

  const allVariants: VariantDbRow[] = (rawVariants as unknown as VariantDbRow[]) || []
  let lowStockSkusCount = 0
  const lowStockItems: DashboardLowStockSku[] = []

  for (const v of allVariants) {
    const onHand = v.stock_levels?.on_hand ?? 0
    const reserved = v.stock_levels?.reserved ?? 0
    const available = onHand - reserved

    if (v.is_active && available <= lowStockThreshold) {
      lowStockSkusCount += 1
      lowStockItems.push({
        variantId: v.id,
        sku: v.sku,
        productName: v.product_colours?.products?.name || "Boutique Item",
        colourName: v.product_colours?.colours?.name || "Standard",
        sizeLabel: v.sizes?.label || null,
        onHand,
        reserved,
        available,
      })
    }
  }

  // Sort low-stock items (lowest available first) and take top 5
  lowStockItems.sort((a, b) => a.available - b.available)
  const topLowStockItems = lowStockItems.slice(0, 5)

  // Count active products
  const { count: activeProductsCount } = await adminDb
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true)

  // 7. Fetch Return Requests
  const { data: rawReturns } = await adminDb
    .from("return_requests")
    .select(`
      id,
      return_number,
      order_id,
      status,
      created_at,
      orders (
        order_number,
        customer_name,
        email
      )
    `)
    .order("created_at", { ascending: false })

  const allReturns: ReturnDbRow[] = (rawReturns as unknown as ReturnDbRow[]) || []

  const openReturnsCount = allReturns.filter((r) =>
    ["requested", "approved", "in_transit"].includes(r.status)
  ).length

  const recentReturns: DashboardRecentReturn[] = allReturns.slice(0, 5).map((r) => ({
    id: r.id,
    returnNumber: r.return_number,
    orderNumber: r.orders?.order_number || "Order",
    customerName: r.orders?.customer_name || r.orders?.email || "Guest Client",
    status: r.status,
    createdAt: r.created_at,
  }))

  // 8. Build Recent Orders list (top 5)
  const recentOrders: DashboardRecentOrder[] = allOrders.slice(0, 5).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    customerName: o.customer_name || "Guest Client",
    email: o.email || "",
    createdAt: o.created_at,
    status: o.status,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    totalFils: o.total_fils || 0,
    itemsCount: o.order_items?.reduce((sum, it) => sum + it.quantity, 0) || 0,
  }))

  // 9. Generate Daily Revenue Chart Points
  const chartDaysCount = period === "today" ? 1 : period === "30d" ? 30 : 7
  const chartMap = new Map<string, { label: string; revenueFils: number; orders: number }>()

  // Initialize all days in the window
  for (let i = chartDaysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateKey = d.toISOString().split("T")[0]
    const label = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })
    chartMap.set(dateKey, { label, revenueFils: 0, orders: 0 })
  }

  // Populate from orders
  for (const o of allOrders) {
    const dateKey = new Date(o.created_at).toISOString().split("T")[0]
    if (chartMap.has(dateKey)) {
      const entry = chartMap.get(dateKey)!
      const isCompleted =
        o.payment_status === "paid" ||
        ["confirmed", "packed", "shipped", "delivered"].includes(o.status)
      if (isCompleted) {
        entry.revenueFils += o.total_fils || 0
        entry.orders += 1
      }
    }
  }

  const chartData: DashboardRevenueChartPoint[] = Array.from(chartMap.entries()).map(
    ([date, data]) => ({
      date,
      label: data.label,
      revenueAed: Math.round(data.revenueFils / 100),
      orders: data.orders,
    })
  )

  const kpis: DashboardKpiStats = {
    grossRevenueFils,
    orderCount: successfulOrdersCount,
    averageOrderValueFils,
    cardRevenueFils,
    codRevenueFils,
    totalSkus: allVariants.length,
    activeProducts: activeProductsCount || 0,
  }

  const queues: DashboardQueueStats = {
    codToConfirm,
    toPack,
    toShip,
    openReturns: openReturnsCount,
    lowStockSkus: lowStockSkusCount,
    codCashOutstandingFils,
    codCashCollectedFils,
  }

  return {
    period,
    kpis,
    queues,
    chartData,
    recentOrders,
    lowStockItems: topLowStockItems,
    recentReturns,
    lastUpdated: new Date().toISOString(),
  }
}
