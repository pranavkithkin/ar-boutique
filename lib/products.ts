export interface ProductVariantSize {
  id: string
  name: string
  sku: string
  priceFils: number
  stock?: number
}

export interface ProductListItem {
  id: string
  name: string
  slug: string
  brand: string
  category: string
  price: string
  compareAtPrice?: string
  mediaKey: string
  imageSrc: string
  sizes?: ProductVariantSize[]
}

export interface ProductsPageResult {
  products: ProductListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductsQueryOptions {
  page?: number
  limit?: number
  categorySlug?: string
  size?: string
  fabric?: string
  pattern?: string
  minPrice?: number
  maxPrice?: number
  sort?: "newest" | "price-asc" | "price-desc"
}

export async function getProductsPage({
  page = 1,
  limit = 12,
  categorySlug,
  size,
  fabric,
  pattern,
  minPrice,
  maxPrice,
  sort = "newest",
}: ProductsQueryOptions = {}): Promise<ProductsPageResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

  const safePage = Math.max(1, page)
  const safeLimit = Math.min(24, Math.max(1, limit))

  const minPriceFils =
    typeof minPrice === "number" && minPrice > 80 ? minPrice * 100 : null
  const maxPriceFils =
    typeof maxPrice === "number" && maxPrice < 160 ? maxPrice * 100 : null

  // 100% Database-Level Pagination & Multi-Facet Filtering via Postgres RPC
  const url = `${supabaseUrl}/rest/v1/rpc/get_catalog_products`

  const payload = {
    p_page: safePage,
    p_limit: safeLimit,
    p_category: categorySlug || null,
    p_size: size || null,
    p_fabric: fabric || null,
    p_pattern: pattern || null,
    p_min_price_fils: minPriceFils,
    p_max_price_fils: maxPriceFils,
    p_sort: sort || "newest",
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    console.error("Failed to fetch products from get_catalog_products:", await response.text())
    return {
      products: [],
      total: 0,
      page: safePage,
      limit: safeLimit,
      totalPages: 1,
    }
  }

  const data: Array<{
    id: string
    name: string
    slug: string
    category_name: string
    category_slug: string
    price_fils: number
    primary_media_key: string
    total_count: number
  }> = await response.json()

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"

  const total = data.length > 0 ? Number(data[0].total_count) : 0
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))

  const productIds = data.map((item) => item.id)
  let variantsMap: Record<string, ProductVariantSize[]> = {}

  if (productIds.length > 0) {
    try {
      const variantsUrl = `${supabaseUrl}/rest/v1/products?select=id,product_variants(id,sku,price_fils,is_active,sizes(id,label))&id=in.(${productIds.join(",")})`
      const vRes = await fetch(variantsUrl, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 60 },
      })
      if (vRes.ok) {
        const vData: Array<{
          id: string
          product_variants: Array<{
            id: string
            sku: string
            price_fils: number
            is_active: boolean
            sizes: { id: string; label: string } | null
          }>
        }> = await vRes.json()

        for (const row of vData) {
          const activeVariants = (row.product_variants || []).filter((v) => v.is_active)
          variantsMap[row.id] = activeVariants.map((v) => ({
            id: v.id,
            name: v.sizes?.label || "One Size",
            sku: v.sku,
            priceFils: v.price_fils,
            stock: 5,
          }))
        }
      }
    } catch (err) {
      console.error("Error fetching variant details in getProductsPage:", err)
    }
  }

  const products: ProductListItem[] = data.map((item) => {
    const primaryMediaKey = item.primary_media_key || ""
    const imageSrc = primaryMediaKey
      ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_800/${primaryMediaKey}`
      : "/images/placeholder.jpg"

    const priceAed = (item.price_fils / 100).toFixed(2)

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      brand: "AR Boutique Exclusive",
      category: item.category_name || "Boutique",
      price: `AED ${priceAed}`,
      mediaKey: primaryMediaKey,
      imageSrc,
      sizes: variantsMap[item.id] || [],
    }
  })

  return {
    products,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
  }
}
