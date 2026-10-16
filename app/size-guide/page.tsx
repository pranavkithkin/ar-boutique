import type { Metadata } from "next"
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
import { Card } from "@/components/ui/card"
import { SIZE_CHART_DATA } from "@/lib/size-chart"
import { STORE_CONTACT } from "@/lib/contact"
import { Ruler, MessageSquare, CheckCircle2, ArrowRight } from "lucide-react"
import { AnimatedSection, FadeIn } from "@/components/store/AnimatedSection"

export const metadata: Metadata = {
  title: "Size Guide | AR Boutique",
  description:
    "Size guide and measurement instructions for AR Boutique luxury South Asian attire and modern silhouettes.",
}

const MEASUREMENT_POINTS = [
  {
    name: "Bust",
    description: "Around the fullest part of your bust",
  },
  {
    name: "Waist",
    description: "Around your natural waistline",
  },
  {
    name: "Hip",
    description: "Around the fullest part of your hips",
  },
  {
    name: "Length",
    description: "From the top of the shoulder down to the hem",
  },
]

export default function SizeGuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 pb-20 sm:pb-24">
        {/* Page Hero Header */}
        <div className="bg-muted/40 py-10 sm:py-14 border-b border-border/40">
          <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb className="mb-4 sm:mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="hover:text-foreground">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span className="text-muted-foreground">Customer Care</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Size Guide</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="inline-block text-[11px] uppercase tracking-widest font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                Fit & Silhouette Guide
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-normal text-foreground tracking-tight">
                Size Guide
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Find your perfect fit across all AR Boutique collections. All measurements below are given in{" "}
                <span className="font-semibold text-foreground">Inches</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-14 space-y-10 sm:space-y-12">
          {/* Size Chart Card */}
          <FadeIn delay={0.05}>
            <Card className="border-border/60 shadow-xs bg-card overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                      <Ruler className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-heading text-xl sm:text-2xl font-normal text-foreground">
                        Standard Size Chart
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Body measurements in inches (S to XL)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                    <table className="min-w-full border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50 text-foreground font-semibold">
                          <th className="py-3.5 px-4 text-left uppercase tracking-wider font-semibold">
                            Size
                          </th>
                          <th className="py-3.5 px-4 text-center uppercase tracking-wider font-semibold">
                            Bust
                          </th>
                          <th className="py-3.5 px-4 text-center uppercase tracking-wider font-semibold">
                            Waist
                          </th>
                          <th className="py-3.5 px-4 text-center uppercase tracking-wider font-semibold">
                            Hip
                          </th>
                          <th className="py-3.5 px-4 text-center uppercase tracking-wider font-semibold">
                            Shoulder
                          </th>
                          <th className="py-3.5 px-4 text-center uppercase tracking-wider font-semibold">
                            Length
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {SIZE_CHART_DATA.map((row) => (
                          <tr
                            key={row.size}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-4 px-4 font-semibold text-foreground">
                              {row.size}
                            </td>
                            <td className="py-4 px-4 text-center text-muted-foreground tabular-nums">
                              {row.bust}&quot;
                            </td>
                            <td className="py-4 px-4 text-center text-muted-foreground tabular-nums">
                              {row.waist}&quot;
                            </td>
                            <td className="py-4 px-4 text-center text-muted-foreground tabular-nums">
                              {row.hip}&quot;
                            </td>
                            <td className="py-4 px-4 text-center text-muted-foreground tabular-nums">
                              {row.shoulder}&quot;
                            </td>
                            <td className="py-4 px-4 text-center text-muted-foreground tabular-nums">
                              {row.length}&quot;
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Card>
          </FadeIn>

          {/* Copy C: How to measure */}
          <AnimatedSection delay={0.08}>
            <Card className="border-border/60 shadow-xs bg-card">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="pb-4 border-b border-border/40">
                  <h2 className="font-heading text-xl sm:text-2xl font-normal text-foreground">
                    How to measure
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Follow these guidelines to take accurate measurements with a flexible tape.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {MEASUREMENT_POINTS.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-border/60 bg-muted/20 p-4 sm:p-5 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <h3 className="font-medium text-foreground text-sm sm:text-base">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-6">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Between two sizes concierge callout */}
                <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
                  <div className="space-y-1">
                    <h3 className="font-medium text-foreground text-sm sm:text-base">
                      Between two sizes?
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Message us on WhatsApp at{" "}
                      <a
                        href={STORE_CONTACT.whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
                      >
                        {STORE_CONTACT.whatsapp}
                      </a>{" "}
                      and we will help you choose.
                    </p>
                  </div>
                  <a
                    href={STORE_CONTACT.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs shrink-0"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </Card>
          </AnimatedSection>

          {/* Quick Help Footer Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/policies/shipping"
              className="p-5 rounded-lg border border-border/60 bg-card hover:bg-muted/40 transition-colors flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-medium text-foreground">Shipping & Delivery</p>
                <p className="text-xs text-muted-foreground">Learn about UAE transit and dispatch</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/policies/returns"
              className="p-5 rounded-lg border border-border/60 bg-card hover:bg-muted/40 transition-colors flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-medium text-foreground">Returns & Exchanges</p>
                <p className="text-xs text-muted-foreground">Easy 7-day returns for peace of mind</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
