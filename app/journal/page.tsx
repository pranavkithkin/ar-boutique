import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { StoreButton } from "@/components/store/StoreButton"
import { ArrowRight, Calendar, Clock, Sparkles } from "lucide-react"
import { getAllArticles, getFeaturedArticle } from "@/features/blog/data"
import { JournalList } from "@/features/blog/components/JournalList"
import { AnimatedSection, FadeIn } from "@/components/store/AnimatedSection"

export const metadata: Metadata = {
  title: "The Journal | AR Boutique",
  description:
    "Stories of timeless heritage, master craftsmanship, contemporary styling, and behind-the-scenes glimpses into the AR Boutique atelier.",
}

export default function JournalPage() {
  const articles = getAllArticles()
  const featured = getFeaturedArticle()
  const remainingArticles = articles.filter((a) => a.slug !== featured.slug)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 pb-20">
        {/* Page Hero Header */}
        <div className="bg-muted/50 py-8 md:py-12 border-b border-border/40">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb className="mb-4 md:mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="hover:text-foreground">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>The Journal</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-heading font-normal text-foreground tracking-tight mb-3">
                The Journal
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                Reflections on heritage crafts, modern silhouette styling, and the unhurried artistry behind our signature collections.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-14 flex flex-col gap-14 md:gap-20">
          {/* Featured Lead Story */}
          {featured && (
            <FadeIn delay={0.05}>
              <div className="group relative overflow-hidden rounded-xs border border-border/60 bg-card shadow-xs hover:shadow-md transition-shadow duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* Visual Column */}
                  <div className="relative lg:col-span-7 h-[300px] sm:h-[400px] lg:h-[480px] overflow-hidden bg-muted">
                    <Image
                      src={featured.imageSrc}
                      alt={featured.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      priority
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
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-semibold uppercase tracking-wider text-primary">
                          {featured.category}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 opacity-70" />
                          {featured.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 opacity-70" />
                          {featured.readTime}
                        </span>
                      </div>

                      <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-normal leading-tight text-foreground group-hover:text-primary transition-colors">
                        <Link href={`/journal/${featured.slug}`}>
                          {featured.title}
                        </Link>
                      </h2>

                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {featured.excerpt}
                      </p>
                    </div>

                    <div className="pt-6 sm:pt-8">
                      <Link href={`/journal/${featured.slug}`}>
                        <StoreButton className="w-full sm:w-auto px-8 gap-2 group-hover:bg-foreground/90">
                          <span>Read Article</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </StoreButton>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          )}

          {/* Interactive Journal Grid with Category Filters */}
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

              <JournalList articles={articles} />
            </div>
          </AnimatedSection>
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
