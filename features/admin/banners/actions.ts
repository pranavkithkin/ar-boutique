"use server"

import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { AdminBannerItem, BannerMutationResponse, BannerPlacement } from "./types"

function getCloudinaryUrl(mediaKey?: string | null, width = 1600): string | null {
  if (!mediaKey) return null
  if (
    mediaKey.startsWith("http://") ||
    mediaKey.startsWith("https://") ||
    mediaKey.startsWith("/")
  ) {
    return mediaKey
  }
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_${width}/${mediaKey}`
}

/**
 * Upload a desktop or mobile banner asset directly to Cloudinary
 */
async function uploadBannerPhotoToCloudinary(
  file: File,
  bannerId: string,
  type: "desktop" | "mobile"
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
  const folder = `${process.env.CLOUDINARY_FOLDER || "ar-dev"}/banners/${bannerId}`
  const apiKey = process.env.CLOUDINARY_API_KEY || "822299811143611"
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "EjPgkhLeSanX8bJ1N7VrlfaDeLU"

  const publicId = `${type}-${Date.now()}`
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
    console.error("Cloudinary banner upload error:", cData)
    throw new Error(cData.error?.message || `Failed to upload ${type} image to Cloudinary.`)
  }

  return cData.public_id
}

/**
 * Delete a media asset from Cloudinary
 */
async function deleteFromCloudinary(mediaKey?: string | null): Promise<void> {
  if (!mediaKey || mediaKey.startsWith("/")) return
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
 * Fetch all banners for the admin list
 */
export async function getAdminBannersList(): Promise<AdminBannerItem[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching admin banners:", error)
      return []
    }

    return (data || []).map((row) => ({
      id: row.id,
      placement: (row.placement || "hero") as BannerPlacement,
      eyebrow: row.eyebrow || null,
      title: row.title || "Untitled Banner",
      subtitle: row.subtitle || null,
      button_label: row.button_label || null,
      button_link: row.button_link || null,
      desktop_image_key: row.desktop_image_key || null,
      desktop_image_url: getCloudinaryUrl(row.desktop_image_key, 2400),
      mobile_image_key: row.mobile_image_key || null,
      mobile_image_url: getCloudinaryUrl(row.mobile_image_key, 1200),
      sort: typeof row.sort === "number" ? row.sort : 0,
      is_active: typeof row.is_active === "boolean" ? row.is_active : true,
      starts_at: row.starts_at || null,
      ends_at: row.ends_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
  } catch (err) {
    console.error("getAdminBannersList exception:", err)
    return []
  }
}

/**
 * Fetch a single banner by ID
 */
export async function getAdminBannerById(id: string): Promise<AdminBannerItem | null> {
  try {
    if (!id) return null
    const supabase = createAdminClient()
    const { data: row, error } = await supabase
      .from("banners")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error || !row) {
      if (error) console.error("Error fetching banner by ID:", error)
      return null
    }

    return {
      id: row.id,
      placement: (row.placement || "hero") as BannerPlacement,
      eyebrow: row.eyebrow || null,
      title: row.title || "Untitled Banner",
      subtitle: row.subtitle || null,
      button_label: row.button_label || null,
      button_link: row.button_link || null,
      desktop_image_key: row.desktop_image_key || null,
      desktop_image_url: getCloudinaryUrl(row.desktop_image_key, 2400),
      mobile_image_key: row.mobile_image_key || null,
      mobile_image_url: getCloudinaryUrl(row.mobile_image_key, 1200),
      sort: typeof row.sort === "number" ? row.sort : 0,
      is_active: typeof row.is_active === "boolean" ? row.is_active : true,
      starts_at: row.starts_at || null,
      ends_at: row.ends_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  } catch (err) {
    console.error("getAdminBannerById exception:", err)
    return null
  }
}

/**
 * Create a new banner slide or promo banner
 */
export async function createBannerAction(formData: FormData): Promise<BannerMutationResponse> {
  try {
    const title = (formData.get("title") as string | null)?.trim()
    const placement = ((formData.get("placement") as string | null) || "hero") as BannerPlacement
    const eyebrow = (formData.get("eyebrow") as string | null)?.trim() || null
    const subtitle = (formData.get("subtitle") as string | null)?.trim() || null
    const button_label = (formData.get("button_label") as string | null)?.trim() || null
    const button_link = (formData.get("button_link") as string | null)?.trim() || null
    const sortRaw = formData.get("sort") as string | null
    const isActiveRaw = formData.get("is_active") as string | null
    const starts_at = (formData.get("starts_at") as string | null)?.trim() || null
    const ends_at = (formData.get("ends_at") as string | null)?.trim() || null

    const desktopFile = formData.get("desktop_file") as File | null
    const mobileFile = formData.get("mobile_file") as File | null

    if (!title) {
      return { success: false, error: "Banner title is required." }
    }

    const sort = sortRaw ? parseInt(sortRaw, 10) : 0
    const is_active = isActiveRaw === "false" ? false : true

    const supabase = createAdminClient()
    const tempId = `ban_${Date.now()}`

    let desktop_image_key: string | null = null
    let mobile_image_key: string | null = null

    if (desktopFile && desktopFile.size > 0) {
      desktop_image_key = await uploadBannerPhotoToCloudinary(desktopFile, tempId, "desktop")
    }

    if (mobileFile && mobileFile.size > 0) {
      mobile_image_key = await uploadBannerPhotoToCloudinary(mobileFile, tempId, "mobile")
    }

    const { data: inserted, error: insertError } = await supabase
      .from("banners")
      .insert({
        placement,
        title,
        eyebrow,
        subtitle,
        button_label,
        button_link,
        desktop_image_key,
        mobile_image_key,
        sort,
        is_active,
        starts_at: starts_at ? new Date(starts_at).toISOString() : null,
        ends_at: ends_at ? new Date(ends_at).toISOString() : null,
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("Failed to insert banner:", insertError)
      return { success: false, error: insertError.message }
    }

    revalidatePath("/admin/banners")
    return { success: true, bannerId: inserted?.id }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create banner."
    console.error("createBannerAction exception:", msg)
    return { success: false, error: msg }
  }
}

/**
 * Update an existing banner slide or promo banner
 */
export async function updateBannerAction(
  id: string,
  formData: FormData
): Promise<BannerMutationResponse> {
  try {
    if (!id) return { success: false, error: "Banner ID is required." }

    const title = (formData.get("title") as string | null)?.trim()
    const placement = ((formData.get("placement") as string | null) || "hero") as BannerPlacement
    const eyebrow = (formData.get("eyebrow") as string | null)?.trim() || null
    const subtitle = (formData.get("subtitle") as string | null)?.trim() || null
    const button_label = (formData.get("button_label") as string | null)?.trim() || null
    const button_link = (formData.get("button_link") as string | null)?.trim() || null
    const sortRaw = formData.get("sort") as string | null
    const isActiveRaw = formData.get("is_active") as string | null
    const starts_at = (formData.get("starts_at") as string | null)?.trim() || null
    const ends_at = (formData.get("ends_at") as string | null)?.trim() || null

    const desktopFile = formData.get("desktop_file") as File | null
    const mobileFile = formData.get("mobile_file") as File | null

    if (!title) {
      return { success: false, error: "Banner title is required." }
    }

    const supabase = createAdminClient()
    const { data: current } = await supabase
      .from("banners")
      .select("desktop_image_key, mobile_image_key")
      .eq("id", id)
      .single()

    let desktop_image_key = current?.desktop_image_key || null
    let mobile_image_key = current?.mobile_image_key || null

    if (desktopFile && desktopFile.size > 0) {
      const newKey = await uploadBannerPhotoToCloudinary(desktopFile, id, "desktop")
      if (desktop_image_key && desktop_image_key !== newKey) {
        await deleteFromCloudinary(desktop_image_key)
      }
      desktop_image_key = newKey
    }

    if (mobileFile && mobileFile.size > 0) {
      const newKey = await uploadBannerPhotoToCloudinary(mobileFile, id, "mobile")
      if (mobile_image_key && mobile_image_key !== newKey) {
        await deleteFromCloudinary(mobile_image_key)
      }
      mobile_image_key = newKey
    }

    const sort = sortRaw ? parseInt(sortRaw, 10) : 0
    const is_active = isActiveRaw === "false" ? false : true

    const { error: updateError } = await supabase
      .from("banners")
      .update({
        placement,
        title,
        eyebrow,
        subtitle,
        button_label,
        button_link,
        desktop_image_key,
        mobile_image_key,
        sort,
        is_active,
        starts_at: starts_at ? new Date(starts_at).toISOString() : null,
        ends_at: ends_at ? new Date(ends_at).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      console.error("Failed to update banner:", updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath("/admin/banners")
    return { success: true, bannerId: id }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update banner."
    console.error("updateBannerAction exception:", msg)
    return { success: false, error: msg }
  }
}

/**
 * Toggle a banner's active status
 */
export async function toggleBannerActiveAction(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("banners")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/banners")
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to toggle banner status."
    return { success: false, error: msg }
  }
}

/**
 * Delete a banner and its associated Cloudinary images
 */
export async function deleteBannerAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: current } = await supabase
      .from("banners")
      .select("desktop_image_key, mobile_image_key")
      .eq("id", id)
      .single()

    if (current) {
      if (current.desktop_image_key) await deleteFromCloudinary(current.desktop_image_key)
      if (current.mobile_image_key) await deleteFromCloudinary(current.mobile_image_key)
    }

    const { error } = await supabase.from("banners").delete().eq("id", id)
    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/banners")
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete banner."
    return { success: false, error: msg }
  }
}

/**
 * Reorder banners by their updated sort order IDs
 */
export async function reorderBannersAction(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const updates = orderedIds.map((id, index) =>
      supabase
        .from("banners")
        .update({ sort: index, updated_at: new Date().toISOString() })
        .eq("id", id)
    )

    await Promise.all(updates)
    revalidatePath("/admin/banners")
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to reorder banners."
    return { success: false, error: msg }
  }
}

/**
 * Seed initial default slides from the storefront into the banners table
 */
export async function seedInitialBannersAction(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = createAdminClient()

    const defaultBanners = [
      {
        placement: "hero",
        eyebrow: "New Collection 2026",
        title: "Timeless Traditions",
        subtitle: "Pure Chiffon, Intricate Embroidery & Heritage Silhouettes",
        button_label: "Shop Collection",
        button_link: "/collections",
        desktop_image_key: "/images/hero_traditions_desktop.png",
        mobile_image_key: "/images/hero_traditions_mobile.png",
        sort: 0,
        is_active: true,
      },
      {
        placement: "hero",
        eyebrow: "Artisan Craftsmanship",
        title: "Royal Velvet & Silk",
        subtitle: "Exquisite Festive Formals Handcrafted in UAE Ateliers",
        button_label: "Explore Collection",
        button_link: "/collections",
        desktop_image_key: "/images/hero_silk_desktop.png",
        mobile_image_key: "/images/hero_silk_mobile.png",
        sort: 1,
        is_active: true,
      },
      {
        placement: "hero",
        eyebrow: "Contemporary Haute Couture",
        title: "Modern Luxury",
        subtitle: "Sophisticated Cuts with Classic Atelier Refinement",
        button_label: "Discover Now",
        button_link: "/collections",
        desktop_image_key: "/images/hero_modern_desktop.png",
        mobile_image_key: "/images/hero_modern_mobile.png",
        sort: 2,
        is_active: true,
      },
      {
        placement: "promo",
        eyebrow: "Personal Atelier Styling",
        title: "Bespoke Bridal & Occasion Wear",
        subtitle: "Private consultations and custom tailoring at our Dubai boutique.",
        button_label: "Book Appointment",
        button_link: "/contact",
        desktop_image_key: "/images/promo_banner_desktop.png",
        mobile_image_key: "/images/promo_banner_mobile.png",
        sort: 0,
        is_active: true,
      },
    ]

    const { data, error } = await supabase.from("banners").insert(defaultBanners).select("id")
    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/banners")
    return { success: true, count: data?.length || 0 }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to seed default banners."
    return { success: false, error: msg }
  }
}
