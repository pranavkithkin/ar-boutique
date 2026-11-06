"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "motion/react"
import { ArrowRight, Clock, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { BlogPostListItem } from "../types"

interface JournalListProps {
  articles: BlogPostListItem[]
}

export function JournalList({ articles }: JournalListProps) {
  // Helper for image resolution (returns null if no image was uploaded)
  const resolveImageUrl = (coverImage?: string | null) => {
    if (!coverImage) return null
    if (coverImage.startsWith("http") || coverImage.startsWith("/")) return coverImage
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_800/${coverImage}`
  }

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Recent"
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return "Recent"
    }
  }

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      <p role="status" className="sr-only">
        {articles.length} {articles.length === 1 ? "story" : "stories"}
      </p>

      {/* Articles Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <AnimatePresence mode="popLayout">
          {articles.map((article) => {
            const imgUrl = resolveImageUrl(article.cover_image)
            const dateDisplay = formatDate(article.published_at)

            return (
              <motion.div
                key={article.slug}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/journal/${article.slug}`}
                  className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="flex flex-col h-full overflow-hidden border-border/60 hover:border-foreground/30 transition-colors duration-500 shadow-xs hover:shadow-md pt-0 bg-card">
                    {/* Visual Cover or Text-Only Header */}
                    {imgUrl ? (
                      <div className="relative aspect-[16/10] overflow-hidden w-full shrink-0 bg-muted">
                        <Image
                          src={imgUrl}
                          alt={article.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover motion-safe:group-hover:scale-105 transition-transform duration-700 ease-out"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="p-6 sm:p-7 pb-0 flex items-center justify-between border-b border-border/40 pb-4">
                        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                          Editorial Dispatch
                        </span>
                      </div>
                    )}

                    {/* Content Container */}
                    <CardContent className="flex flex-col flex-grow p-6 sm:p-7 justify-between gap-5">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-[11px] font-sans tracking-wider uppercase text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 opacity-70" />
                            {dateDisplay}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 opacity-70" />
                            {article.read_time || "4 min read"}
                          </span>
                        </div>

                        <h3 className="font-heading text-xl sm:text-[22px] font-normal leading-[1.25] text-foreground group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>

                        {article.excerpt && (
                          <p className="text-[13px] sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {article.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground group-hover:text-primary transition-colors">
                        <span>Read Story</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty State if 0 items */}
      {articles.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-base">No editorial stories published yet.</p>
        </div>
      )}
    </div>
  )
}
