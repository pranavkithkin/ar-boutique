import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
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
import { AnimatedSection, FadeIn } from "@/components/store/AnimatedSection"
import { ArrowRight, Sparkles, HeartHandshake, Gem, Compass } from "lucide-react"

export const metadata: Metadata = {
  title: "About Us | The AR Boutique",
  description:
    "Welcome to The AR Boutique, where timeless Indian heritage meets modern-day elegance. Discover elegant outfits, stylish tops, versatile tunics, and effortlessly chic co-ord sets.",
}

const COMMITMENT_ITEMS = [
  {
    number: "01",
    title: "Curated Style",
    description:
      "Bringing together distinctive designs that balance timeless elegance with modern trends.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Quality & Comfort",
    description:
      "Prioritizing styles that look beautiful and feel comfortable to wear.",
    icon: Gem,
  },
  {
    number: "03",
    title: "A Thoughtful Shopping Experience",
    description:
      "Making your journey with us simple, enjoyable, and inspiring.",
    icon: HeartHandshake,
  },
  {
    number: "04",
    title: "Fashion for Every Moment",
    description:
      "Offering versatile collections for celebrations, everyday elegance, and everything in between.",
    icon: Compass,
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 pb-24 md:pb-32">
        {/* Breadcrumb Navigation */}
        <div className="border-b border-border/40 bg-muted/10 py-3.5">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="hover:text-foreground text-xs">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs">About Us</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Hero Section: Split Editorial Layout with Imagery */}
        <section className="relative overflow-hidden border-b border-border/60 bg-muted/15 py-12 md:py-20 lg:py-24">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: Heading & Introduction */}
              <div className="lg:col-span-7 space-y-6 md:space-y-8">
                <FadeIn delay={0.05}>
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2">
                      <span className="h-px w-6 bg-foreground/40" />
                      <span className="text-[11px] font-sans font-medium uppercase tracking-[0.25em] text-muted-foreground">
                        The AR Boutique
                      </span>
                    </div>

                    <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-normal text-foreground leading-[1.15] tracking-tight">
                      Welcome to <em className="italic">The AR Boutique</em>, where timeless Indian heritage meets modern-day elegance.
                    </h1>
                  </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                  <div className="space-y-5 text-base sm:text-lg text-muted-foreground font-sans leading-relaxed pt-2 border-t border-border/60">
                    <p>
                      We believe fashion is more than just clothing — Our collection brings together the beauty of Indian traditional wear and the charm of contemporary fashion, featuring elegant outfits, stylish tops, versatile tunics, and effortlessly chic co-ord sets.
                    </p>
                    <p>
                      At The AR Boutique, we carefully curate styles that help you look and feel your best, whether you&apos;re dressing for a festive celebration, a special occasion, a casual outing, or your everyday moments.
                    </p>
                  </div>
                </FadeIn>
              </div>

              {/* Right Column: Editorial Visual Showcase */}
              <div className="lg:col-span-5">
                <FadeIn delay={0.15}>
                  <div className="relative">
                    {/* Main Fashion Visual */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden border border-border shadow-xs bg-muted">
                      <Image
                        src="/images/about_dress_hero.jpg"
                        alt="The AR Boutique Modern Indian Heritage & Contemporary Elegance"
                        fill
                        unoptimized
                        priority
                        sizes="(max-width: 1024px) 100vw, 42vw"
                        className="object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-4 left-4 right-4 text-white p-3.5 backdrop-blur-[3px] bg-black/25 border border-white/15">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-white/80 block">
                          Atelier Heritage
                        </span>
                        <span className="font-heading text-sm sm:text-base italic text-white block">
                          Timeless Indian Heritage Meets Modern Elegance
                        </span>
                      </div>
                    </div>

                    {/* Subtle decorative offset border */}
                    <div className="hidden sm:block absolute -bottom-3 -right-3 -z-10 w-full h-full border border-foreground/15 pointer-events-none" />
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Pull-Quote Banner */}
        <section className="border-b border-border/60 bg-accent/35 py-14 md:py-20">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <AnimatedSection delay={0.08}>
              <div className="space-y-4">
                <span className="text-[11px] font-sans font-medium uppercase tracking-[0.25em] text-muted-foreground block">
                  Our Philosophy
                </span>
                <p className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-normal text-foreground leading-[1.3] italic max-w-3xl mx-auto">
                  &ldquo;The AR Boutique — Style Redefined. Your Style, Your Story.&rdquo;
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Commitment Section: Deep Story & 4 Pillars Grid */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-16 md:space-y-20">
              {/* Story Intro */}
              <AnimatedSection delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
                  <div className="lg:col-span-5 space-y-3">
                    <span className="text-[11px] font-sans font-medium uppercase tracking-[0.25em] text-muted-foreground block">
                      Core Values
                    </span>
                    <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-normal text-foreground leading-[1.15]">
                      Our Commitment
                    </h2>
                  </div>

                  <div className="lg:col-span-7 space-y-5 text-base sm:text-lg text-muted-foreground font-sans leading-relaxed lg:pt-2">
                    <p>
                      At <em className="italic text-foreground">The AR Boutique</em>, our commitment goes beyond fashion. We strive to bring you thoughtfully curated styles that celebrate individuality, confidence, and the beauty of self-expression.
                    </p>
                    <p>
                      We are dedicated to offering collections that blend the richness of Indian heritage with the elegance of contemporary fashion, helping you find pieces that feel as special as the moments you wear them for.
                    </p>
                  </div>
                </div>
              </AnimatedSection>

              {/* 4 Pillars - Luxury Editorial Column Layout with Fine Dividers */}
              <AnimatedSection delay={0.12}>
                <div className="space-y-10">
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-sans font-medium uppercase tracking-[0.25em] text-muted-foreground">
                      Our commitment to you
                    </span>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/60 border-y border-border/60">
                    {COMMITMENT_ITEMS.map((item, index) => {
                      return (
                        <div
                          key={index}
                          className="py-8 md:py-10 px-0 md:px-7 first:pl-0 last:pr-0 flex flex-col justify-between space-y-6 group"
                        >
                          <div className="space-y-4">
                            <span className="font-heading text-2xl text-muted-foreground/60 italic font-normal block group-hover:text-foreground transition-colors">
                              {item.number}.
                            </span>

                            <h3 className="font-heading text-2xl sm:text-[1.45rem] font-normal text-foreground leading-snug">
                              {item.title}
                            </h3>

                            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          <div className="pt-2">
                            <div className="h-0.5 w-6 bg-border group-hover:w-12 group-hover:bg-foreground transition-all duration-300" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </AnimatedSection>

              {/* Bottom Closing Statement & Storefront Link */}
              <AnimatedSection delay={0.15}>
                <div className="border border-border bg-muted/20 p-8 sm:p-12 md:p-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="max-w-2xl space-y-2">
                    <p className="font-heading text-xl sm:text-2xl md:text-3xl font-normal text-foreground leading-[1.3] italic">
                      &ldquo;Every choice we make reflects our desire to help you discover styles that feel uniquely yours.&rdquo;
                    </p>
                    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground pt-1">
                      The AR Boutique — Dubai, UAE
                    </p>
                  </div>

                  <Link
                    href="/collections"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground text-xs font-medium uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors shrink-0 self-start md:self-auto"
                  >
                    <span>Explore Collections</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  )
}

