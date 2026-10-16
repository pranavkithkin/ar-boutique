"use server"

import "server-only"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import {
  AdminCustomerListItem,
  AdminCustomerDetail,
  CustomerAddress,
  CustomerOrderSummary,
  GetAdminCustomersListParams,
  GetAdminCustomersListResult,
} from "./types"
import {
  updateCustomerCodSchema,
  updateCustomerNotesSchema,
  UpdateCustomerCodInput,
  UpdateCustomerNotesInput,
} from "./schemas"

interface RawOrderRow {
  id: string
  order_number: string
  created_at: string
  email: string
  customer_name: string | null
  phone: string | null
  emirate: string | null
  area: string | null
  street_address: string | null
  building: string | null
  apartment: string | null
  landmark: string | null
  status: string
  payment_method: string
  payment_status: string
  total_fils: number
  cancellation_reason: string | null
  order_items?: Array<{
    id: string
    quantity: number
    product_name?: string | null
    colour_name?: string | null
    size_name?: string | null
  }>
}

/**
 * Syncs any un-indexed order emails into public.customers table.
 */
async function syncCustomersFromOrders(adminDb: ReturnType<typeof createAdminClient>) {
  try {
    const { data: unindexedOrders } = await adminDb
      .from("orders")
      .select("email, customer_name, phone, clerk_user_id, created_at")
      .not("email", "is", null)
      .neq("email", "")

    if (!unindexedOrders || unindexedOrders.length === 0) return

    // Group earliest appearance per email
    const uniqueMap = new Map<string, { email: string; full_name: string | null; phone: string | null; clerk_user_id: string | null; created_at: string }>()
    for (const ord of unindexedOrders) {
      const emailLower = ord.email.toLowerCase().trim()
      if (!uniqueMap.has(emailLower)) {
        uniqueMap.set(emailLower, {
          email: emailLower,
          full_name: ord.customer_name || null,
          phone: ord.phone || null,
          clerk_user_id: ord.clerk_user_id || null,
          created_at: ord.created_at,
        })
      }
    }

    const payload = Array.from(uniqueMap.values())
    if (payload.length > 0) {
      await adminDb.from("customers").upsert(payload, { onConflict: "email", ignoreDuplicates: true })
    }
  } catch (err) {
    console.error("Failed to sync customers from orders:", err)
  }
}

/**
 * Fetch paginated boutique customer directory with aggregated spend and COD controls.
 */
export async function getAdminCustomersList({
  search = "",
  status = "all",
  sort = "last_order",
  page = 1,
  pageSize = 10,
}: GetAdminCustomersListParams): Promise<GetAdminCustomersListResult> {
  const adminDb = createAdminClient()

  // Ensure any newly placed orders are synced
  await syncCustomersFromOrders(adminDb)

  // Fetch all customers
  const { data: customersRaw, error: custErr } = await adminDb
    .from("customers")
    .select("*")

  if (custErr) {
    console.error("Error fetching customers:", custErr)
    return {
      customers: [],
      total: 0,
      currentPage: 1,
      totalPages: 1,
      pageSize,
      activeCodCount: 0,
      blockedCodCount: 0,
      totalRevenueFils: 0,
    }
  }

  // Fetch all orders for aggregation
  const { data: ordersRaw, error: ordErr } = await adminDb
    .from("orders")
    .select("id, order_number, email, customer_name, phone, status, payment_method, payment_status, total_fils, cancellation_reason, created_at")

  if (ordErr) {
    console.error("Error fetching orders for aggregation:", ordErr)
  }

  const allOrders: RawOrderRow[] = (ordersRaw as unknown as RawOrderRow[]) || []

  // Pre-calculate order stats grouped by lowercase email
  const statsByEmail = new Map<
    string,
    {
      orderCount: number
      totalSpendFils: number
      codRefusals: number
      lastOrderAt: string | null
      latestName: string | null
      latestPhone: string | null
    }
  >()

  let overallRevenueFils = 0

  for (const o of allOrders) {
    if (!o.email) continue
    const emailKey = o.email.toLowerCase().trim()

    let stat = statsByEmail.get(emailKey)
    if (!stat) {
      stat = {
        orderCount: 0,
        totalSpendFils: 0,
        codRefusals: 0,
        lastOrderAt: null,
        latestName: null,
        latestPhone: null,
      }
      statsByEmail.set(emailKey, stat)
    }

    stat.orderCount += 1

    // Count spend for completed/paid orders
    const isPaid = o.payment_status === "paid" || ["confirmed", "packed", "shipped", "delivered"].includes(o.status)
    if (isPaid) {
      stat.totalSpendFils += o.total_fils || 0
      overallRevenueFils += o.total_fils || 0
    }

    // COD Refusal check
    const isCod = o.payment_method === "cod"
    const isRefused =
      isCod &&
      (o.status === "returned" ||
        (o.status === "cancelled" &&
          (o.cancellation_reason?.toLowerCase().includes("refus") ||
            o.cancellation_reason?.toLowerCase().includes("rejected") ||
            o.cancellation_reason?.toLowerCase().includes("not accepted"))))
    if (isRefused) {
      stat.codRefusals += 1
    }

    // Track latest order timestamp and details
    if (!stat.lastOrderAt || new Date(o.created_at) > new Date(stat.lastOrderAt)) {
      stat.lastOrderAt = o.created_at
      if (o.customer_name) stat.latestName = o.customer_name
      if (o.phone) stat.latestPhone = o.phone
    }
  }

  // Map customer records to AdminCustomerListItem
  const mappedCustomers: AdminCustomerListItem[] = (customersRaw || []).map((c) => {
    const emailKey = c.email.toLowerCase().trim()
    const st = statsByEmail.get(emailKey)

    return {
      id: c.id,
      email: c.email,
      fullName: c.full_name || st?.latestName || null,
      phone: c.phone || st?.latestPhone || null,
      clerkUserId: c.clerk_user_id || null,
      codDisabled: Boolean(c.cod_disabled),
      codDisabledReason: c.cod_disabled_reason || null,
      notes: c.notes || null,
      totalOrders: st?.orderCount || 0,
      totalSpendFils: st?.totalSpendFils || 0,
      codRefusals: st?.codRefusals || 0,
      lastOrderAt: st?.lastOrderAt || null,
      createdAt: c.created_at,
    }
  })

  // Global counts
  const activeCodCount = mappedCustomers.filter((c) => !c.codDisabled).length
  const blockedCodCount = mappedCustomers.filter((c) => c.codDisabled).length

  // Filter by search
  let filtered = mappedCustomers
  if (search.trim()) {
    const q = search.toLowerCase().trim()
    filtered = filtered.filter((c) => {
      const matchName = c.fullName?.toLowerCase().includes(q)
      const matchEmail = c.email.toLowerCase().includes(q)
      const matchPhone = c.phone?.toLowerCase().includes(q)
      return matchName || matchEmail || matchPhone
    })
  }

  // Filter by status tab
  if (status === "active") {
    filtered = filtered.filter((c) => !c.codDisabled)
  } else if (status === "cod_disabled") {
    filtered = filtered.filter((c) => c.codDisabled)
  } else if (status === "vip") {
    filtered = filtered.filter((c) => c.totalSpendFils >= 100000) // 1,000 AED or more
  }

  // Sorting
  filtered.sort((a, b) => {
    if (sort === "spend") {
      return b.totalSpendFils - a.totalSpendFils
    }
    if (sort === "orders") {
      return b.totalOrders - a.totalOrders
    }
    if (sort === "name") {
      return (a.fullName || a.email).localeCompare(b.fullName || b.email)
    }
    // Default: 'last_order' (newest order or created date first)
    const timeA = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : new Date(a.createdAt).getTime()
    const timeB = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : new Date(b.createdAt).getTime()
    return timeB - timeA
  })

  // Pagination
  const total = filtered.length
  const safePage = Math.max(1, page)
  const totalPages = Math.ceil(total / pageSize) || 1
  const startIndex = (safePage - 1) * pageSize
  const paginatedCustomers = filtered.slice(startIndex, startIndex + pageSize)

  return {
    customers: paginatedCustomers,
    total,
    currentPage: safePage,
    totalPages,
    pageSize,
    activeCodCount,
    blockedCodCount,
    totalRevenueFils: overallRevenueFils,
  }
}

/**
 * Fetch complete profile, delivery addresses, and full order history for a single customer.
 */
export async function getAdminCustomerDetails(customerId: string): Promise<AdminCustomerDetail | null> {
  const adminDb = createAdminClient()

  const { data: customer, error: custErr } = await adminDb
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single()

  if (custErr || !customer) {
    console.error("Customer not found:", custErr)
    return null
  }

  // Fetch all orders matching customer email or clerk_user_id
  const ordersQuery = adminDb
    .from("orders")
    .select(`
      id,
      order_number,
      created_at,
      email,
      customer_name,
      phone,
      emirate,
      area,
      street_address,
      building,
      apartment,
      landmark,
      status,
      payment_method,
      payment_status,
      total_fils,
      cancellation_reason,
      order_items (
        id,
        quantity,
        product_name,
        colour_name,
        size_name
      )
    `)
    .eq("email", customer.email)
    .order("created_at", { ascending: false })

  const { data: ordersRaw, error: ordErr } = await ordersQuery

  if (ordErr) {
    console.error("Error fetching customer orders:", ordErr)
  }

  const ordersList: RawOrderRow[] = (ordersRaw as unknown as RawOrderRow[]) || []

  // Extract unique UAE addresses
  const addressMap = new Map<string, CustomerAddress>()
  for (const o of ordersList) {
    if (o.emirate && o.street_address) {
      const key = `${o.emirate}-${o.area || ""}-${o.street_address}-${o.building || ""}-${o.apartment || ""}`
      if (!addressMap.has(key)) {
        addressMap.set(key, {
          emirate: o.emirate,
          area: o.area || "",
          streetAddress: o.street_address,
          building: o.building || null,
          apartment: o.apartment || null,
          landmark: o.landmark || null,
        })
      }
    }
  }

  let totalSpendFils = 0
  let codRefusals = 0

  const ordersSummaries: CustomerOrderSummary[] = ordersList.map((o) => {
    const isPaid = o.payment_status === "paid" || ["confirmed", "packed", "shipped", "delivered"].includes(o.status)
    if (isPaid) {
      totalSpendFils += o.total_fils || 0
    }

    const isCod = o.payment_method === "cod"
    const isRefused =
      isCod &&
      (o.status === "returned" ||
        (o.status === "cancelled" &&
          (o.cancellation_reason?.toLowerCase().includes("refus") ||
            o.cancellation_reason?.toLowerCase().includes("rejected") ||
            o.cancellation_reason?.toLowerCase().includes("not accepted"))))
    if (isRefused) {
      codRefusals += 1
    }

    const itemsSummary = (o.order_items || []).map((it) => {
      const parts = [it.product_name || "Item"]
      if (it.colour_name) parts.push(it.colour_name)
      if (it.size_name) parts.push(it.size_name)
      return `${it.quantity}x ${parts.join(" - ")}`
    })

    return {
      id: o.id,
      orderNumber: o.order_number,
      createdAt: o.created_at,
      status: o.status,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      totalFils: o.total_fils || 0,
      itemCount: o.order_items?.reduce((acc, curr) => acc + curr.quantity, 0) || 0,
      itemsSummary,
    }
  })

  // Check returns count
  const { count: returnsCount } = await adminDb
    .from("return_requests")
    .select("id", { count: "exact", head: true })
    .in("order_id", ordersList.map((o) => o.id))

  const lastOrderAt = ordersList.length > 0 ? ordersList[0].created_at : null

  return {
    id: customer.id,
    email: customer.email,
    fullName: customer.full_name || (ordersList.length > 0 ? ordersList[0].customer_name : null),
    phone: customer.phone || (ordersList.length > 0 ? ordersList[0].phone : null),
    clerkUserId: customer.clerk_user_id || null,
    codDisabled: Boolean(customer.cod_disabled),
    codDisabledReason: customer.cod_disabled_reason || null,
    notes: customer.notes || null,
    totalOrders: ordersList.length,
    totalSpendFils,
    codRefusals,
    lastOrderAt,
    createdAt: customer.created_at,
    addresses: Array.from(addressMap.values()),
    orders: ordersSummaries,
    returnsCount: returnsCount || 0,
  }
}

/**
 * Server Action: Toggle COD permission for a customer.
 */
export async function toggleCustomerCodAction(rawInput: UpdateCustomerCodInput) {
  try {
    const input = updateCustomerCodSchema.parse(rawInput)
    const adminDb = createAdminClient()

    // Fetch existing customer state for audit log
    const { data: currentCustomer } = await adminDb
      .from("customers")
      .select("id, email, cod_disabled, cod_disabled_reason")
      .eq("id", input.customerId)
      .single()

    const { error } = await adminDb
      .from("customers")
      .update({
        cod_disabled: input.codDisabled,
        cod_disabled_reason: input.codDisabled ? input.codDisabledReason || "Disabled by admin" : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.customerId)

    if (error) {
      console.error("Error updating customer COD permission:", error)
      return { success: false, error: "Failed to update customer COD restriction." }
    }

    // Write audit log
    await adminDb.from("audit_log").insert({
      actor_sub: "admin",
      action: input.codDisabled ? "customer_cod_disabled" : "customer_cod_enabled",
      entity_type: "customer",
      entity_id: input.customerId,
      before_data: currentCustomer,
      after_data: {
        cod_disabled: input.codDisabled,
        cod_disabled_reason: input.codDisabled ? input.codDisabledReason : null,
      },
    })

    revalidatePath("/admin/customers")
    return { success: true }
  } catch (err: unknown) {
    console.error("toggleCustomerCodAction error:", err)
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return { success: false, error: msg }
  }
}

/**
 * Server Action: Update internal admin notes for a customer.
 */
export async function updateCustomerNotesAction(rawInput: UpdateCustomerNotesInput) {
  try {
    const input = updateCustomerNotesSchema.parse(rawInput)
    const adminDb = createAdminClient()

    const { error } = await adminDb
      .from("customers")
      .update({
        notes: input.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.customerId)

    if (error) {
      console.error("Error updating customer notes:", error)
      return { success: false, error: "Failed to update notes." }
    }

    revalidatePath("/admin/customers")
    return { success: true }
  } catch (err: unknown) {
    console.error("updateCustomerNotesAction error:", err)
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return { success: false, error: msg }
  }
}
