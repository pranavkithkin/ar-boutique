import "server-only"
import { createAdminClient } from "@/lib/supabase/server"
import { formatAED } from "@/lib/money"

export interface ProductVariantSize {
  id: string
  name: string
  sku: string
  priceFils: number
  compareAtFils?: number | null
  status: "in_stock" | "low" | "sold_out"
  unitsLeft: number | null // Only set when status === "low" (1, 2, or 3)
  isAvailable: boolean
  sort: number
  stock?: number
}

export interface ProductColourway {
  id: string
  colourName: string
  colourSlug: string
  swatchHex: string | null
  styleCode: string
  details: Record<string, string>
  images: string[]
  sizes: ProductVariantSize[]
  isSoldOut: boolean
}

export interface ProductDetail {
  id: string
  name: string
  slug: string
  brand: string
  categoryName?: string
  description: string
  colourways: ProductColourway[]
  // Defaults from the active/primary colourway for backwards compatibility
  sku: string
  colour: string
  price: string
  compareAtPrice?: string
  details: Record<string, string>
  images: string[]
  sizes: ProductVariantSize[]
}

export async function getProductBySlug(
  slug: string,
  preferredColour?: string
): Promise<ProductDetail | null> {
  try {
    const supabase = createAdminClient()
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"

    const { data: item, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        categories:category_id ( name, slug ),
        product_colours (
          id,
          style_code,
          details,
          colours:colour_id ( id, name, slug, swatch_hex ),
          product_images ( media_key, sort ),
          product_variants (
            id,
            sku,
            price_fils,
            compare_at_fils,
            is_active,
            sizes:size_id ( id, label, sort ),
            stock_levels ( on_hand, reserved )
          )
        )
      `)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()

    if (error || !item) {
      if (error) console.error("[ProductDetail] Error fetching product:", slug, error)
      return null
    }

interface DbProductImage {
  media_key?: string
  sort?: number
}

interface DbProductVariant {
  id: string
  sku: string
  price_fils: number
  compare_at_fils?: number | null
  is_active: boolean
  sizes?: { id: string; label: string; sort?: number } | null
  stock_levels?: { on_hand: number; reserved: number } | null
}

interface DbProductColour {
  id: string
  style_code?: string | null
  details?: Record<string, string> | null
  colours?: { id: string; name: string; slug?: string; swatch_hex?: string | null } | null
  product_images?: DbProductImage[] | null
  product_variants?: DbProductVariant[] | null
}

    const rawColourways = (item.product_colours || []) as unknown as DbProductColour[]
    if (rawColourways.length === 0) {
      return null
    }

    // Process every colourway
    const colourways: ProductColourway[] = rawColourways.map((cw) => {
      const colourName = cw.colours?.name || "Standard"
      const colourSlug =
        cw.colours?.slug ||
        colourName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      const swatchHex = cw.colours?.swatch_hex || null
      const styleCode = cw.style_code || ""
      const details = (cw.details || {}) as Record<string, string>

      // Process and sort images
      const sortedImages = (cw.product_images || []).slice().sort(
        (a, b) => (a.sort ?? 0) - (b.sort ?? 0)
      )
      const images: string[] = sortedImages.map((img) => {
        if (!img.media_key) return "/images/placeholder.jpg"
        if (img.media_key.startsWith("http")) return img.media_key
        return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_1200/${img.media_key}`
      })

      // Process and sort active variants / sizes
      const activeVariants = (cw.product_variants || []).filter((v) => v.is_active)
      const sizes: ProductVariantSize[] = activeVariants
        .map((v) => {
          const onHand = v.stock_levels?.on_hand ?? 0
          const reserved = v.stock_levels?.reserved ?? 0
          const available = Math.max(0, onHand - reserved)

          // ADR-026 & docs/RULES.md: Never leak raw counts. Only 3 or fewer is shown.
          let status: "in_stock" | "low" | "sold_out" = "in_stock"
          let unitsLeft: number | null = null

          if (available <= 0) {
            status = "sold_out"
          } else if (available <= 3) {
            status = "low"
            unitsLeft = available
          }

          return {
            id: v.id,
            name: v.sizes?.label || "One Size",
            sku: v.sku,
            priceFils: v.price_fils || 9000,
            compareAtFils: v.compare_at_fils || null,
            status,
            unitsLeft,
            isAvailable: status !== "sold_out",
            sort: v.sizes?.sort ?? 0,
          }
        })
        .sort((a: ProductVariantSize, b: ProductVariantSize) => a.sort - b.sort)

      const isSoldOut = sizes.length > 0 && sizes.every((s) => !s.isAvailable)

      return {
        id: cw.id,
        colourName,
        colourSlug,
        swatchHex,
        styleCode,
        details,
        images: images.length > 0 ? images : ["/images/placeholder.jpg"],
        sizes,
        isSoldOut,
      }
    })

    // Determine initial/active colourway
    let activeColourway = colourways[0]
    if (preferredColour) {
      const match = colourways.find(
        (cw) =>
          cw.colourSlug.toLowerCase() === preferredColour.toLowerCase() ||
          cw.colourName.toLowerCase() === preferredColour.toLowerCase()
      )
      if (match) {
        activeColourway = match
      }
    }

    // Compute pricing details for active colourway
    const activeVariants = activeColourway.sizes
    const lowestPriceFils =
      activeVariants.length > 0
        ? Math.min(...activeVariants.map((v) => v.priceFils))
        : 9000

    const compareAtFils = activeVariants[0]?.compareAtFils
    const compareAtPrice =
      compareAtFils && compareAtFils > lowestPriceFils
        ? formatAED(compareAtFils)
        : undefined

    const primarySku = activeVariants[0]?.sku || activeColourway.styleCode || ""

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      brand: "AR Boutique Atelier",
      categoryName: (item.categories as { name?: string } | null)?.name || "Couture",
      description: item.description || "",
      colourways,
      // Default to active colourway fields
      sku: primarySku,
      colour: activeColourway.colourName,
      price: formatAED(lowestPriceFils),
      compareAtPrice,
      details: activeColourway.details,
      images: activeColourway.images,
      sizes: activeColourway.sizes,
    }
  } catch (err) {
    console.error("[ProductDetail] Unexpected error fetching product:", slug, err)
    return null
  }
}
