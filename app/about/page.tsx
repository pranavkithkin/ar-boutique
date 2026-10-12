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
import { StoreButton } from "@/components/store/StoreButton"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Sparkles, HeartHandshake, ShieldCheck, Feather } from "lucide-react"
import { AnimatedSection, FadeIn } from "@/components/store/AnimatedSection"

export const metadata: Metadata = {
  title: "About Us | AR Boutique",
  description:
    "Discover the heritage and artistry of AR Boutique. Bringing timeless South Asian craftsmanship and modern silhouette elegance to discerning women across the UAE.",
}

const PILLARS = [
  {
    icon: Feather,
    title: "Ancestral Mastery",
    description:
      "We collaborate with master karigars whose families have perfected intricate zardozi needlework, gota patti, and handloom weaving for generations.",
  },
  {
    icon: ShieldCheck,
    title: "Pure & Honest Materials",
    description:
      "Every textile is hand-selected: pure Mulberry silks, breathable organic Chanderi, fine hand-spun mulmul, and genuine metallic threads that never tarnish.",
  },
  {
    icon: HeartHandshake,
    title: "Unhurried Luxury",
    description:
      "We deliberately reject fast-fashion cycles. Each design is released in limited editions, ensuring ethical compensation, artisan dignity, and heirloom longevity.",
  },
]

const TIMELINE = [
  {
    year: "Our Origin",
    title: "A Family Legacy of Fine Textiles",
    text: "Born from a deep reverence for heritage craftsmanship, AR Boutique was conceived to bring the refined richness of artisanal ethnic attire to modern women seeking grace without compromise.",
  },
  {
    year: "The Atelier",
    title: "The Meeting of Past & Present",
    text: "Our design studio bridges royal court heritage with contemporary urban life—lightweight linings, breathable weaves, and versatile modular silhouettes that transition effortlessly from daytime gatherings to celebratory evenings.",
  },
  {
    year: "Today",
    title: "Serving the Discerning UAE Client",
    text: "From our base in the United Arab Emirates, we take pride in delivering bespoke luxury with next-day service, personalized WhatsApp concierge consultations, and flexible cash on delivery.",
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 pb-20">
        {/* Page Hero Header */}
        <div className="bg-muted/50 py-10 md:py-16 border-b border-border/40">
          <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb className="mb-6">
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

            <div className="text-center max-w-3xl mx-auto">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">
                Heritage & Craftsmanship
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-normal text-foreground tracking-tight mb-4">
                The Story of AR Boutique
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Where centuries of artisanal needlework meet contemporary silhouette. Designed for effortless grace, crafted with generational devotion.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-20 flex flex-col gap-16 md:gap-24">
          {/* Main Story Hero Spread */}
          <FadeIn delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              {/* Visual Frame */}
              <div className="lg:col-span-6 relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden rounded-xs bg-muted shadow-sm group">
                <Image
                  src="/images/artisan_embroidery.jpg"
                  alt="Artisan embroidering fine gold zardozi"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  priority
                />
              </div>

              {/* Editorial Copy */}
              <div className="lg:col-span-6 flex flex-col gap-5 text-left">
                <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>The Soul of Our Atelier</span>
                </div>

                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-normal text-foreground leading-[1.2]">
                  We believe true luxury is born of human touch and unhurried patience.
                </h2>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  In an era dominated by fleeting trends and machine-made uniformity, AR Boutique stands as a sanctuary for time-honored artistic traditions. Every garment in our collection is an intimate conversation between the weaver&apos;s loom, the embroiderer&apos;s needle, and the modern woman who breathes life into it.
                </p>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Headquartered in the United Arab Emirates, our collections are meticulously tailored to harmonize cultural reverence with modern ease—offering lightweight comfort that flourishes in regional climates while preserving the majestic grandeur of bespoke South Asian attire.
                </p>

                <div className="pt-2">
                  <Link href="/collections">
                    <StoreButton className="gap-2 px-7">
                      <span>Explore Our Creations</span>
                      <ArrowRight className="w-4 h-4" />
                    </StoreButton>
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Pillars of Excellence */}
          <AnimatedSection delay={0.08}>
            <div className="flex flex-col gap-10">
              <div className="text-center max-w-2xl mx-auto">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-2">
                  Our Guiding Principles
                </p>
                <h2 className="font-heading text-2xl sm:text-3xl font-normal text-foreground">
                  The Pillars of AR Boutique
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {PILLARS.map((pillar, i) => {
                  const Icon = pillar.icon
                  return (
                    <Card
                      key={i}
                      className="border-border/60 hover:border-foreground/30 transition-all duration-500 shadow-xs hover:shadow-md bg-card p-6 sm:p-8 flex flex-col gap-4 text-center items-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-heading text-xl sm:text-2xl font-normal text-foreground">
                        {pillar.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {pillar.description}
                      </p>
                    </Card>
                  )
                })}
              </div>
            </div>
          </AnimatedSection>

          {/* Behind the Scenes & Craft Narrative */}
          <AnimatedSection delay={0.1}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              {/* Copy */}
              <div className="lg:col-span-6 order-2 lg:order-1 flex flex-col gap-5 text-left">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                  Bespoke Craftsmanship
                </p>
                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-normal text-foreground leading-[1.2]">
                  From Raw Thread to Heirloom Ensemble
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Our process begins months prior to each collection. We hand-sketch intricate jaal and botanical motifs inspired by Mughal architecture and Persian tapestries, which are subsequently hand-transferred onto natural mulberry silks and tissue organzas.
                </p>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Up to forty hours of dedicated needlework are invested into a single yoke. When you slip into an AR Boutique ensemble, you wear not simply a dress, but the preserved legacy of master karigars.
                </p>

                <div className="pt-2">
                  <Link href="/journal">
                    <StoreButton variant="outline" className="gap-2 px-7">
                      <span>Read Behind The Scenes</span>
                      <ArrowRight className="w-4 h-4" />
                    </StoreButton>
                  </Link>
                </div>
              </div>

              {/* Visual */}
              <div className="lg:col-span-6 order-1 lg:order-2 relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden rounded-xs bg-muted shadow-sm group">
                <Image
                  src="/images/journal_bts_2.jpg"
                  alt="Our atelier design process and textiles"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </div>
          </AnimatedSection>

          {/* Timeline / Journey */}
          <AnimatedSection delay={0.12}>
            <div className="rounded-xs bg-muted/40 border border-border/60 p-8 sm:p-12 md:p-16">
              <div className="text-center max-w-xl mx-auto mb-10 md:mb-14">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-2">
                  The Journey
                </p>
                <h2 className="font-heading text-2xl sm:text-3xl font-normal text-foreground">
                  Our Commitment to You
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
                {TIMELINE.map((item, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <span className="font-heading text-2xl sm:text-3xl text-foreground/40 font-normal">
                      0{i + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {item.year}
                    </span>
                    <h3 className="font-heading text-lg sm:text-xl font-normal text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Founder Pull Quote */}
          <AnimatedSection delay={0.14}>
            <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6 py-4">
              <blockquote className="font-heading text-2xl sm:text-3xl md:text-4xl font-normal text-foreground leading-[1.3] italic">
                &ldquo;A woman should never have to compromise between cultural magnificence and modern ease. Every stitch we craft is dedicated to making you feel extraordinary.&rdquo;
              </blockquote>
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
                  The Creative Atelier
                </p>
                <p className="text-xs text-muted-foreground">AR Boutique • Dubai, United Arab Emirates</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
