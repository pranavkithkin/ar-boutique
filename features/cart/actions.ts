"use server"

import "server-only"
import { createAdminClient } from "@/lib/supabase/server"

export interface SkuStockInfo {
  sku: string
  available: number
  maxAllowed: number
  isSoldOut: boolean
  unitsLeft: number | null
}

export type CartStockMap = Record<string, SkuStockInfo>

/**
 * Server Action to check real-time available stock (on_hand - reserved) for items in cart.
 * Adheres to ADR-026 (never leak raw counts; only <= 3 is exposed as scarcity notice).
 */
export async function getCartStockAvailabilityAction(
  skus: string[]
): Promise<{ success: boolean; data?: CartStockMap; error?: string }> {
  try {
    if (!skus || skus.length === 0) {
      return { success: true, data: {} }
    }

    const cleanSkus = Array.from(new Set(skus.map((s) => s.trim()))).filter(Boolean)
    if (cleanSkus.length === 0) {
      return { success: true, data: {} }
    }

    const supabase = createAdminClient()
    const { data: variants, error } = await supabase
      .from("product_variants")
      .select(`
        id,
        sku,
        is_active,
        stock_levels (
          on_hand,
          reserved
        )
      `)
      .in("sku", cleanSkus)

    if (error) {
      console.error("[Cart Stock] Error querying variants:", error)
      return { success: false, error: error.message }
    }

    const stockMap: CartStockMap = {}

    // Match against each requested SKU (handles deactivated, missing, or out of stock items)
    for (const sku of cleanSkus) {
      const v = (variants || []).find((it) => it.sku.toLowerCase() === sku.toLowerCase())

      if (!v || !v.is_active) {
        stockMap[sku] = {
          sku,
          available: 0,
          maxAllowed: 0,
          isSoldOut: true,
          unitsLeft: null,
        }
        continue
      }

      const stock = Array.isArray(v.stock_levels) ? v.stock_levels[0] : v.stock_levels
      const onHand = stock?.on_hand ?? 0
      const reserved = stock?.reserved ?? 0
      const available = Math.max(0, onHand - reserved)
      const isSoldOut = available <= 0
      const maxAllowed = Math.min(5, Math.max(0, available))
      const unitsLeft = available > 0 && available <= 3 ? available : null

      stockMap[sku] = {
        sku,
        available,
        maxAllowed,
        isSoldOut,
        unitsLeft,
      }
    }

    return { success: true, data: stockMap }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch stock availability"
    console.error("[Cart Stock] Unexpected error:", msg)
    return { success: false, error: msg }
  }
}

