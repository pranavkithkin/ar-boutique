"use server"

import "server-only"
import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { blogPostSchema } from "./schemas"
import type { AdminBlogPost, AdminBlogMutationResponse, BlogPostStatus, SaveBlogPostInput } from "./types"

/**
 * Cloudinary helper to format full secure URLs
 */
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
 * Upload a cover photo directly to Cloudinary
 */
export async function uploadBlogCoverPhotoAction(formData: FormData): Promise<{
  success: boolean
  mediaKey?: string
  url?: string
  error?: string
}> {
  try {
    const file = formData.get("file") as File | null
    const postId = (formData.get("postId") as string | null) || `post-${Date.now()}`

    if (!file) {
      return { success: false, error: "No image file provided." }
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
    const folder = `${process.env.CLOUDINARY_FOLDER || "ar-dev"}/blog`
    const apiKey = process.env.CLOUDINARY_API_KEY || "822299811143611"
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "EjPgkhLeSanX8bJ1N7VrlfaDeLU"

    const publicId = `cover-${Date.now()}`
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
      console.error("Cloudinary blog upload error:", cData)
      return { success: false, error: cData.error?.message || "Failed to upload cover photo to Cloudinary." }
    }

    const mediaKey = cData.public_id
    const url = cData.secure_url || getCloudinaryUrl(mediaKey) || undefined

    return { success: true, mediaKey, url }
  } catch (err) {
    console.error("uploadBlogCoverPhotoAction error:", err)
    return { success: false, error: "An unexpected error occurred during image upload." }
  }
}

/**
 * Delete a media asset from Cloudinary
 */
async function deleteFromCloudinary(mediaKey?: string | null): Promise<void> {
  if (!mediaKey || mediaKey.startsWith("http://") || mediaKey.startsWith("https://") || mediaKey.startsWith("/")) return
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

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: delFormData,
    })
    const data = await res.json()
    if (data.result !== "ok") {
      console.warn("Cloudinary destroy response:", data)
    }
  } catch (err) {
    console.error("Failed to delete Cloudinary asset:", err)
  }
}

/**
 * Server action to delete a blog cover photo from Cloudinary
 */
export async function deleteBlogCoverPhotoAction(mediaKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!mediaKey) return { success: false, error: "No media key provided." }
    await deleteFromCloudinary(mediaKey)
    return { success: true }
  } catch (err) {
    console.error("deleteBlogCoverPhotoAction error:", err)
    return { success: false, error: "Failed to delete cover image from Cloudinary." }
  }
}

/**
 * Fetch all articles for the admin dashboard list
 */
export async function getAdminBlogPostsAction(): Promise<AdminBlogPost[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.warn("Could not query blog_posts table:", error.message)
      return []
    }

    return (data || []) as AdminBlogPost[]
  } catch (err) {
    console.error("getAdminBlogPostsAction error:", err)
    return []
  }
}

/**
 * Fetch a single article by ID
 */
export async function getAdminBlogPostByIdAction(id: string): Promise<AdminBlogPost | null> {
  try {
    if (!id) return null
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error || !data) return null
    return data as AdminBlogPost
  } catch (err) {
    console.error("getAdminBlogPostByIdAction error:", err)
    return null
  }
}

/**
 * Create or update an article
 */
export async function saveBlogPostAction(input: SaveBlogPostInput): Promise<AdminBlogMutationResponse> {
  try {
    const validated = blogPostSchema.safeParse(input)
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      }
    }

    const {
      id,
      title,
      slug,
      excerpt,
      content,
      category,
      cover_image,
      author,
      read_time,
      is_featured,
      status,
      published_at,
      seo_title,
      seo_description,
    } = validated.data

    const supabase = createAdminClient()

    // Slug uniqueness check
    let slugCheckQuery = supabase.from("blog_posts").select("id").eq("slug", slug)
    if (id) {
      slugCheckQuery = slugCheckQuery.neq("id", id)
    }
    const { data: existingSlug } = await slugCheckQuery.maybeSingle()
    if (existingSlug) {
      return {
        success: false,
        error: `The URL slug "${slug}" is already in use by another article. Please provide a unique slug.`,
      }
    }

    // If publishing and no published_at is set, stamp current time. If draft or archived, clear published_at.
    let finalPublishedAt = published_at
    if (status === "published") {
      finalPublishedAt = finalPublishedAt || new Date().toISOString()
    } else {
      finalPublishedAt = null
    }

    const payload = {
      title,
      slug,
      excerpt: excerpt || null,
      content: content || null,
      category,
      cover_image: cover_image || null,
      author: author || "AR Boutique",
      read_time: read_time || "4 min read",
      is_featured: !!is_featured,
      status,
      published_at: finalPublishedAt,
      seo_title: seo_title || null,
      seo_description: seo_description || null,
      updated_at: new Date().toISOString(),
    }

    let savedRecord: AdminBlogPost

    if (id) {
      const { data, error } = await supabase
        .from("blog_posts")
        .update(payload)
        .eq("id", id)
        .select()
        .single()

      if (error || !data) {
        console.error("Error updating blog post:", error)
        return { success: false, error: error?.message || "Failed to update article." }
      }
      savedRecord = data as AdminBlogPost
    } else {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error || !data) {
        console.error("Error creating blog post:", error)
        return { success: false, error: error?.message || "Failed to create article." }
      }
      savedRecord = data as AdminBlogPost
    }

    // Revalidate storefront and admin paths
    revalidatePath("/admin/blog")
    revalidatePath(`/admin/blog/${savedRecord.id}`)
    revalidatePath("/journal")
    revalidatePath(`/journal/${savedRecord.slug}`)
    revalidatePath("/")

    return { success: true, post: savedRecord }
  } catch (err) {
    console.error("saveBlogPostAction error:", err)
    return { success: false, error: "An unexpected error occurred while saving the article." }
  }
}

/**
 * Toggle draft/published status quickly from the admin table
 */
export async function toggleBlogPostStatusAction(
  id: string,
  newStatus: BlogPostStatus
): Promise<AdminBlogMutationResponse> {
  try {
    const supabase = createAdminClient()
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === "published") {
      updatePayload.published_at = new Date().toISOString()
    } else {
      updatePayload.published_at = null
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single()

    if (error || !data) {
      return { success: false, error: error?.message || "Failed to update article status." }
    }

    revalidatePath("/admin/blog")
    revalidatePath("/journal")
    return { success: true, post: data as AdminBlogPost }
  } catch (err) {
    return { success: false, error: "Failed to update article status." }
  }
}

/**
 * Delete a blog post by ID
 */
export async function deleteBlogPostAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Fetch cover image key to clean up if needed
    const { data: post } = await supabase.from("blog_posts").select("cover_image, slug").eq("id", id).maybeSingle()

    if (post?.cover_image) {
      await deleteFromCloudinary(post.cover_image)
    }

    const { error } = await supabase.from("blog_posts").delete().eq("id", id)
    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/blog")
    revalidatePath("/journal")
    if (post?.slug) {
      revalidatePath(`/journal/${post.slug}`)
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: "Failed to delete article." }
  }
}

