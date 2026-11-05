import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { getAllArticles, getArticleBySlug, getFeaturedArticle, getRelatedArticles } from "@/features/blog/data"

describe("Journal content", () => {
  it("handles an empty feed without a featured story", () => {
    expect(getFeaturedArticle([])).toBeUndefined()
  })

  it("falls back to the first story when none is featured", () => {
    const articles = getAllArticles().map((article) => ({ ...article, featured: false }))
    expect(getFeaturedArticle(articles)).toEqual(articles[0])
  })

  it("has unique article URLs and existing local cover images", () => {
    const articles = getAllArticles()
    expect(new Set(articles.map((article) => article.slug)).size).toBe(articles.length)
    for (const article of articles) {
      expect(article.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(existsSync(join(process.cwd(), "public", article.imageSrc))).toBe(true)
      expect(getArticleBySlug(article.slug)).toEqual(article)
    }
  })

  it("does not resolve an unknown article", () => {
    expect(getArticleBySlug("unknown-article")).toBeUndefined()
  })

  it("limits related stories and excludes the story being read", () => {
    const current = getAllArticles()[0]
    const related = getRelatedArticles(current.slug, 2)
    expect(related).toHaveLength(2)
    expect(related.some((article) => article.slug === current.slug)).toBe(false)
  })
})
