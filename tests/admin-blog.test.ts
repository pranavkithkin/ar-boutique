import { describe, expect, it } from "vitest"
import { blogPostSchema } from "@/features/admin/blog/schemas"
import { formatArticleDate, resolveArticleImageUrl, sanitizeBlogContent } from "@/features/blog/utils"

describe("Admin Blog schema & validation", () => {
  it("validates a valid article payload", () => {
    const validData = {
      title: "The Heritage of Banarasi Weaves",
      slug: "the-heritage-of-banarasi-weaves",
      excerpt: "Exploring centuries of silk weaving traditions in Varanasi.",
      content: "<p>The golden threads of Banaras have clothed royals for eras...</p>",
      author: "Atelier AR",
      read_time: "5 min read",
      is_featured: true,
      status: "published",
      seo_title: "Banarasi Weaves | AR Boutique",
      seo_description: "Explore ancestral Banarasi silk craftsmanship.",
    }

    const res = blogPostSchema.safeParse(validData)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.category).toBe("Journal")
    }
  })

  it("validates when category is omitted, defaulting to Journal", () => {
    const withoutCategory = {
      title: "Story Without Category",
      slug: "story-without-category",
    }
    const res = blogPostSchema.safeParse(withoutCategory)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.category).toBe("Journal")
    }
  })

  it("rejects an invalid slug format with uppercase or spaces", () => {
    const invalidData = {
      title: "Invalid Article Slug",
      slug: "Invalid Slug With Spaces!",
      category: "Style Guide",
    }

    const res = blogPostSchema.safeParse(invalidData)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.includes("slug"))).toBe(true)
    }
  })

  it("rejects title shorter than 3 characters", () => {
    const invalidData = {
      title: "AB",
      slug: "ab-valid",
      category: "Inspiration",
    }

    const res = blogPostSchema.safeParse(invalidData)
    expect(res.success).toBe(false)
  })

  it("sanitizes malicious tags from blog content", () => {
    const dirty = '<p>Normal text</p><script>alert("hack")</script><iframe src="evil.com"></iframe><a href="javascript:void(0)" onclick="evil()">Click</a>'
    const clean = sanitizeBlogContent(dirty)

    expect(clean).not.toContain("<script>")
    expect(clean).not.toContain("alert")
    expect(clean).not.toContain("<iframe>")
    expect(clean).not.toContain("onclick")
    expect(clean).not.toContain("javascript:")
    expect(clean).toContain("<p>Normal text</p>")
  })

  it("formats article dates accurately", () => {
    expect(formatArticleDate("2026-11-06T10:00:00Z")).toBe("November 6, 2026")
    expect(formatArticleDate(null)).toBe("Recent")
  })

  it("resolves Cloudinary media keys", () => {
    const key = "blog/sample-post/cover-123"
    const url = resolveArticleImageUrl(key)
    expect(url).toContain("res.cloudinary.com")
    expect(url).toContain(key)
  })
})

