"use server"

import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import {
  AdminCategoryItem,
  CreateCategoryResponse,
  UpdateCategoryResponse,
  DeleteCategoryResponse,
} from "./types"

function getCloudinaryUrl(mediaKey?: string | null): string | null {
  if (!mediaKey) return null
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_600/${mediaKey}`
}

import { slugify, isValidCategorySlug } from "./utils"

/**
 * Upload a category photo directly to Cloudinary
 */
async function uploadToCloudinary(file: File, categoryId: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
  const folder = `${process.env.CLOUDINARY_FOLDER || "ar-dev"}/categories/${categoryId}`
  const apiKey = process.env.CLOUDINARY_API_KEY || "822299811143611"
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "EjPgkhLeSanX8bJ1N7VrlfaDeLU"

  const publicId = `cat-${Date.now()}`
  const timestamp = Math.floor(Date.now() / 1000)
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex")

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
    console.error("Cloudinary category upload error:", cData)
    throw new Error(cData.error?.message || "Failed to upload photo to Cloudinary.")
  }

  return cData.public_id
}

/**
 * Delete a media asset from Cloudinary
 */
async function deleteFromCloudinary(mediaKey: string): Promise<void> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
  const apiKey = process.env.CLOUDINARY_API_KEY || "822299811143611"
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "EjPgkhLeSanX8bJ1N7VrlfaDeLU"

  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const delParams = `public_id=${mediaKey}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash("sha1").update(delParams).digest("hex")

    const delFormData = new FormData()
    delFormData.append("public_id", mediaKey)
    delFormData.append("api_key", apiKey)
    delFormData.append("timestamp", timestamp.toString())
    delFormData.append("signature", signature)

    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: delFormData,
    })
  } catch (err) {
    console.error("Failed to delete Cloudinary asset:", err)
  }
}

/**
 * Fetch all categories with product counts and Cloudinary image URLs
 */
export async function getAdminCategoriesList(): Promise<AdminCategoryItem[]> {
  const supabase = createAdminClient()

  const [categoriesRes, productsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .order("sort", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("products").select("category_id"),
  ])

  if (categoriesRes.error) {
    console.error("Error fetching categories:", categoriesRes.error)
    return []
  }

  // Count products assigned to each category
  const productCounts = new Map<string, number>()
  if (productsRes.data) {
    for (const p of productsRes.data) {
      if (p.category_id) {
        productCounts.set(p.category_id, (productCounts.get(p.category_id) || 0) + 1)
      }
    }
  }

  return (categoriesRes.data || []).map((cat) => ({
    id: cat.id as string,
    name: cat.name as string,
    slug: cat.slug as string,
    description: (cat.description as string | null) || null,
    image_key: (cat.image_key as string | null) || null,
    image_url: getCloudinaryUrl(cat.image_key as string | null),
    sort: (cat.sort as number) ?? 0,
    is_active: (cat.is_active as boolean) ?? true,
    seo_title: (cat.seo_title as string | null) || null,
    seo_description: (cat.seo_description as string | null) || null,
    product_count: productCounts.get(cat.id) || 0,
    created_at: cat.created_at as string,
    updated_at: cat.updated_at as string,
  }))
}

/**
 * Create a new category
 */
export async function createCategoryAction(formData: FormData): Promise<CreateCategoryResponse> {
  const name = (formData.get("name") as string | null)?.trim()
  let slug = (formData.get("slug") as string | null)?.trim()
  const description = (formData.get("description") as string | null)?.trim() || null
  const sortRaw = formData.get("sort") as string | null
  const isActiveRaw = formData.get("is_active") as string | null
  const seoTitle = (formData.get("seo_title") as string | null)?.trim() || null
  const seoDescription = (formData.get("seo_description") as string | null)?.trim() || null
  const imageFile = formData.get("file") as File | null

  if (!name) {
    return { success: false, error: "Category name is required." }
  }

  // Generate slug if empty
  if (!slug) {
    slug = slugify(name)
  } else {
    slug = slugify(slug)
  }

  if (!isValidCategorySlug(slug)) {
    return {
      success: false,
      error: "Slug must contain only lowercase letters, numbers, and hyphens (e.g. 'co-ord-set').",
    }
  }

  const adminDb = createAdminClient()

  // Check unique slug
  const { data: existingSlug } = await adminDb
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()

  if (existingSlug) {
    return {
      success: false,
      error: `The slug "${slug}" is already in use by another category. Please choose a different slug.`,
    }
  }

  // Determine sort index
  let sort = 1
  if (sortRaw !== null && sortRaw !== "") {
    sort = parseInt(sortRaw, 10) || 1
  } else {
    const { data: maxSortCat } = await adminDb
      .from("categories")
      .select("sort")
      .order("sort", { ascending: false })
      .limit(1)
      .maybeSingle()
    sort = maxSortCat ? (maxSortCat.sort || 0) + 1 : 1
  }

  const categoryId = crypto.randomUUID()
  let imageKey: string | null = null

  // Handle image upload if provided
  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 10 * 1024 * 1024) {
      return { success: false, error: "Image file exceeds 10MB limit." }
    }
    try {
      imageKey = await uploadToCloudinary(imageFile, categoryId)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload category image."
      return { success: false, error: msg }
    }
  }

  const is_active = isActiveRaw === "false" ? false : true

  const { data: inserted, error: insertError } = await adminDb
    .from("categories")
    .insert({
      id: categoryId,
      name,
      slug,
      description,
      image_key: imageKey,
      sort,
      is_active,
      seo_title: seoTitle,
      seo_description: seoDescription,
    })
    .select("*")
    .single()

  if (insertError || !inserted) {
    console.error("Failed to insert category:", insertError)
    if (imageKey) {
      await deleteFromCloudinary(imageKey)
    }
    return { success: false, error: insertError?.message || "Failed to create category." }
  }

  revalidateCategoryPaths()

  return {
    success: true,
    category: {
      id: inserted.id,
      name: inserted.name,
      slug: inserted.slug,
      description: inserted.description,
      image_key: inserted.image_key,
      image_url: getCloudinaryUrl(inserted.image_key),
      sort: inserted.sort,
      is_active: inserted.is_active,
      seo_title: inserted.seo_title,
      seo_description: inserted.seo_description,
      product_count: 0,
      created_at: inserted.created_at,
      updated_at: inserted.updated_at,
    },
  }
}

/**
 * Update an existing category
 */
export async function updateCategoryAction(formData: FormData): Promise<UpdateCategoryResponse> {
  const id = formData.get("id") as string | null
  const name = (formData.get("name") as string | null)?.trim()
  let slug = (formData.get("slug") as string | null)?.trim()
  const description = (formData.get("description") as string | null)?.trim() || null
  const sortRaw = formData.get("sort") as string | null
  const isActiveRaw = formData.get("is_active") as string | null
  const seoTitle = (formData.get("seo_title") as string | null)?.trim() || null
  const seoDescription = (formData.get("seo_description") as string | null)?.trim() || null
  const removeImage = formData.get("remove_image") === "true"
  const imageFile = formData.get("file") as File | null

  if (!id) {
    return { success: false, error: "Category ID is missing." }
  }

  if (!name) {
    return { success: false, error: "Category name cannot be empty." }
  }

  if (!slug) {
    slug = slugify(name)
  } else {
    slug = slugify(slug)
  }

  if (!isValidCategorySlug(slug)) {
    return {
      success: false,
      error: "Slug must contain only lowercase letters, numbers, and hyphens (e.g. 'co-ord-set').",
    }
  }

  const adminDb = createAdminClient()

  // Check unique slug on other categories
  const { data: existingSlug } = await adminDb
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle()

  if (existingSlug) {
    return {
      success: false,
      error: `The slug "${slug}" is already in use by another category.`,
    }
  }

  // Get current category data to check existing image
  const { data: currentCat, error: fetchErr } = await adminDb
    .from("categories")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchErr || !currentCat) {
    return { success: false, error: "Category not found." }
  }

  let finalImageKey: string | null = currentCat.image_key

  // Handle remove image
  if (removeImage && currentCat.image_key) {
    await deleteFromCloudinary(currentCat.image_key)
    finalImageKey = null
  }

  // Handle new image upload
  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 10 * 1024 * 1024) {
      return { success: false, error: "Image file exceeds 10MB limit." }
    }
    try {
      const newKey = await uploadToCloudinary(imageFile, id)
      // Delete old key if replacing
      if (currentCat.image_key && currentCat.image_key !== newKey) {
        await deleteFromCloudinary(currentCat.image_key)
      }
      finalImageKey = newKey
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload new category image."
      return { success: false, error: msg }
    }
  }

  const sort = sortRaw !== null && sortRaw !== "" ? parseInt(sortRaw, 10) || 0 : currentCat.sort
  const is_active = isActiveRaw !== null ? isActiveRaw === "true" : currentCat.is_active

  const { data: updated, error: updateErr } = await adminDb
    .from("categories")
    .update({
      name,
      slug,
      description,
      image_key: finalImageKey,
      sort,
      is_active,
      seo_title: seoTitle,
      seo_description: seoDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single()

  if (updateErr || !updated) {
    console.error("Failed to update category:", updateErr)
    return { success: false, error: updateErr?.message || "Failed to update category." }
  }

  revalidateCategoryPaths()

  return {
    success: true,
    category: {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      image_key: updated.image_key,
      image_url: getCloudinaryUrl(updated.image_key),
      sort: updated.sort,
      is_active: updated.is_active,
      seo_title: updated.seo_title,
      seo_description: updated.seo_description,
      product_count: 0,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    },
  }
}

/**
 * Fast toggle of active / visibility state
 */
export async function toggleCategoryActiveAction(
  id: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  const adminDb = createAdminClient()

  const { error } = await adminDb
    .from("categories")
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("Failed to toggle category active status:", error)
    return { success: false, error: error.message }
  }

  revalidateCategoryPaths()
  return { success: true }
}

/**
 * Reorder categories by updating sort indices
 */
export async function reorderCategoriesAction(
  items: { id: string; sort: number }[]
): Promise<{ success: boolean; error?: string }> {
  const adminDb = createAdminClient()

  try {
    for (const item of items) {
      await adminDb
        .from("categories")
        .update({ sort: item.sort, updated_at: new Date().toISOString() })
        .eq("id", item.id)
    }

    revalidateCategoryPaths()
    return { success: true }
  } catch (err: unknown) {
    console.error("Failed to reorder categories:", err)
    const msg = err instanceof Error ? err.message : "Failed to reorder categories."
    return { success: false, error: msg }
  }
}

/**
 * Delete a category with guard: Block delete while products exist (TASK-030)
 */
export async function deleteCategoryAction(id: string): Promise<DeleteCategoryResponse> {
  const adminDb = createAdminClient()

  // 1. Fetch category name and image
  const { data: category, error: catErr } = await adminDb
    .from("categories")
    .select("id, name, image_key")
    .eq("id", id)
    .single()

  if (catErr || !category) {
    return { success: false, error: "Category not found." }
  }

  // 2. Guard: Check if any products are assigned to this category
  const { count, error: countErr } = await adminDb
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)

  if (countErr) {
    console.error("Failed to check assigned products:", countErr)
    return { success: false, error: "Failed to verify category product dependencies." }
  }

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete "${category.name}". There are currently ${count} product(s) assigned to this category. Please reassign or delete these products first.`,
      assignedCount: count,
    }
  }

  // 3. Clean up Cloudinary asset if present
  if (category.image_key) {
    await deleteFromCloudinary(category.image_key)
  }

  // 4. Delete the category record
  const { error: deleteErr } = await adminDb.from("categories").delete().eq("id", id)

  if (deleteErr) {
    console.error("Failed to delete category record:", deleteErr)
    return { success: false, error: deleteErr.message || "Failed to delete category." }
  }

  revalidateCategoryPaths()
  return { success: true }
}

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories")
  revalidatePath("/admin/products")
  revalidatePath("/admin/products/new")
  revalidatePath("/admin/stock")
  revalidatePath("/shop")
  revalidatePath("/collections")
  revalidatePath("/")
}
