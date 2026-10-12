import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
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
import { ArrowLeft, ArrowRight, Calendar, Clock, Share2 } from "lucide-react"
import {
  getArticleBySlug,
  getRelatedArticles,
  getAllArticles,
} from "@/features/blog/data"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedSection, FadeIn } from "@/components/store/AnimatedSection"

interface ArticlePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const articles = getAllArticles()
  return articles.map((article) => ({
    slug: article.slug,
  }))
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    return {
      title: "Article Not Found | AR Boutique",
    }
  }

  return {
    title: `${article.title} | AR Boutique Journal`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.imageSrc],
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const relatedArticles = getRelatedArticles(article.slug, 3)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 pb-24">
        {/* Article Header & Breadcrumbs */}
        <article>
          <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
            <Breadcrumb className="mb-6 md:mb-8">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="hover:text-foreground">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/journal"
                    className="hover:text-foreground"
                  >
                    The Journal
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="truncate max-w-[200px] sm:max-w-[400px]">
                    {article.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <FadeIn delay={0.05}>
              <div className="flex flex-col gap-4 text-center items-center max-w-3xl mx-auto">
                <Badge
                  variant="secondary"
                  className="bg-muted text-xs uppercase tracking-widest px-3 py-1 font-semibold"
                >
                  {article.category}
                </Badge>

                <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-normal leading-[1.15] text-foreground tracking-tight">
                  {article.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-muted-foreground mt-2">
                  <span>By {article.author}</span>
                  <span>•</span>
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
              </div>
            </FadeIn>
          </div>

          {/* Hero Image */}
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12">
            <FadeIn delay={0.08}>
              <div className="relative aspect-[16/9] sm:aspect-[2.2/1] w-full overflow-hidden rounded-xs bg-muted shadow-sm">
                <Image
                  src={article.imageSrc}
                  alt={article.title}
                  fill
                  sizes="(max-width: 1240px) 100vw, 1240px"
                  className="object-cover"
                  priority
                />
              </div>
            </FadeIn>
          </div>

          {/* Article Body */}
          <div className="max-w-[780px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-16">
            <AnimatedSection delay={0.1}>
              {/* Lead Paragraph */}
              <p className="text-lg sm:text-xl font-normal leading-relaxed text-foreground/90 font-serif mb-8 md:mb-10 first-letter:text-5xl first-letter:font-heading first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-foreground">
                {article.content.leadParagraph}
              </p>

              {/* Sections */}
              <div className="flex flex-col gap-8 md:gap-10 text-[15px] sm:text-base leading-relaxed text-foreground/85">
                {article.content.sections.map((section, idx) => (
                  <div key={idx} className="flex flex-col gap-4">
                    {section.heading && (
                      <h2 className="font-heading text-2xl sm:text-3xl font-normal text-foreground mt-4">
                        {section.heading}
                      </h2>
                    )}

                    <p className="leading-relaxed">{section.body}</p>

                    {section.quote && (
                      <blockquote className="my-6 border-l-2 border-foreground pl-6 py-2 italic text-lg sm:text-xl text-foreground font-serif bg-muted/30 rounded-r-xs">
                        &ldquo;{section.quote}&rdquo;
                      </blockquote>
                    )}
                  </div>
                ))}
              </div>

              {/* Author & Back Navigation */}
              <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
                <Link href="/journal">
                  <StoreButton variant="outline" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to All Stories</span>
                  </StoreButton>
                </Link>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Published in {article.category}</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </article>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-16 border-t border-border/60">
            <AnimatedSection delay={0.12}>
              <div className="flex flex-col gap-8">
                <div className="text-center max-w-xl mx-auto">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    Continue Reading
                  </p>
                  <h2 className="font-heading text-2xl sm:text-3xl font-normal text-foreground">
                    More from The Journal
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  {relatedArticles.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/journal/${rel.slug}`}
                      className="group block h-full"
                    >
                      <Card className="flex flex-col h-full overflow-hidden border-border/60 hover:border-foreground/30 transition-colors duration-500 shadow-xs hover:shadow-md pt-0 bg-card">
                        <div className="relative aspect-[16/10] overflow-hidden w-full shrink-0 bg-muted">
                          <Image
                            src={rel.imageSrc}
                            alt={rel.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge
                              variant="secondary"
                              className="bg-background/90 backdrop-blur-xs text-[10px] font-medium tracking-wider uppercase"
                            >
                              {rel.category}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="flex flex-col flex-grow p-6 justify-between gap-4">
                          <div className="flex flex-col gap-2">
                            <span className="text-[12px] text-muted-foreground">
                              {rel.readTime}
                            </span>
                            <h3 className="font-heading text-lg font-normal leading-snug text-foreground group-hover:text-primary transition-colors">
                              {rel.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-foreground group-hover:text-primary">
                            <span>Read Story</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        )}
      </main>

      <StoreFooter />
    </div>
  )
}
