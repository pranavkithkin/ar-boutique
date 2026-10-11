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
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xoqdwqkftmlffiugxuzy.supabase.co"
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_hhz1lQcw1rSrl7V7s6WkGA_njrOxzBH"

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
