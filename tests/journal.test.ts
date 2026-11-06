import { describe, expect, it } from "vitest"
import { formatArticleDate, resolveArticleImageUrl } from "@/features/blog/utils"
import { JOURNAL_CATEGORIES } from "@/features/blog/data"

describe("Journal service & categories", () => {
  it("formats article dates gracefully", () => {
    const formatted = formatArticleDate("2026-11-05T12:00:00Z")
    expect(formatted).toBe("November 5, 2026")

    const fallback = formatArticleDate(null)
    expect(fallback).toBe("Recent")
  })

  it("resolves cover images with fallbacks", () => {
    expect(resolveArticleImageUrl(null)).toBe("/images/artisan_embroidery.jpg")
    expect(resolveArticleImageUrl("https://example.com/cover.jpg")).toBe("https://example.com/cover.jpg")
    expect(resolveArticleImageUrl("/images/artisan.jpg")).toBe("/images/artisan.jpg")
    expect(resolveArticleImageUrl("blog/sample-key")).toContain("res.cloudinary.com")
  })

  it("includes expected editorial categories with 'All'", () => {
    expect(JOURNAL_CATEGORIES).toContain("All")
    expect(JOURNAL_CATEGORIES).toContain("Craft & Heritage")
    expect(JOURNAL_CATEGORIES).toContain("Style Guide")
    expect(JOURNAL_CATEGORIES.length).toBeGreaterThan(3)
  })

  it("validates slug naming pattern", () => {
    const validSlug = "poetry-of-handcrafted-zardozi"
    expect(validSlug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })
})
