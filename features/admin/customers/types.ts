export interface CustomerAddress {
  emirate: string
  area: string
  streetAddress: string
  building: string | null
  apartment: string | null
  landmark: string | null
}

export interface CustomerOrderSummary {
  id: string
  orderNumber: string
  createdAt: string
  status: string
  paymentMethod: string
  paymentStatus: string
  totalFils: number
  itemCount: number
  itemsSummary: string[]
}

export interface AdminCustomerListItem {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  clerkUserId: string | null
  codDisabled: boolean
  codDisabledReason: string | null
  notes: string | null
  totalOrders: number
  totalSpendFils: number
  codRefusals: number
  lastOrderAt: string | null
  createdAt: string
}

export interface AdminCustomerDetail extends AdminCustomerListItem {
  addresses: CustomerAddress[]
  orders: CustomerOrderSummary[]
  returnsCount: number
}

export interface GetAdminCustomersListParams {
  search?: string
  status?: string // 'all' | 'active' | 'cod_disabled' | 'vip'
  sort?: string // 'last_order' | 'spend' | 'orders' | 'name'
  page?: number
  pageSize?: number
}

export interface GetAdminCustomersListResult {
  customers: AdminCustomerListItem[]
  total: number
  currentPage: number
  totalPages: number
  pageSize: number
  activeCodCount: number
  blockedCodCount: number
  totalRevenueFils: number
}
