"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import {
  AdminStockSkuItem,
  AdminStockSummary,
  AdminStockAdjustmentEntry,
  AdminStockMatrixRow,
  StockFilter,
  StockStatus,
} from "./types"

function getCloudinaryUrl(mediaKey?: string | null): string | null {
  if (!mediaKey) return null
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dsf4m1g5x"
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_limit,w_600,f_auto,q_auto/${mediaKey}`
}

export async function getAdminStockData(params: {
  search?: string
  status?: StockFilter
  page?: number
  pageSize?: number
}) {
  const page = Math.max(1, params.page || 1)
  const pageSize = Math.max(1, Math.min(params.pageSize || 20, 100))
  const search = (params.search || "").trim().toLowerCase()
  const statusFilter = params.status || "all"

  const supabase = createAdminClient()

  // Fetch all variants with nested relations
  const { data: rawVariants, error } = await supabase
    .from("product_variants")
    .select(`
      id,
      sku,
      price_fils,
      is_active,
      size_id,
      sizes:size_id (
        id,
        label,
        sort
      ),
      stock_levels (
        on_hand,
        reserved
      ),
      product_colours (
        id,
        style_code,
        colours:colour_id (
          id,
          name
        ),
        products:product_id (
          id,
          name,
          slug
        ),
        product_images (
          id,
          media_key,
          sort
        )
      )
    `)

  if (error) {
    console.error("Failed to query stock variants:", error)
    return {
      items: [],
      matrixRows: [],
      allSizeLabels: [],
      summary: {
        total_skus: 0,
        total_on_hand: 0,
        total_reserved: 0,
        total_available: 0,
        in_stock_count: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
      },
      pagination: {
        page: 1,
        pageSize,
        total: 0,
        totalPages: 0,
      },
    }
  }

  // Transform raw items into AdminStockSkuItem
  const allItems: AdminStockSkuItem[] = (rawVariants || []).map((row: any) => {
    const pc = row.product_colours
    const prod = pc?.products
    const colour = pc?.colours
    const size = row.sizes
    const stock = row.stock_levels

    const onHand = stock?.on_hand ?? 0
    const reserved = stock?.reserved ?? 0
    const available = Math.max(0, onHand - reserved)

    let status: StockStatus = "in_stock"
    if (available <= 0) {
      status = "out_of_stock"
    } else if (available <= 3) {
      status = "low_stock"
    }

    // Get primary thumbnail
    let thumbnailUrl: string | null = null
    const images = pc?.product_images || []
    const sortedImages = [...images].sort((a: any, b: any) => (a.sort || 0) - (b.sort || 0))
    if (sortedImages.length > 0 && sortedImages[0].media_key) {
      thumbnailUrl = getCloudinaryUrl(sortedImages[0].media_key)
    }

    return {
      variant_id: row.id,
      product_id: prod?.id || "",
      product_name: prod?.name || "Unnamed Product",
      product_slug: prod?.slug || "",
      colourway_id: pc?.id || "",
      colour_name: colour?.name || "Standard",
      style_code: pc?.style_code || "—",
      size_id: row.size_id || null,
      size_label: size?.label || "No size",
      size_sort: size?.sort ?? 999,
      sku: row.sku,
      price_fils: row.price_fils,
      is_active: row.is_active,
      on_hand: onHand,
      reserved,
      available,
      thumbnail_url: thumbnailUrl,
      status,
    }
  })

  // Compute overall summary across all SKUs
  const summary: AdminStockSummary = {
    total_skus: allItems.length,
    total_on_hand: allItems.reduce((acc, it) => acc + it.on_hand, 0),
    total_reserved: allItems.reduce((acc, it) => acc + it.reserved, 0),
    total_available: allItems.reduce((acc, it) => acc + it.available, 0),
    in_stock_count: allItems.filter((it) => it.status === "in_stock").length,
    low_stock_count: allItems.filter((it) => it.status === "low_stock").length,
    out_of_stock_count: allItems.filter((it) => it.status === "out_of_stock").length,
  }

  // Build matrix grouped by product colourway
  const sizeLabelsSet = new Set<string>()
  const colourwayMap = new Map<string, AdminStockMatrixRow>()

  for (const item of allItems) {
    sizeLabelsSet.add(item.size_label)

    if (!colourwayMap.has(item.colourway_id)) {
      colourwayMap.set(item.colourway_id, {
        colourway_id: item.colourway_id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_slug: item.product_slug,
        colour_name: item.colour_name,
        style_code: item.style_code,
        thumbnail_url: item.thumbnail_url,
        variants_by_size: {},
        total_on_hand: 0,
        total_reserved: 0,
        total_available: 0,
      })
    }

    const row = colourwayMap.get(item.colourway_id)!
    row.variants_by_size[item.size_label] = {
      variant_id: item.variant_id,
      sku: item.sku,
      size_label: item.size_label,
      on_hand: item.on_hand,
      reserved: item.reserved,
      available: item.available,
      status: item.status,
    }
    row.total_on_hand += item.on_hand
    row.total_reserved += item.reserved
    row.total_available += item.available
  }

  // Desired ordering for sizes: S, M, L, XL, XXL, No size
  const standardSizeOrder = ["S", "M", "L", "XL", "XXL", "No size"]
  const allSizeLabels = Array.from(sizeLabelsSet).sort((a, b) => {
    const idxA = standardSizeOrder.indexOf(a)
    const idxB = standardSizeOrder.indexOf(b)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.localeCompare(b)
  })

  // Filter items based on search and status
  let filteredItems = allItems.filter((it) => {
    if (statusFilter !== "all" && it.status !== statusFilter) {
      return false
    }

    if (search) {
      const matchSku = it.sku.toLowerCase().includes(search)
      const matchProduct = it.product_name.toLowerCase().includes(search)
      const matchStyle = it.style_code.toLowerCase().includes(search)
      const matchColour = it.colour_name.toLowerCase().includes(search)
      if (!matchSku && !matchProduct && !matchStyle && !matchColour) {
        return false
      }
    }

    return true
  })

  // Sort: low stock & out of stock first when filtering, or natural SKU sort
  filteredItems.sort((a, b) => {
    if (a.product_name !== b.product_name) {
      return a.product_name.localeCompare(b.product_name)
    }
    if (a.colour_name !== b.colour_name) {
      return a.colour_name.localeCompare(b.colour_name)
    }
    return a.size_sort - b.size_sort
  })

  // Filter matrix rows if search applies
  let matrixRows = Array.from(colourwayMap.values())
  if (search) {
    matrixRows = matrixRows.filter((r) => {
      const matchProduct = r.product_name.toLowerCase().includes(search)
      const matchStyle = r.style_code.toLowerCase().includes(search)
      const matchColour = r.colour_name.toLowerCase().includes(search)
      const matchSku = Object.values(r.variants_by_size).some((v) =>
        v.sku.toLowerCase().includes(search)
      )
      return matchProduct || matchStyle || matchColour || matchSku
    })
  }

  // Filter matrix rows if status filter applies
  if (statusFilter !== "all") {
    matrixRows = matrixRows.filter((r) =>
      Object.values(r.variants_by_size).some((v) => v.status === statusFilter)
    )
  }

  // Paginate table items
  const total = filteredItems.length
  const totalPages = Math.ceil(total / pageSize)
  const from = (page - 1) * pageSize
  const paginatedItems = filteredItems.slice(from, from + pageSize)

  return {
    items: paginatedItems,
    matrixRows,
    allSizeLabels,
    summary,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  }
}

/**
 * Fetch inventory adjustments history ledger for a specific variant SKU.
 */
export async function getVariantStockHistory(variantId: string): Promise<{
  success: boolean
  history: AdminStockAdjustmentEntry[]
  error?: string
}> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("inventory_adjustments")
    .select(`
      id,
      variant_id,
      delta,
      on_hand_before,
      on_hand_after,
      reason,
      note,
      actor_sub,
      created_at,
      return_id,
      import_id
    `)
    .eq("variant_id", variantId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to query variant stock history:", error)
    return { success: false, history: [], error: error.message }
  }

  return {
    success: true,
    history: (data || []) as AdminStockAdjustmentEntry[],
  }
}

/**
 * Adjust variant on-hand stock and write an inventory ledger audit record.
 */
export async function adjustVariantStock(input: {
  variantId: string
  productId: string
  newOnHand: number
  reason:
    | "restock"
    | "correction"
    | "opening stock"
    | "damaged"
    | "offline sale"
    | "return restock"
    | "COD refused"
  note?: string
}): Promise<{ success: boolean; error?: string; onHand?: number }> {
  if (input.newOnHand < 0) {
    return { success: false, error: "Stock on hand cannot be negative." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminDb = createAdminClient()

  const { data: currentLevel } = await adminDb
    .from("stock_levels")
    .select("on_hand, reserved")
    .eq("variant_id", input.variantId)
    .maybeSingle()

  const onHandBefore = currentLevel ? currentLevel.on_hand : 0
  const reserved = currentLevel ? currentLevel.reserved : 0

  if (input.newOnHand < reserved) {
    return {
      success: false,
      error: `Stock cannot fall below reserved quantity (${reserved} units currently reserved for customer orders).`,
    }
  }

  const delta = input.newOnHand - onHandBefore

  // Update stock_levels
  const { error: upsertErr } = await adminDb
    .from("stock_levels")
    .upsert(
      {
        variant_id: input.variantId,
        on_hand: input.newOnHand,
        reserved,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "variant_id" }
    )

  if (upsertErr) {
    console.error("Failed to update stock_levels:", upsertErr)
    return { success: false, error: upsertErr.message }
  }

  // Record audit row in inventory_adjustments
  if (delta !== 0) {
    const { error: adjErr } = await adminDb.from("inventory_adjustments").insert({
      variant_id: input.variantId,
      delta,
      on_hand_before: onHandBefore,
      on_hand_after: input.newOnHand,
      reason: input.reason,
      note: input.note || null,
      actor_sub: user?.id || "f93c1910-4399-41d2-88ac-e8d0bd43f0e7",
    })

    if (adjErr) {
      console.error("Failed to insert inventory_adjustment:", adjErr)
    }
  }

  revalidatePath("/admin/stock")
  if (input.productId) {
    revalidatePath(`/admin/products/${input.productId}`)
  }
  revalidatePath("/admin/products")

  return { success: true, onHand: input.newOnHand }
}
