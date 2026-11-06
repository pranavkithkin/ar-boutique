"use server"

import "server-only"
import { createAdminClient } from "@/lib/supabase/server"
import type { BlogPost, BlogPostListItem } from "./types"

/**
 * Fetch all published blog posts from Supabase for the storefront journal
 */
export async function getPublishedArticles(): Promise<BlogPostListItem[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, category, cover_image, author, read_time, is_featured, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })

    if (error) {
      console.warn("[Journal Service] Could not fetch blog posts from Supabase:", error.message)
      return []
    }

    return (data || []) as BlogPostListItem[]
  } catch (err) {
    console.warn("[Journal Service] Database query exception:", err)
    return []
  }
}

/**
 * Fetch a single published article by slug
 */
export async function getArticleBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return data as BlogPost
  } catch (err) {
    console.warn("[Journal Service] Error fetching article by slug:", err)
    return null
  }
}

/**
 * Fetch related published articles (excluding the current slug)
 */
export async function getRelatedArticles(
  currentSlug: string,
  category?: string,
  limit = 3
): Promise<BlogPostListItem[]> {
  try {
    const supabase = createAdminClient()
    let query = supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, category, cover_image, author, read_time, is_featured, published_at")
      .eq("status", "published")
      .neq("slug", currentSlug)
      .order("published_at", { ascending: false })
      .limit(limit)

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      if (category) {
        const fallback = await supabase
          .from("blog_posts")
          .select("id, slug, title, excerpt, category, cover_image, author, read_time, is_featured, published_at")
          .eq("status", "published")
          .neq("slug", currentSlug)
          .order("published_at", { ascending: false })
          .limit(limit)
        return (fallback.data || []) as BlogPostListItem[]
      }
      return []
    }

    return data as BlogPostListItem[]
  } catch {
    return []
  }
}
