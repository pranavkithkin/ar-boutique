export interface ProductDetail {
  id: string
  name: string
  slug: string
  brand: string
  sku: string
  colour?: string
  price: string
  compareAtPrice?: string
  description?: string
  details: Record<string, string>
  images: string[]
  sizes: Array<{ id: string; name: string; sku: string }>
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xoqdwqkftmlffiugxuzy.supabase.co"
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_hhz1lQcw1rSrl7V7s6WkGA_njrOxzBH"

  const queryParams = new URLSearchParams()
  queryParams.set(
    "select",
    "id,name,slug,description,category_id,categories(name,slug),product_colours(id,style_code,details,colours(name),product_images(media_key,sort),product_variants(id,sku,price_fils,is_active,sizes(id,label)))"
  )
  queryParams.set("slug", `eq.${slug}`)
  queryParams.set("status", "eq.published")

  const url = `${supabaseUrl}/rest/v1/products?${queryParams.toString()}`

  const response = await fetch(url, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  if (!data || data.length === 0) {
    return null
  }

  const item = data[0]
  const colourway = item.product_colours?.[0]
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"

  // Sorted image URLs from Cloudinary
  const sortedImages = (colourway?.product_images || []).sort(
    (a: any, b: any) => a.sort - b.sort
  )
  const images = sortedImages.map((img: any) =>
    `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_1200/${img.media_key}`
  )

  // Active variants
  const variants = (colourway?.product_variants || []).filter((v: any) => v.is_active)
  const lowestPriceFils =
    variants.length > 0
      ? Math.min(...variants.map((v: any) => v.price_fils))
      : 9000
  const priceAed = (lowestPriceFils / 100).toFixed(2)

  const sizes = variants.map((v: any) => ({
    id: v.id,
    name: v.sizes?.label || "One Size",
    sku: v.sku,
  }))

  const primarySku = variants[0]?.sku || colourway?.style_code || ""
  const colourName = colourway?.colours?.name || ""

  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    brand: "AR Boutique Exclusive",
    sku: primarySku,
    colour: colourName,
    price: `AED ${priceAed}`,
    description: item.description || "",
    details: colourway?.details || {},
    images: images.length > 0 ? images : ["/images/placeholder.jpg"],
    sizes,
  }
}
