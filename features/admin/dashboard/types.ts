export type DashboardPeriod = "today" | "7d" | "30d" | "all"

export interface DashboardKpiStats {
  grossRevenueFils: number
  orderCount: number
  averageOrderValueFils: number
  cardRevenueFils: number
  codRevenueFils: number
  totalSkus: number
  activeProducts: number
}

export interface DashboardQueueStats {
  codToConfirm: number
  toPack: number
  toShip: number
  openReturns: number
  lowStockSkus: number
  codCashOutstandingFils: number
  codCashCollectedFils: number
}

export interface DashboardRecentOrder {
  id: string
  orderNumber: string
  customerName: string
  email: string
  createdAt: string
  status: string
  paymentMethod: string
  paymentStatus: string
  totalFils: number
  itemsCount: number
}

export interface DashboardLowStockSku {
  variantId: string
  sku: string
  productName: string
  colourName: string
  sizeLabel: string | null
  onHand: number
  reserved: number
  available: number
}

export interface DashboardRecentReturn {
  id: string
  returnNumber: string
  orderNumber: string
  customerName: string
  status: string
  createdAt: string
}

export interface DashboardRevenueChartPoint {
  date: string
  label: string
  revenueAed: number
  orders: number
}

export interface DashboardData {
  period: DashboardPeriod
  kpis: DashboardKpiStats
  queues: DashboardQueueStats
  chartData: DashboardRevenueChartPoint[]
  recentOrders: DashboardRecentOrder[]
  lowStockItems: DashboardLowStockSku[]
  recentReturns: DashboardRecentReturn[]
  lastUpdated: string
}
