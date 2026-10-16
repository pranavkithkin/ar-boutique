"use server"

import "server-only"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { StoreSettings, DEFAULT_SETTINGS, FAQItem } from "./types"

/**
 * Fetch store settings from the database `settings` table (single-row table where id = true).
 * Falls back safely to DEFAULT_SETTINGS on error or missing row.
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", true)
      .maybeSingle()

    if (error || !data) {
      if (error) console.error("Error fetching settings:", error.message)
      return DEFAULT_SETTINGS
    }

    // Map database columns to StoreSettings
    return {
      store_name: data.store_name || DEFAULT_SETTINGS.store_name,
      store_email: data.store_email || DEFAULT_SETTINGS.store_email,
      store_phone: data.store_phone || DEFAULT_SETTINGS.store_phone,
      store_address: data.store_address || DEFAULT_SETTINGS.store_address,
      trn: data.trn || "",
      vat_enabled: typeof data.vat_enabled === "boolean" ? data.vat_enabled : false,
      vat_rate_pct: data.vat_rate_bps ? Math.round(data.vat_rate_bps / 100) : 5,
      delivery_fee_fils: typeof data.delivery_fee_fils === "number" ? data.delivery_fee_fils : 0,
      free_delivery_over_fils:
        typeof data.free_delivery_threshold_fils === "number"
          ? data.free_delivery_threshold_fils
          : 0,
      return_window_days:
        typeof data.return_window_days === "number" ? data.return_window_days : 14,
      return_expiry_days:
        typeof data.return_expiry_days === "number" ? data.return_expiry_days : 7,
      return_instructions: data.return_instructions || "",
      announcement_bar_text: data.announcement_text || "",
      announcement_bar_enabled:
        typeof data.announcement_bar_enabled === "boolean"
          ? data.announcement_bar_enabled
          : false,
      admin_notification_email: data.admin_notification_email || "",
      low_stock_threshold:
        typeof data.low_stock_threshold === "number" ? data.low_stock_threshold : 3,
      cod_enabled: typeof data.cod_enabled === "boolean" ? data.cod_enabled : false,
      cod_fee_fils: typeof data.cod_fee_fils === "number" ? data.cod_fee_fils : 0,
      cod_max_order_fils:
        typeof data.cod_max_order_fils === "number" ? data.cod_max_order_fils : 500000,
      cod_confirm_hours:
        typeof data.cod_confirm_hours === "number" ? data.cod_confirm_hours : 24,
      cod_refused_block_count:
        typeof data.cod_refusal_limit === "number" ? data.cod_refusal_limit : 3,
      faqs: (Array.isArray(data.faqs) && data.faqs.length > 0
        ? data.faqs
        : DEFAULT_SETTINGS.faqs) as FAQItem[],
    }
  } catch (err) {
    console.error("Failed to load settings:", err)
    return DEFAULT_SETTINGS
  }
}

/**
 * Persist updated settings to the `settings` table.
 * Translates StoreSettings field names to database columns and invalidates cache tags/paths.
 */
export async function updateStoreSettingsAction(
  data: Partial<StoreSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = createAdminClient()

    // Map StoreSettings fields to database columns
    const dbPayload: Record<string, unknown> = {
      id: true,
      updated_at: new Date().toISOString(),
    }

    if (data.store_name !== undefined) dbPayload.store_name = data.store_name
    if (data.store_email !== undefined) dbPayload.store_email = data.store_email
    if (data.store_phone !== undefined) dbPayload.store_phone = data.store_phone
    if (data.store_address !== undefined) dbPayload.store_address = data.store_address
    if (data.trn !== undefined) dbPayload.trn = data.trn
    if (data.vat_enabled !== undefined) dbPayload.vat_enabled = data.vat_enabled
    if (data.vat_rate_pct !== undefined) dbPayload.vat_rate_bps = data.vat_rate_pct * 100
    if (data.delivery_fee_fils !== undefined) dbPayload.delivery_fee_fils = data.delivery_fee_fils
    if (data.free_delivery_over_fils !== undefined) {
      dbPayload.free_delivery_threshold_fils = data.free_delivery_over_fils
    }
    if (data.return_window_days !== undefined) {
      dbPayload.return_window_days = data.return_window_days
    }
    if (data.return_expiry_days !== undefined) {
      dbPayload.return_expiry_days = data.return_expiry_days
    }
    if (data.return_instructions !== undefined) {
      dbPayload.return_instructions = data.return_instructions
    }
    if (data.announcement_bar_text !== undefined) {
      dbPayload.announcement_text = data.announcement_bar_text
    }
    if (data.announcement_bar_enabled !== undefined) {
      dbPayload.announcement_bar_enabled = data.announcement_bar_enabled
    }
    if (data.admin_notification_email !== undefined) {
      dbPayload.admin_notification_email = data.admin_notification_email
    }
    if (data.low_stock_threshold !== undefined) {
      // Validate clamp [1, 3] per check constraint
      dbPayload.low_stock_threshold = Math.min(3, Math.max(1, data.low_stock_threshold))
    }
    if (data.cod_enabled !== undefined) dbPayload.cod_enabled = data.cod_enabled
    if (data.cod_fee_fils !== undefined) dbPayload.cod_fee_fils = data.cod_fee_fils
    if (data.cod_max_order_fils !== undefined) {
      dbPayload.cod_max_order_fils = data.cod_max_order_fils
    }
    if (data.cod_confirm_hours !== undefined) {
      dbPayload.cod_confirm_hours = data.cod_confirm_hours
    }
    if (data.cod_refused_block_count !== undefined) {
      dbPayload.cod_refusal_limit = data.cod_refused_block_count
    }
    if (data.faqs !== undefined) {
      dbPayload.faqs = data.faqs
    }

    const { error } = await adminDb
      .from("settings")
      .upsert(dbPayload, { onConflict: "id" })

    if (error) {
      console.error("Failed to update store settings in DB:", error)
      return { success: false, error: error.message }
    }

    // Bust cache across storefront and admin
    revalidatePath("/", "layout")
    revalidatePath("/admin/settings")
    revalidatePath("/contact")

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error while saving settings"
    console.error("updateStoreSettingsAction exception:", message)
    return { success: false, error: message }
  }
}
