import "server-only"
import { createAdminClient } from "@/lib/supabase/server"
import type { Offer } from "./types"

interface CatalogueRow {
  id: string; name: string; slug: string
  product_variants: { price_fils: number; is_active: boolean; product_colours: { is_active: boolean } | { is_active: boolean }[] | null }[]
  product_colours: { is_active: boolean; product_images: { media_key: string; sort: number }[] }[]
}

export async function offerProducts(offer: Offer, page: number) {
  const db = createAdminClient()
  let query = db.from("products").select("id,name,slug,product_variants(price_fils,is_active,product_colours(is_active)),product_colours(is_active,product_images(media_key,sort))", { count: "exact" }).eq("status", "published")
  if (offer.scope === "products") query = query.in("id", offer.product_ids)
  if (offer.scope === "categories") query = query.in("category_id", offer.category_ids)
  const { data, error, count } = await query.order("created_at", { ascending: false }).range((page - 1) * 12, page * 12 - 1).returns<CatalogueRow[]>()
  if (error) throw new Error("Offer products could not be loaded.")
  return { products: (data ?? []).flatMap(product => {
    const variants = product.product_variants.filter(v => v.is_active && (Array.isArray(v.product_colours) ? v.product_colours.some(c => c.is_active) : v.product_colours?.is_active))
    if (!variants.length) return []
    const prices = variants.map(v => v.price_fils)
    const images = product.product_colours.filter(c => c.is_active).flatMap(c => c.product_images).sort((a, b) => a.sort - b.sort)
    return [{ id: product.id, name: product.name, slug: product.slug, priceFils: Math.min(...prices), variablePrice: new Set(prices).size > 1, mediaKey: images[0]?.media_key ?? null }]
  }), total: count ?? 0 }
}
