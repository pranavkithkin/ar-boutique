import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { JOURNAL_ENABLED } from "@/lib/journal"
import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { JournalPageHeader } from "@/features/blog/components/JournalPageHeader"
import { Badge } from "@/components/ui/badge"
import { StoreButton } from "@/components/store/StoreButton"
import { ArrowRight, Calendar, Clock, Sparkles, BookOpen } from "lucide-react"
import { getPublishedArticles } from "@/features/blog/actions"
import { formatArticleDate } from "@/features/blog/utils"
import { JournalList } from "@/features/blog/components/JournalList"
import { AnimatedSection, FadeIn } from "@/components/store/AnimatedSection"

export const metadata: Metadata = JOURNAL_ENABLED
  ? {
      title: "The Journal | AR Boutique",
      description:
        "Stories of timeless heritage, master craftsmanship, contemporary styling, and behind-the-scenes glimpses into the AR Boutique atelier.",
    }
  : {
      title: "Page Not Found | AR Boutique",
      robots: { index: false, follow: false },
    }

export default async function JournalPage() {
  if (!JOURNAL_ENABLED) notFound()

  // Real data from Supabase backend (never dummy placeholders)
  const articles = await getPublishedArticles()
  const featured = articles.find((a) => a.is_featured) || articles[0] || null
  const gridArticles = featured ? articles.filter((a) => a.id !== featured.id) : articles

  // Helper for image resolution (returns null when no cover image is uploaded)
  const resolveCover = (img?: string | null) => {
    if (!img) return null
    if (img.startsWith("http") || img.startsWith("/")) return img
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_1600/${img}`
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 pb-20">
        <JournalPageHeader />

        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-14 flex flex-col gap-14 md:gap-20">
          {articles.length === 0 ? (
            /* Luxury Empty State when no stories are published yet */
            <FadeIn delay={0.05}>
              <div className="rounded-none border border-border/70 bg-card p-12 md:p-20 text-center flex flex-col items-center justify-center max-w-2xl mx-auto shadow-xs">
                <div className="w-14 h-14 rounded-full bg-muted/60 border border-border flex items-center justify-center text-primary mb-6">
                  <BookOpen className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary mb-2">
                  Editorial Atelier
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-normal text-foreground mb-4">
                  Dispatches From The Atelier
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mb-8">
                  Our stories of ancestral craftsmanship, styling inspirations, and seasonal releases are currently being prepared. Check back soon for our inaugural journal publications.
                </p>
                <StoreButton render={<Link href="/collections" />} className="px-8">
                  <span>Explore The Collection</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </StoreButton>
              </div>
            </FadeIn>
          ) : (
            <>
              {/* Featured Lead Story */}
              {featured && (
                <FadeIn delay={0.05}>
                  {resolveCover(featured.cover_image) ? (
                    <div className="group relative overflow-hidden rounded-none border border-border/60 bg-card shadow-xs hover:shadow-md transition-shadow duration-500">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                        {/* Visual Column */}
                        <div className="relative lg:col-span-7 h-[300px] sm:h-[400px] lg:h-[480px] overflow-hidden bg-muted">
                          <Image
                            src={resolveCover(featured.cover_image)!}
                            alt={featured.title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 60vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            priority
                            unoptimized
                          />
                          <div className="absolute top-4 left-4 z-10">
                            <Badge className="bg-foreground text-background font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 px-3 py-1 shadow-sm">
                              <Sparkles className="w-3 h-3" />
                              Featured Story
                            </Badge>
                          </div>
                        </div>

                        {/* Editorial Text Column */}
                        <div className="lg:col-span-5 p-6 sm:p-8 md:p-12 flex flex-col justify-between bg-card">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 opacity-70" />
                                {formatArticleDate(featured.published_at)}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 opacity-70" />
                                {featured.read_time || "4 min read"}
                              </span>
                            </div>

                            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-normal leading-tight text-foreground group-hover:text-primary transition-colors">
                              <Link href={`/journal/${featured.slug}`}>
                                {featured.title}
                              </Link>
                            </h2>

                            {featured.excerpt && (
                              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                {featured.excerpt}
                              </p>
                            )}
                          </div>

                          <div className="pt-6 sm:pt-8">
                            <StoreButton
                              render={<Link href={`/journal/${featured.slug}`} />}
                              className="w-full sm:w-auto px-8 gap-2 group-hover:bg-foreground/90"
                            >
                              <span>Read Article</span>
                              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </StoreButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Pure Typographic Editorial Hero when no image is uploaded */
                    <div className="group relative overflow-hidden rounded-none border border-border/80 bg-card p-8 sm:p-12 md:p-16 shadow-xs hover:shadow-md transition-shadow duration-500">
                      <div className="flex flex-col max-w-3xl gap-6">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-foreground text-background font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 px-3 py-1 shadow-sm">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            Featured Dispatch
                          </Badge>
                        </div>

                        <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-normal leading-tight text-foreground group-hover:text-primary transition-colors">
                          <Link href={`/journal/${featured.slug}`}>
                            {featured.title}
                          </Link>
                        </h2>

                        {featured.excerpt && (
                          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                            {featured.excerpt}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
                          <span className="font-medium text-foreground">By {featured.author}</span>
                          <span>•</span>
                          <span>{formatArticleDate(featured.published_at)}</span>
                          <span>•</span>
                          <span>{featured.read_time || "4 min read"}</span>
                        </div>

                        <div className="pt-4">
                          <StoreButton
                            render={<Link href={`/journal/${featured.slug}`} />}
                            className="px-8 gap-2"
                          >
                            <span>Read Full Dispatch</span>
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </StoreButton>
                        </div>
                      </div>
                    </div>
                  )}
                </FadeIn>
              )}

              {/* Interactive Journal Grid */}
              {gridArticles.length > 0 && (
                <AnimatedSection delay={0.1}>
                  <div className="flex flex-col gap-6 md:gap-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border/40">
                      <div>
                        <h2 className="font-heading text-2xl sm:text-3xl font-normal text-foreground">
                          Latest Dispatches
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Filter stories by atelier craft, style guides, or design inspiration.
                        </p>
                      </div>
                    </div>

                    <JournalList articles={gridArticles} />
                  </div>
                </AnimatedSection>
              )}
            </>
          )}
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
