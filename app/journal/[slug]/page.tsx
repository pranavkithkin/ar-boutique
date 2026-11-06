import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { JOURNAL_ENABLED } from "@/lib/journal"
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
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react"
import { getArticleBySlug, getRelatedArticles } from "@/features/blog/actions"
import { formatArticleDate, sanitizeBlogContent } from "@/features/blog/utils"
import { Card, CardContent } from "@/components/ui/card"
import { FadeIn } from "@/components/store/AnimatedSection"

interface ArticlePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  if (!JOURNAL_ENABLED) notFound()

  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    return {
      title: "Article Not Found | AR Boutique",
    }
  }

  return {
    title: `${article.seo_title || article.title} | AR Boutique Journal`,
    description: article.seo_description || article.excerpt || undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      images: article.cover_image ? [{ url: article.cover_image }] : [],
    },
  }
}

export default async function JournalArticlePage({ params }: ArticlePageProps) {
  if (!JOURNAL_ENABLED) notFound()

  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const related = await getRelatedArticles(slug, undefined, 3)
  const formattedDate = formatArticleDate(article.published_at)

  const resolveImage = (img?: string | null) => {
    if (!img) return null
    if (img.startsWith("http") || img.startsWith("/")) return img
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_1600/${img}`
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 pb-24">
        {/* Article Breadcrumbs & Back Navigation */}
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/journal">Journal</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1 max-w-[200px] sm:max-w-[300px]">
                    {article.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <Link
              href="/journal"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Journal</span>
            </Link>
          </div>
        </div>

        {/* Article Header & Editorial Intro */}
        <article className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12">
          <FadeIn>
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-4 md:gap-6">
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-normal leading-tight text-foreground">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground pt-2">
                <span className="font-medium text-foreground">
                  By {article.author || "AR Boutique"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 opacity-70" />
                  {formattedDate}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 opacity-70" />
                  {article.read_time || "4 min read"}
                </span>
              </div>

              {article.excerpt && (
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed italic border-y border-border/40 py-6 my-2 w-full max-w-2xl font-serif">
                  &ldquo;{article.excerpt}&rdquo;
                </p>
              )}
            </div>
          </FadeIn>

          {/* Hero Image - only shown when cover image is uploaded */}
          {resolveImage(article.cover_image) && (
            <FadeIn delay={0.1}>
              <div className="relative aspect-[16/9] sm:aspect-[21/10] overflow-hidden rounded-none my-8 md:my-12 bg-muted border border-border/60">
                <Image
                  src={resolveImage(article.cover_image)!}
                  alt={article.title}
                  fill
                  sizes="(max-width: 1040px) 100vw, 1040px"
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            </FadeIn>
          )}

          {/* Body Content */}
          <div className="max-w-[760px] mx-auto mt-8 md:mt-12">
            {article.content ? (
              article.content.includes("<") ? (
                <div
                  className="journal-article-content"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeBlogContent(article.content),
                  }}
                />
              ) : (
                <div className="journal-article-content">
                  {article.content.split("\n\n").map((para, i) => (
                    <p key={i}>
                      {para}
                    </p>
                  ))}
                </div>
              )
            ) : (
              <p className="text-muted-foreground italic text-center py-12">
                Story content is being finalized in the atelier.
              </p>
            )}
          </div>
        </article>

        {/* Related Stories */}
        {related.length > 0 && (
          <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-16 border-t border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-heading text-2xl sm:text-3xl font-normal text-foreground">
                  Related Stories
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  More dispatches from our craftsmanship and styling atelier.
                </p>
              </div>
              <Link
                href="/journal"
                className="text-xs font-semibold uppercase tracking-wider text-primary hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <span>View All Articles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {related.map((rel) => {
                const relImg = resolveImage(rel.cover_image)
                return (
                  <Link
                    key={rel.slug}
                    href={`/journal/${rel.slug}`}
                    className="group block h-full"
                  >
                    <Card className="flex flex-col h-full overflow-hidden border-border/60 hover:border-foreground/30 transition-colors shadow-xs hover:shadow-md pt-0 bg-card">
                      {relImg ? (
                        <div className="relative aspect-[16/10] overflow-hidden w-full bg-muted">
                          <Image
                            src={relImg}
                            alt={rel.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="p-6 pb-0 pt-6 flex items-center justify-between border-b border-border/40 pb-3">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                              Editorial Dispatch
                            </span>
                        </div>
                      )}
                      <CardContent className="flex flex-col flex-grow p-6 justify-between gap-4">
                        <div>
                          <span className="text-[11px] font-sans text-muted-foreground uppercase tracking-wider block mb-2">
                            {rel.read_time || "4 min read"}
                          </span>
                          <h3 className="font-heading text-lg font-normal leading-snug text-foreground group-hover:text-primary transition-colors">
                            {rel.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                          <span>Read Story</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <StoreFooter />
    </div>
  )
}
