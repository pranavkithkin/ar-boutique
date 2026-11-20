"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/supabase/admin-auth"
import { createAdminClient } from "@/lib/supabase/server"
import { getStoreSettings } from "@/features/admin/settings/actions"
import { offerSchema } from "./schemas"
import { findPublishedProductsByStyleCodes, listOffers, quoteOffer, saveOffer } from "./service"
import type { Offer, OfferQuote } from "./types"
import { readStyleCodeSheet } from "@/lib/sheets/style-code-reader"

export async function saveOfferAction(id: string | null, input: unknown) {
  const admin = await requireAdmin()
  if (!admin) return { success: false as const, error: "Admin access required." }
  const parsed = offerSchema.safeParse(input)
  if (!parsed.success || (id && !z.string().uuid().safeParse(id).success)) return { success: false as const, error: parsed.error?.issues[0]?.message ?? "Invalid offer." }
  const result = await saveOffer(id, parsed.data.discount_type === "free_shipping" ? { ...parsed.data, discount_value: 0, max_discount_fils: null } : parsed.data, admin.id)
  if (result.success) {
    revalidatePath("/admin/offers")
    revalidatePath(`/offers/${parsed.data.slug}`)
  }
  return result
}

const automaticOfferItemsSchema = z.array(z.object({
  variantId: z.string().uuid(), productId: z.string().uuid(), quantity: z.number().int().min(1).max(5),
})).min(1).max(100)

export async function bestAutomaticOfferAction(items: unknown, email?: string) {
  const parsed = automaticOfferItemsSchema.safeParse(items)
  if (!parsed.success || (email && !z.string().email().safeParse(email).success)) {
    return { success: false as const, error: "Your bag could not be checked for offers." }
  }

  const now = new Date()
  const offers = (await listOffers()).filter(offer => offer.status === "published"
    && (!offer.starts_at || new Date(offer.starts_at) <= now)
    && (!offer.expires_at || new Date(offer.expires_at) > now))
  if (!offers.length) return { success: true as const, offer: null, quote: null }

  const productIds = [...new Set(parsed.data.map(item => item.productId))]
  const { data: products, error } = await createAdminClient()
    .from("products").select("id,category_id").in("id", productIds)
  if (error) return { success: false as const, error: "Offers could not be checked. Please try again." }
  const categories = new Map((products ?? []).map(product => [product.id, product.category_id]))
  const cartProductIds = new Set(productIds)
  const candidates = offers.filter(offer => offer.scope === "all"
    || (offer.scope === "products" && offer.product_ids.some(id => cartProductIds.has(id)))
    || (offer.scope === "categories" && offer.category_ids.some(id => productIds.some(productId => categories.get(productId) === id))))

  const results = await Promise.all(candidates.map(async (offer: Offer) => ({
    offer,
    result: await quoteOffer(offer.slug, parsed.data.map(({ variantId, quantity }) => ({ variantId, quantity })), email),
  })))
  if (results.some(item => !item.result.success && item.result.error === "Offer could not be checked. Please try again.")) {
    return { success: false as const, error: "Offers could not be checked. Please try again." }
  }
  const qualified: { offer: Offer; result: { success: true; quote: OfferQuote } }[] = results.filter(
    (item): item is { offer: Offer; result: { success: true; quote: OfferQuote } } => item.result.success,
  )
  if (!qualified.length) return { success: true as const, offer: null, quote: null }

  const subtotal = qualified[0].result.quote.subtotal_fils
  const settings = await getStoreSettings()
  const baseDelivery = subtotal >= settings.free_delivery_over_fils ? 0 : settings.delivery_fee_fils
  qualified.sort((a, b) => {
    const savingsA = a.result.quote.discount_fils + Math.max(0, baseDelivery - a.result.quote.delivery_fee_fils)
    const savingsB = b.result.quote.discount_fils + Math.max(0, baseDelivery - b.result.quote.delivery_fee_fils)
    return savingsB - savingsA || b.offer.created_at.localeCompare(a.offer.created_at)
  })
  const best = qualified[0]
  return { success: true as const, offer: { slug: best.offer.slug, title: best.offer.title }, quote: best.result.quote }
}

export async function bannerOfferChoicesAction() {
  if (!await requireAdmin()) return []
  return (await listOffers()).filter(o => o.status === "published" && (!o.expires_at || new Date(o.expires_at) > new Date()))
    .map(o => ({ slug: o.slug, title: o.title }))
}

export async function matchOfferStyleCodesAction(formData: FormData) {
  if (!await requireAdmin()) return { success: false as const, error: "Admin access required." }
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) return { success: false as const, error: "Choose a CSV or Excel file first." }

  const fileName = file.name.toLowerCase()
  if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx")) {
    return { success: false as const, error: "Upload a CSV (.csv) or Excel (.xlsx) file." }
  }
  if (file.size > 5 * 1024 * 1024) return { success: false as const, error: "The file must be 5 MB or smaller." }

  try {
    const parsed = await readStyleCodeSheet(Buffer.from(await file.arrayBuffer()), file.name)
    if (parsed.error) return { success: false as const, error: parsed.error }
    return { success: true as const, ...await findPublishedProductsByStyleCodes(parsed.styleCodes) }
  } catch {
    return { success: false as const, error: "Style codes could not be matched to products. Please try again." }
  }
}
