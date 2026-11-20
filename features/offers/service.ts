import "server-only"
import { createAdminClient } from "@/lib/supabase/server"
import type { Offer, OfferChoice, OfferQuote, ProductOfferTag } from "./types"
import type { OfferInput } from "./schemas"
import { offerTagFor } from "./presentation"

export async function listOffers(): Promise<Offer[]> {
  const { data, error } = await createAdminClient().from("offers").select("*").order("created_at", { ascending: false })
  if (error) throw new Error("Offers could not be loaded. Check that the offers migration has been applied.")
  return data as Offer[]
}

export async function findPublicOffer(slug: string): Promise<Offer | null> {
  const { data, error } = await createAdminClient().from("offers").select("*").eq("slug", slug).neq("status", "draft").maybeSingle()
  if (error) throw new Error("Offers are temporarily unavailable.")
  return data as Offer | null
}

export async function offerChoices(): Promise<{ products: OfferChoice[]; categories: OfferChoice[] }> {
  const db = createAdminClient()
  const [products, categories] = await Promise.all([
    db.from("products").select("id,name").eq("status", "published").order("name").limit(1000),
    db.from("categories").select("id,name").order("name").limit(100),
  ])
  if (products.error || categories.error) throw new Error("Product choices could not be loaded.")
  return { products: products.data ?? [], categories: categories.data ?? [] }
}

export async function findPublishedProductsByStyleCodes(styleCodes: string[]) {
  const db = createAdminClient()
  const styleCodeProducts = new Map<string, Set<string>>()

  for (let start = 0; start < styleCodes.length; start += 100) {
    const batch = styleCodes.slice(start, start + 100)
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.from("product_colours").select("style_code,product_id")
        .eq("is_active", true).in("style_code", batch).range(offset, offset + 999)
      if (error) throw new Error("Style code matches could not be loaded.")
      for (const row of data ?? []) {
        const productIds = styleCodeProducts.get(row.style_code) ?? new Set<string>()
        productIds.add(row.product_id)
        styleCodeProducts.set(row.style_code, productIds)
      }
      if ((data?.length ?? 0) < 1000) break
    }
  }

  const productIds = [...new Set([...styleCodeProducts.values()].flatMap(ids => [...ids]))]
  const publishedProducts = new Map<string, OfferChoice>()
  for (let start = 0; start < productIds.length; start += 100) {
    const { data, error } = await db.from("products").select("id,name").eq("status", "published")
      .in("id", productIds.slice(start, start + 100))
    if (error) throw new Error("Matching products could not be loaded.")
    for (const product of data ?? []) publishedProducts.set(product.id, product)
  }

  const publishedProductIds = new Set(publishedProducts.keys())
  const matchedStyleCodeSet = new Set(styleCodes.filter(code => [...(styleCodeProducts.get(code) ?? [])].some(id => publishedProductIds.has(id))))
  const matchedProducts = [...publishedProducts.values()]
  const unmatchedStyleCodes = styleCodes.filter(code => !matchedStyleCodeSet.has(code))
  return {
    matchedProducts,
    matchedStyleCodeCount: matchedStyleCodeSet.size,
    unmatchedStyleCodeCount: unmatchedStyleCodes.length,
    unmatchedStyleCodeExamples: unmatchedStyleCodes.slice(0, 10),
  }
}

export async function getStorefrontOfferTags(productIds: string[]): Promise<Record<string, ProductOfferTag[]>> {
  const tags = Object.fromEntries(productIds.map(id => [id, [] as ProductOfferTag[]]))
  if (!productIds.length) return tags

  try {
    const db = createAdminClient()
    const now = new Date().toISOString()
    const [{ data: products, error: productsError }, { data: offers, error: offersError }] = await Promise.all([
      db.from("products").select("id,category_id").in("id", productIds),
      db.from("offers").select("slug,title,discount_type,discount_value,scope,product_ids,category_ids,starts_at,expires_at")
        .eq("status", "published")
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order("created_at", { ascending: false }),
    ])
    if (productsError || offersError) throw new Error("Active offers could not be loaded.")

    const categoryByProduct = new Map((products ?? []).map(product => [product.id, product.category_id]))
    for (const offer of offers ?? []) {
      const tag = offerTagFor(offer)
      for (const productId of productIds) {
        const matches = offer.scope === "all"
          || (offer.scope === "products" && offer.product_ids.includes(productId))
          || (offer.scope === "categories" && offer.category_ids.includes(categoryByProduct.get(productId) ?? ""))
        if (matches) tags[productId].push(tag)
      }
    }
  } catch (error) {
    console.error("Storefront offer tags could not be loaded:", error)
  }

  return tags
}

export async function saveOffer(id: string | null, values: OfferInput, actor: string) {
  const { data, error } = await createAdminClient().rpc("save_offer", { p_id: id, p_data: values, p_actor: actor })
  if (error) return { success: false as const, error: error.code === "23505" ? "This offer link is already in use." : "Offer could not be saved. Check its settings and try again." }
  return { success: true as const, id: String(data) }
}

export async function quoteOffer(slug: string, items: { variantId: string; quantity: number }[], email?: string) {
  const { data, error } = await createAdminClient().rpc("quote_offer", {
    p_slug: slug, p_items: items.map(i => ({ variant_id: i.variantId, quantity: i.quantity })), p_email: email || null,
  })
  if (error) return { success: false as const, error: error.code === "P0001" ? error.message : "Offer could not be checked. Please try again." }
  return { success: true as const, quote: data as OfferQuote }
}

export async function offerUsage(ids: string[]): Promise<Record<string, { reserved: number; redeemed: number }>> {
  if (!ids.length) return {}
  const { data, error } = await createAdminClient().rpc("get_offer_usage", { p_ids: ids })
  if (error) throw new Error("Offer usage could not be loaded.")
  const counts: Record<string, { reserved: number; redeemed: number }> = {}
  for (const row of (data ?? []) as { offer_id: string; reserved: number; redeemed: number }[]) {
    counts[row.offer_id] = { reserved: Number(row.reserved), redeemed: Number(row.redeemed) }
  }
  return counts
}

export async function offerAttention() {
  const { data, error } = await createAdminClient().from("orders").select("id,order_number,offer_payment_note")
    .not("offer_id", "is", null).not("offer_payment_note", "is", null).neq("payment_status", "refunded").limit(20)
  if (error) throw new Error("Offer checkout alerts could not be loaded.")
  return data ?? []
}
