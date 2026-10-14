"use server"

import { revalidatePath } from "next/cache"
import crypto from "crypto"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import {
  AdminProductListItem,
  AdminProductsPaginatedResult,
  AdminProductDetail,
  AdminCategory,
  AdminColour,
  AdminSize,
  ProductStatus,
} from "./types"
import { adminProductSchema, AdminProductFormValues } from "./schemas"
import { validateSku } from "@/lib/sku"

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"

function getCloudinaryUrl(mediaKey: string): string {
  if (mediaKey.startsWith("http://") || mediaKey.startsWith("https://")) {
    return mediaKey
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_600/${mediaKey}`
}

/**
 * Fetch all categories for filtering and select dropdowns.
 */
export async function getCategoriesList(): Promise<AdminCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("sort", { ascending: true })

  if (error) {
    console.error("Failed to fetch categories:", error)
    return []
  }

  return (data as AdminCategory[]) || []
}

/**
 * Fetch all colours.
 */
export async function getColoursList(): Promise<AdminColour[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("colours")
    .select("id, name, slug, swatch_hex")
    .order("sort", { ascending: true })

  if (error) {
    console.error("Failed to fetch colours:", error)
    return []
  }

  return (data as AdminColour[]) || []
}

/**
 * Fetch all sizes.
 */
export async function getSizesList(): Promise<AdminSize[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sizes")
    .select("id, label, sort")
    .order("sort", { ascending: true })

  if (error) {
    console.error("Failed to fetch sizes:", error)
    return []
  }

  return (data as AdminSize[]) || []
}

/**
 * Fetch products list for the Admin Data Table.
 * Implements database-level pagination (range query) and search to minimize network egress.
 */
export async function getAdminProductsList(options?: {
  search?: string
  status?: string
  categoryId?: string
  page?: number
  pageSize?: number
}): Promise<AdminProductsPaginatedResult> {
  const supabase = await createClient()
  const page = Math.max(1, options?.page || 1)
  const pageSize = options?.pageSize || 10

  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      status,
      is_final_sale,
      created_at,
      updated_at,
      category_id,
      categories:category_id (
        id,
        name
      ),
      product_colours (
        id,
        style_code,
        sort,
        is_active,
        product_images (
          id,
          media_key,
          sort
        )
      ),
      product_variants (
        id,
        sku,
        price_fils,
        is_active
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status)
  }

  if (options?.categoryId && options.categoryId !== "all") {
    query = query.eq("category_id", options.categoryId)
  }

  // Database-level search across product name, slug, style code, and SKU
  if (options?.search && options.search.trim()) {
    const q = options.search.trim()
    const [pRes, cRes, vRes] = await Promise.all([
      supabase.from("products").select("id").or(`name.ilike.%${q}%,slug.ilike.%${q}%`),
      supabase.from("product_colours").select("product_id").ilike("style_code", `%${q}%`),
      supabase.from("product_variants").select("product_id").ilike("sku", `%${q}%`),
    ])

    const ids = new Set<string>()
    pRes.data?.forEach((p) => ids.add(p.id))
    cRes.data?.forEach((c) => ids.add(c.product_id))
    vRes.data?.forEach((v) => ids.add(v.product_id))

    const matchedIds = Array.from(ids)
    if (matchedIds.length === 0) {
      return {
        products: [],
        total: 0,
        currentPage: page,
        pageSize,
        totalPages: 0,
      }
    }
    query = query.in("id", matchedIds)
  }

  // Database-level pagination: only fetch pageSize rows (10 by default) for the active page
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error("Failed to fetch admin products:", error)
    return {
      products: [],
      total: 0,
      currentPage: page,
      pageSize,
      totalPages: 0,
    }
  }

  const rawProducts = (data || []) as any[]
  const total = count ?? 0
  const totalPages = Math.ceil(total / pageSize)

  // Process rows into typed format
  const items: AdminProductListItem[] = rawProducts.map((p) => {
    const categoryName = p.categories?.name || null

    const variants = p.product_variants || []
    const prices = variants
      .map((v: any) => v.price_fils)
      .filter((price: number) => typeof price === "number")
    const minPrice = prices.length ? Math.min(...prices) : null
    const maxPrice = prices.length ? Math.max(...prices) : null

    // Extract style codes
    const colours = p.product_colours || []
    const styleCodes = Array.from(
      new Set(colours.map((c: any) => c.style_code).filter(Boolean))
    ) as string[]

    // Extract SKUs
    const skus = Array.from(
      new Set(variants.map((v: any) => v.sku).filter(Boolean))
    ) as string[]

    // Find first image
    let thumbnailUrl: string | null = null
    for (const c of colours) {
      const images = c.product_images || []
      const sortedImages = [...images].sort((a: any, b: any) => (a.sort || 0) - (b.sort || 0))
      if (sortedImages.length > 0 && sortedImages[0].media_key) {
        thumbnailUrl = getCloudinaryUrl(sortedImages[0].media_key)
        break
      }
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      category_id: p.category_id,
      category_name: categoryName,
      status: p.status as ProductStatus,
      is_final_sale: p.is_final_sale,
      created_at: p.created_at,
      updated_at: p.updated_at,
      min_price_fils: minPrice,
      max_price_fils: maxPrice,
      variant_count: variants.length,
      thumbnail_url: thumbnailUrl,
      style_codes: styleCodes,
      skus: skus,
    }
  })

  return {
    products: items,
    total,
    currentPage: page,
    pageSize,
    totalPages,
  }
}

/**
 * Fetch full product detail by ID for editing.
 */
export async function getAdminProductById(id: string): Promise<AdminProductDetail | null> {
  const supabase = createAdminClient()

  const { data: p, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      description,
      category_id,
      product_group,
      status,
      is_final_sale,
      seo_title,
      seo_description,
      published_at,
      created_at,
      updated_at,
      categories:category_id (
        id,
        name
      ),
      product_colours (
        id,
        colour_id,
        style_code,
        details,
        sort,
        is_active,
        colours:colour_id (
          id,
          name
        ),
        product_images (
          id,
          media_key,
          alt,
          sort
        ),
        product_variants (
          id,
          sku,
          size_id,
          price_fils,
          compare_at_fils,
          is_active,
          first_sold_at,
          sizes:size_id (
            id,
            label,
            sort
          ),
          stock_levels (
            on_hand,
            reserved
          )
        )
      )
    `)
    .eq("id", id)
    .single()

  if (error || !p) {
    console.error("Failed to fetch product by id:", error)
    return null
  }

  const raw = p as any
  const categoryName = raw.categories?.name || null

  const colourways = (raw.product_colours || []).map((c: any) => {
    const images = (c.product_images || [])
      .sort((a: any, b: any) => (a.sort || 0) - (b.sort || 0))
      .map((img: any) => ({
        id: img.id,
        media_key: img.media_key,
        alt: img.alt || "",
        sort: img.sort || 0,
        url: getCloudinaryUrl(img.media_key),
      }))

    const variants = (c.product_variants || [])
      .sort((a: any, b: any) => {
        const sortA = a.sizes?.sort ?? 999
        const sortB = b.sizes?.sort ?? 999
        if (sortA !== sortB) return sortA - sortB
        return (a.sku || "").localeCompare(b.sku || "")
      })
      .map((v: any) => ({
        id: v.id,
        sku: v.sku,
        size_id: v.size_id,
        size_label: v.sizes?.label || null,
        price_fils: v.price_fils,
        compare_at_fils: v.compare_at_fils,
        is_active: v.is_active,
        first_sold_at: v.first_sold_at,
        on_hand: v.stock_levels?.on_hand ?? 0,
        reserved: v.stock_levels?.reserved ?? 0,
      }))

    return {
      id: c.id,
      colour_id: c.colour_id,
      colour_name: c.colours?.name || "Unknown Colour",
      style_code: c.style_code,
      details: (c.details as Record<string, string>) || {},
      sort: c.sort || 0,
      is_active: c.is_active,
      images,
      variants,
    }
  })

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    category_id: raw.category_id,
    category_name: categoryName,
    product_group: raw.product_group,
    status: raw.status as ProductStatus,
    is_final_sale: raw.is_final_sale,
    seo_title: raw.seo_title,
    seo_description: raw.seo_description,
    published_at: raw.published_at,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    colourways,
  }
}

/**
 * Create a new product.
 */
export async function createAdminProduct(
  input: AdminProductFormValues
): Promise<{ success: boolean; productId?: string; error?: string }> {
  const parsed = adminProductSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    }
  }

  const supabase = await createClient()

  const payload: any = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    category_id: parsed.data.category_id || null,
    description: parsed.data.description || null,
    status: parsed.data.status,
    is_final_sale: parsed.data.is_final_sale,
    seo_title: parsed.data.seo_title || null,
    seo_description: parsed.data.seo_description || null,
    published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select("id")
    .single()

  if (error || !data) {
    console.error("Failed to create product:", error)
    return {
      success: false,
      error: error?.message || "Failed to create product",
    }
  }

  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true, productId: data.id }
}

/**
 * Update product core details.
 */
export async function updateAdminProduct(
  id: string,
  input: AdminProductFormValues
): Promise<{ success: boolean; error?: string }> {
  const parsed = adminProductSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    }
  }

  const supabase = await createClient()

  const payload: any = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    category_id: parsed.data.category_id || null,
    description: parsed.data.description || null,
    status: parsed.data.status,
    is_final_sale: parsed.data.is_final_sale,
    seo_title: parsed.data.seo_title || null,
    seo_description: parsed.data.seo_description || null,
    updated_at: new Date().toISOString(),
  }

  if (parsed.data.status === "published") {
    // Only set published_at if not already set
    const { data: current } = await supabase
      .from("products")
      .select("published_at")
      .eq("id", id)
      .single()

    if (!current?.published_at) {
      payload.published_at = new Date().toISOString()
    }
  }

  const { error } = await supabase.from("products").update(payload).eq("id", id)

  if (error) {
    console.error("Failed to update product:", error)
    return {
      success: false,
      error: error.message || "Failed to update product",
    }
  }

  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${id}`)
  revalidatePath("/collections")
  return { success: true }
}

/**
 * Update product status directly (e.g. quick toggle draft/published/archived).
 */
export async function toggleProductStatusAction(
  id: string,
  newStatus: ProductStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const payload: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }

  if (newStatus === "published") {
    payload.published_at = new Date().toISOString()
  }

  const { error } = await supabase.from("products").update(payload).eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true }
}

/**
 * Update an existing product variant SKU, size, prices, and active state.
 */
export async function updateVariantAction(input: {
  variantId: string
  productId: string
  sku: string
  sizeId: string | null
  priceFils: number
  compareAtFils: number | null
  isActive: boolean
}): Promise<{ success: boolean; error?: string }> {
  // Validate SKU strictly per ADR-025 / catalogue rules
  const skuValidation = validateSku(input.sku)
  if (!skuValidation.valid) {
    return { success: false, error: skuValidation.error }
  }

  const adminDb = createAdminClient()

  // Ensure SKU is unique across all variants (case-insensitive) except current
  const { data: existing } = await adminDb
    .from("product_variants")
    .select("id")
    .ilike("sku", input.sku)
    .neq("id", input.variantId)
    .maybeSingle()

  if (existing) {
    return {
      success: false,
      error: `SKU "${input.sku}" is already assigned to another variant.`,
    }
  }

  const { error } = await adminDb
    .from("product_variants")
    .update({
      sku: input.sku,
      size_id: input.sizeId || null,
      price_fils: input.priceFils,
      compare_at_fils: input.compareAtFils || null,
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.variantId)

  if (error) {
    console.error("Failed to update variant:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/products/${input.productId}`)
  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true }
}

/**
 * Adjust variant inventory stock on hand and write an inventory ledger adjustment.
 */
export async function adjustVariantStockAction(input: {
  variantId: string
  productId: string
  newOnHand: number
  reason: "restock" | "correction" | "opening stock" | "damaged" | "offline sale" | "return restock" | "COD refused"
  note?: string
}): Promise<{ success: boolean; error?: string; onHand?: number }> {
  if (input.newOnHand < 0) {
    return { success: false, error: "Stock on hand cannot be negative." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminDb = createAdminClient()

  const { data: currentLevel } = await adminDb
    .from("stock_levels")
    .select("on_hand, reserved")
    .eq("variant_id", input.variantId)
    .maybeSingle()

  const onHandBefore = currentLevel ? currentLevel.on_hand : 0
  const reserved = currentLevel ? currentLevel.reserved : 0

  if (input.newOnHand < reserved) {
    return {
      success: false,
      error: `Stock cannot fall below reserved quantity (${reserved} units currently reserved).`,
    }
  }

  const delta = input.newOnHand - onHandBefore

  // Upsert stock_levels
  const { error: upsertErr } = await adminDb
    .from("stock_levels")
    .upsert(
      {
        variant_id: input.variantId,
        on_hand: input.newOnHand,
        reserved,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "variant_id" }
    )

  if (upsertErr) {
    console.error("Failed to update stock_levels:", upsertErr)
    return { success: false, error: upsertErr.message }
  }

  // Record audit row in inventory_adjustments
  if (delta !== 0) {
    const { error: adjErr } = await adminDb.from("inventory_adjustments").insert({
      variant_id: input.variantId,
      delta,
      on_hand_before: onHandBefore,
      on_hand_after: input.newOnHand,
      reason: input.reason,
      note: input.note || null,
      actor_sub: user?.id || "f93c1910-4399-41d2-88ac-e8d0bd43f0e7",
    })

    if (adjErr) {
      console.error("Failed to insert inventory_adjustment:", adjErr)
    }
  }

  revalidatePath(`/admin/products/${input.productId}`)
  revalidatePath("/admin/products")
  revalidatePath("/admin/stock")
  return { success: true, onHand: input.newOnHand }
}

/**
 * Create a new variant under an existing colourway with initial stock.
 */
export async function createVariantAction(input: {
  productId: string
  productColourId: string
  sku: string
  sizeId: string | null
  priceFils: number
  compareAtFils: number | null
  initialStock: number
  isActive?: boolean
}): Promise<{ success: boolean; error?: string; variantId?: string }> {
  const skuValidation = validateSku(input.sku)
  if (!skuValidation.valid) {
    return { success: false, error: skuValidation.error }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminDb = createAdminClient()

  // Check duplicate SKU
  const { data: existing } = await adminDb
    .from("product_variants")
    .select("id")
    .ilike("sku", input.sku)
    .maybeSingle()

  if (existing) {
    return {
      success: false,
      error: `SKU "${input.sku}" already exists in the catalogue.`,
    }
  }

  // Insert product variant
  const { data: newVariant, error: vErr } = await adminDb
    .from("product_variants")
    .insert({
      product_id: input.productId,
      product_colour_id: input.productColourId,
      sku: input.sku,
      size_id: input.sizeId || null,
      price_fils: input.priceFils,
      compare_at_fils: input.compareAtFils || null,
      is_active: input.isActive ?? true,
    })
    .select("id")
    .single()

  if (vErr || !newVariant) {
    return { success: false, error: vErr?.message || "Failed to create variant." }
  }

  // Insert opening stock level
  const stockCount = Math.max(0, input.initialStock || 0)
  await adminDb.from("stock_levels").insert({
    variant_id: newVariant.id,
    on_hand: stockCount,
    reserved: 0,
    updated_at: new Date().toISOString(),
  })

  if (stockCount > 0) {
    await adminDb.from("inventory_adjustments").insert({
      variant_id: newVariant.id,
      delta: stockCount,
      on_hand_before: 0,
      on_hand_after: stockCount,
      reason: "opening stock",
      note: "Initial variant opening stock",
      actor_sub: user?.id || "f93c1910-4399-41d2-88ac-e8d0bd43f0e7",
    })
  }

  revalidatePath(`/admin/products/${input.productId}`)
  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true, variantId: newVariant.id }
}

/**
 * Delete or deactivate variant.
 * If first_sold_at is set, marks inactive (ADR-025). Otherwise deletes completely.
 */
export async function deleteVariantAction(input: {
  variantId: string
  productId: string
}): Promise<{ success: boolean; error?: string }> {
  const adminDb = createAdminClient()

  const { data: variant } = await adminDb
    .from("product_variants")
    .select("first_sold_at")
    .eq("id", input.variantId)
    .single()

  if (variant?.first_sold_at) {
    // Has purchase history -> deactivate only
    await adminDb
      .from("product_variants")
      .update({ is_active: false })
      .eq("id", input.variantId)
    revalidatePath(`/admin/products/${input.productId}`)
    return { success: true }
  }

  // Not sold yet -> safe to remove
  await adminDb.from("inventory_adjustments").delete().eq("variant_id", input.variantId)
  await adminDb.from("stock_levels").delete().eq("variant_id", input.variantId)
  const { error } = await adminDb.from("product_variants").delete().eq("id", input.variantId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/products/${input.productId}`)
  revalidatePath("/admin/products")
  return { success: true }
}

/**
 * Update colourway style code and details.
 */
export async function updateColourwayAction(input: {
  colourwayId: string
  productId: string
  styleCode: string
  details?: Record<string, string>
  isActive?: boolean
}): Promise<{ success: boolean; error?: string }> {
  if (!input.styleCode || input.styleCode.trim().length === 0) {
    return { success: false, error: "Style code is required." }
  }

  const adminDb = createAdminClient()

  const { error } = await adminDb
    .from("product_colours")
    .update({
      style_code: input.styleCode.trim(),
      details: input.details || {},
      is_active: input.isActive ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.colourwayId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/products/${input.productId}`)
  revalidatePath("/admin/products")
  return { success: true }
}

/**
 * Upload a product image to Cloudinary and attach to product_images table.
 */
export async function uploadProductImageAction(formData: FormData): Promise<{
  success: boolean
  error?: string
  image?: { id: string; media_key: string; url: string; alt: string; sort: number }
}> {
  const file = formData.get("file") as File | null
  const productId = formData.get("productId") as string | null
  const productColourId = formData.get("productColourId") as string | null
  const alt = (formData.get("alt") as string | null) || "Product view"

  if (!file || !productId || !productColourId) {
    return { success: false, error: "Missing required upload parameters." }
  }

  // Validate format and size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "Image file exceeds 10MB limit." }
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
  const folder = `${process.env.CLOUDINARY_FOLDER || "ar-dev"}/products/${productId}/${productColourId}`
  const apiKey = process.env.CLOUDINARY_API_KEY || "822299811143611"
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "EjPgkhLeSanX8bJ1N7VrlfaDeLU"

  const publicId = `img-${Date.now()}`
  const timestamp = Math.floor(Date.now() / 1000)
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex")

  try {
    const uploadForm = new FormData()
    uploadForm.append("file", file)
    uploadForm.append("api_key", apiKey)
    uploadForm.append("timestamp", timestamp.toString())
    uploadForm.append("folder", folder)
    uploadForm.append("public_id", publicId)
    uploadForm.append("signature", signature)

    const cRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: uploadForm,
    })

    const cData = await cRes.json()
    if (!cRes.ok || !cData.public_id) {
      console.error("Cloudinary upload error:", cData)
      return { success: false, error: cData.error?.message || "Failed to upload to Cloudinary." }
    }

    const adminDb = createAdminClient()

    // Determine next sort order
    const { data: existingImages } = await adminDb
      .from("product_images")
      .select("sort")
      .eq("product_colour_id", productColourId)
      .order("sort", { ascending: false })
      .limit(1)

    const nextSort = existingImages && existingImages.length > 0 ? (existingImages[0].sort || 0) + 1 : 0

    const { data: inserted, error: dbErr } = await adminDb
      .from("product_images")
      .insert({
        product_colour_id: productColourId,
        media_key: cData.public_id,
        alt: alt.trim() || "Product photo",
        sort: nextSort,
        width: cData.width || 640,
        height: cData.height || 960,
      })
      .select("id, media_key, alt, sort")
      .single()

    if (dbErr || !inserted) {
      console.error("Failed to insert into product_images:", dbErr)
      return { success: false, error: dbErr?.message || "Failed to save image record in database." }
    }

    revalidatePath(`/admin/products/${productId}`)
    revalidatePath("/admin/products")
    revalidatePath("/collections")

    return {
      success: true,
      image: {
        id: inserted.id,
        media_key: inserted.media_key,
        alt: inserted.alt,
        sort: inserted.sort,
        url: getCloudinaryUrl(inserted.media_key),
      },
    }
  } catch (err: any) {
    console.error("Image upload exception:", err)
    return { success: false, error: err.message || "Unexpected upload error." }
  }
}

/**
 * Remove a product image from database and Cloudinary.
 */
export async function deleteProductImageAction(input: {
  imageId: string
  mediaKey: string
  productId: string
}): Promise<{ success: boolean; error?: string }> {
  const adminDb = createAdminClient()

  // Delete from product_images table
  const { error: dbErr } = await adminDb
    .from("product_images")
    .delete()
    .eq("id", input.imageId)

  if (dbErr) {
    console.error("Failed to delete product_image record:", dbErr)
    return { success: false, error: dbErr.message }
  }

  // Delete from Cloudinary
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
  const apiKey = process.env.CLOUDINARY_API_KEY || "822299811143611"
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "EjPgkhLeSanX8bJ1N7VrlfaDeLU"

  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const delParams = `public_id=${input.mediaKey}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash("sha1").update(delParams).digest("hex")

    const delFormData = new FormData()
    delFormData.append("public_id", input.mediaKey)
    delFormData.append("api_key", apiKey)
    delFormData.append("timestamp", timestamp.toString())
    delFormData.append("signature", signature)

    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: delFormData,
    })
  } catch (cErr) {
    console.warn("Failed to delete asset from Cloudinary (ignored):", cErr)
  }

  revalidatePath(`/admin/products/${input.productId}`)
  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true }
}

/**
 * Set an existing garment image as the main (first) image of the colourway.
 */
export async function setMainProductImageAction(input: {
  imageId: string
  productColourId: string
  productId: string
}): Promise<{ success: boolean; error?: string }> {
  const adminDb = createAdminClient()

  // Fetch all images for this colourway ordered by existing sort
  const { data: allImages, error: fetchErr } = await adminDb
    .from("product_images")
    .select("id, sort")
    .eq("product_colour_id", input.productColourId)
    .order("sort", { ascending: true })

  if (fetchErr || !allImages) {
    console.error("Failed to fetch product_images for reordering:", fetchErr)
    return { success: false, error: fetchErr?.message || "Failed to load images." }
  }

  // Put target imageId at index 0, followed by the remaining images in existing order
  const target = allImages.find((img) => img.id === input.imageId)
  if (!target) {
    return { success: false, error: "Image not found." }
  }

  const remaining = allImages.filter((img) => img.id !== input.imageId)
  const reordered = [target, ...remaining]

  // Update sort index for each image
  for (let idx = 0; idx < reordered.length; idx++) {
    const item = reordered[idx]
    if (item.sort !== idx) {
      const { error: updateErr } = await adminDb
        .from("product_images")
        .update({ sort: idx })
        .eq("id", item.id)

      if (updateErr) {
        console.error("Failed to update sort order for image:", item.id, updateErr)
      }
    }
  }

  revalidatePath(`/admin/products/${input.productId}`)
  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true }
}
