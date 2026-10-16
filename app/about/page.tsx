import type { Metadata } from "next"
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

export const metadata: Metadata = {
  title: "About Us | The AR Boutique",
  description:
    "Welcome to The AR Boutique, where timeless Indian heritage meets modern-day elegance. Discover elegant outfits, stylish tops, versatile tunics, and effortlessly chic co-ord sets.",
}

const COMMITMENT_ITEMS = [
  {
    title: "Curated Style",
    description:
      "Bringing together distinctive designs that balance timeless elegance with modern trends.",
  },
  {
    title: "Quality & Comfort",
    description:
      "Prioritizing styles that look beautiful and feel comfortable to wear.",
  },
  {
    title: "A Thoughtful Shopping Experience",
    description:
      "Making your journey with us simple, enjoyable, and inspiring.",
  },
  {
    title: "Fashion for Every Moment",
    description:
      "Offering versatile collections for celebrations, everyday elegance, and everything in between.",
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 pb-24">
        {/* Masthead Header */}
        <section className="border-b border-border/50 bg-muted/20 py-10 md:py-16">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb className="mb-8">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="hover:text-foreground">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>About Us</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <FadeIn delay={0.05}>
              <div className="max-w-3xl space-y-4">
                <span className="text-[11px] font-sans font-medium uppercase tracking-[0.25em] text-muted-foreground block">
                  The AR Boutique
                </span>
                <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-normal text-foreground leading-[1.2] tracking-tight">
                  Welcome to <em className="italic">The AR Boutique</em>, where timeless Indian heritage meets modern-day elegance.
                </h1>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Content Container */}
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-20 space-y-16 md:space-y-24">
          {/* Section 1: Philosophy & Curation */}
          <AnimatedSection delay={0.08}>
            <div className="max-w-3xl space-y-6 text-base sm:text-lg text-muted-foreground font-sans leading-relaxed">
              <p>
                We believe fashion is more than just clothing — Our collection brings together the beauty of Indian traditional wear and the charm of contemporary fashion, featuring elegant outfits, stylish tops, versatile tunics, and effortlessly chic co-ord sets.
              </p>
              <p>
                At The AR Boutique, we carefully curate styles that help you look and feel your best, whether you&apos;re dressing for a festive celebration, a special occasion, a casual outing, or your everyday moments.
              </p>
            </div>
          </AnimatedSection>

          {/* Tagline Feature Card */}
          <AnimatedSection delay={0.1}>
            <div className="bg-card border border-border p-8 sm:p-14 text-center rounded-none shadow-xs">
              <p className="font-heading text-2xl sm:text-3xl md:text-4xl font-normal text-foreground leading-[1.3] italic max-w-2xl mx-auto">
                &ldquo;The AR Boutique — Style Redefined. Your Style, Your Story.&rdquo;
              </p>
            </div>
          </AnimatedSection>

          {/* Section 2: Our Commitment */}
          <AnimatedSection delay={0.12}>
            <div className="space-y-12">
              <div className="max-w-3xl space-y-6">
                <h2 className="font-heading text-3xl sm:text-4xl font-normal text-foreground leading-[1.2]">
                  Our Commitment
                </h2>

                <p className="text-base sm:text-lg text-muted-foreground font-sans leading-relaxed">
                  At <em className="italic text-foreground">The AR Boutique</em>, our commitment goes beyond fashion. We strive to bring you thoughtfully curated styles that celebrate individuality, confidence, and the beauty of self-expression.
                </p>

                <p className="text-base sm:text-lg text-muted-foreground font-sans leading-relaxed">
                  We are dedicated to offering collections that blend the richness of Indian heritage with the elegance of contemporary fashion, helping you find pieces that feel as special as the moments you wear them for.
                </p>
              </div>

              {/* Our commitment to you: 4 Cards */}
              <div className="space-y-6 pt-4">
                <p className="text-sm font-sans font-medium uppercase tracking-[0.15em] text-foreground">
                  Our commitment to you:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {COMMITMENT_ITEMS.map((item, index) => (
                    <div
                      key={index}
                      className="bg-card border border-border/80 p-6 sm:p-7 flex flex-col justify-between rounded-none hover:border-foreground/40 transition-colors space-y-4"
                    >
                      <div className="space-y-3">
                        <span className="font-mono text-xs text-muted-foreground/60 block">
                          0{index + 1}
                        </span>
                        <h3 className="font-heading text-xl font-normal text-foreground">
                          {item.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <div className="h-px w-8 bg-border" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Closing statement */}
              <div className="pt-8 border-t border-border/60">
                <p className="font-heading text-xl sm:text-2xl md:text-3xl font-normal text-foreground leading-[1.35] italic max-w-2xl">
                  &ldquo;Every choice we make reflects our desire to help you discover styles that feel uniquely yours.&rdquo;
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
