import type { BlogPost, BlogPostListItem } from "./types"

export type JournalArticle = BlogPost
export type JournalArticleListItem = BlogPostListItem

export const JOURNAL_CATEGORIES = [
  "All",
  "Craft & Heritage",
  "Style Guide",
  "Brand Story",
  "Inspiration",
  "Fabric Spotlight",
] as const

export type JournalCategory = (typeof JOURNAL_CATEGORIES)[number]
