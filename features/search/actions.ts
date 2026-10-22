"use server"

import { formatAED } from "@/lib/money"
import type { SearchResultItem, SearchProductsResponse } from "./types"

interface RawProductData {
  id: string
  name: string
  slug: string
  description?: string
  categories: { name: string; slug: string } | null
  product_colours: Array<{
    id: string
    style_code?: string
    details?: Record<string, string>
    colours: { name: string } | null
    product_images: Array<{ media_key: string; sort?: number }>
    product_variants: Array<{ id: string; price_fils: number; is_active: boolean }>
  }>
}

/**
 * Searches published boutique products across names, categories, style codes, and colours.
 */
export async function searchProductsAction(query: string): Promise<SearchProductsResponse> {
  const sanitizedQuery = (query || "").trim()

  if (!sanitizedQuery || sanitizedQuery.length < 1) {
    return { success: true, data: [], query: sanitizedQuery }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, data: [], query: sanitizedQuery, error: "Database configuration missing" }
  }

  try {
    const queryParams = new URLSearchParams()
    queryParams.set(
      "select",
      "id,name,slug,description,categories(name,slug),product_colours(id,style_code,details,colours(name),product_images(media_key,sort),product_variants(id,price_fils,is_active))"
    )
    queryParams.set("status", "eq.published")

    const url = `${supabaseUrl}/rest/v1/products?${queryParams.toString()}`

    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      console.error("Search query failed:", await res.text())
      return { success: false, data: [], query: sanitizedQuery, error: "Failed to query catalogue" }
    }

    const products: RawProductData[] = await res.json()
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
    const lowerQuery = sanitizedQuery.toLowerCase()

    const results: Array<{ item: SearchResultItem; score: number }> = []

    for (const product of products) {
      let matched = false
      let score = 0

      const productName = product.name || ""
      const lowerName = productName.toLowerCase()
      const categoryName = product.categories?.name || ""
      const lowerCategory = categoryName.toLowerCase()

      // Primary colourway and variants
      const activeColourways = product.product_colours || []
      const primaryColourway = activeColourways[0]
      const styleCode = primaryColourway?.style_code || ""
      const lowerStyle = styleCode.toLowerCase()
      const colourName = primaryColourway?.colours?.name || ""
      const lowerColour = colourName.toLowerCase()

      // Exact name match
      if (lowerName === lowerQuery) {
        score += 100
        matched = true
      } else if (lowerName.startsWith(lowerQuery)) {
        score += 70
        matched = true
      } else if (lowerName.includes(lowerQuery)) {
        score += 50
        matched = true
      }

      // Style code match (e.g. "J0478")
      if (lowerStyle && lowerStyle.includes(lowerQuery)) {
        score += 60
        matched = true
      }

      // Check all colourways if primary didn't match style code
      for (const cw of activeColourways) {
        if (cw.style_code && cw.style_code.toLowerCase().includes(lowerQuery)) {
          score += 45
          matched = true
          break
        }
        if (cw.colours?.name && cw.colours.name.toLowerCase().includes(lowerQuery)) {
          score += 35
          matched = true
          break
        }
      }

      // Category match (e.g. "Set", "Kurta", "Dress")
      if (lowerCategory && lowerCategory.includes(lowerQuery)) {
        score += 40
        matched = true
      }

      // Colour name match on primary
      if (lowerColour && lowerColour.includes(lowerQuery)) {
        score += 30
        matched = true
      }

      if (matched) {
        // Find best media key
        const sortedImages = (primaryColourway?.product_images || []).sort(
          (a, b) => (a.sort ?? 0) - (b.sort ?? 0)
        )
        const mediaKey = sortedImages[0]?.media_key || ""
        const imageSrc = mediaKey
          ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_fill,w_300,ar_2:3/${mediaKey}`
          : "/images/placeholder-garment.png"

        // Active variants and lowest price
        const activeVariants = (primaryColourway?.product_variants || []).filter((v) => v.is_active)
        const priceFils = activeVariants.length > 0
          ? Math.min(...activeVariants.map((v) => v.price_fils))
          : 0

        results.push({
          score,
          item: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            categoryName: categoryName || "Piece",
            styleCode: styleCode || undefined,
            colourName: colourName || undefined,
            priceFils,
            formattedPrice: priceFils > 0 ? formatAED(priceFils) : "Inquire",
            mediaKey,
            imageSrc,
            href: `/collections/${product.slug}`,
          },
        })
      }
    }

    // Sort descending by match score, limit to top 8 items
    results.sort((a, b) => b.score - a.score)
    const topResults = results.slice(0, 8).map((r) => r.item)

    return {
      success: true,
      data: topResults,
      query: sanitizedQuery,
    }
  } catch (err: unknown) {
    console.error("searchProductsAction unexpected error:", err)
    return {
      success: false,
      data: [],
      query: sanitizedQuery,
      error: "An unexpected error occurred while searching",
    }
  }
}
