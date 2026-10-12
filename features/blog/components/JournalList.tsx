"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "motion/react"
import { ArrowRight, Clock, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { type JournalArticle, JOURNAL_CATEGORIES } from "../data"

interface JournalListProps {
  articles: JournalArticle[]
  initialCategory?: string
}

export function JournalList({ articles, initialCategory = "All" }: JournalListProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>(initialCategory)

  const filteredArticles = React.useMemo(() => {
    if (selectedCategory === "All") return articles
    return articles.filter((article) => article.category === selectedCategory)
  }, [articles, selectedCategory])

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      {/* Category Pills Filter */}
      <div className="flex items-center justify-start md:justify-center gap-2 sm:gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {JOURNAL_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-300 cursor-pointer shrink-0 border ${
                isActive
                  ? "bg-foreground text-background border-foreground shadow-xs"
                  : "bg-background text-muted-foreground hover:text-foreground border-border/80 hover:border-foreground/40 hover:bg-muted/40"
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Articles Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <AnimatePresence mode="popLayout">
          {filteredArticles.map((article) => (
            <motion.div
              key={article.slug}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href={`/journal/${article.slug}`} className="group block h-full">
                <Card className="flex flex-col h-full overflow-hidden border-border/60 hover:border-foreground/30 transition-colors duration-500 shadow-xs hover:shadow-md pt-0 bg-card">
                  {/* Image Container */}
                  <div className="relative aspect-[16/10] overflow-hidden w-full shrink-0 bg-muted">
                    <Image
                      src={article.imageSrc}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-background/95 backdrop-blur-xs text-[10px] font-semibold tracking-[0.14em] uppercase border-border/50 shadow-xs">
                        {article.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Content Container */}
                  <CardContent className="flex flex-col flex-grow p-6 sm:p-7 justify-between gap-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-[11px] font-sans tracking-wider uppercase text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 opacity-70" />
                          {article.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 opacity-70" />
                          {article.readTime}
                        </span>
                      </div>

                      <h3 className="font-heading text-xl sm:text-[22px] font-normal leading-[1.25] text-foreground group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>

                      <p className="text-[13px] sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground group-hover:text-primary transition-colors">
                      <span>Read Story</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State if category has 0 items */}
      {filteredArticles.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-base">No stories found in this category.</p>
        </div>
      )}
    </div>
  )
}
