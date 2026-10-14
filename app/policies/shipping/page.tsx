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
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Truck,
  Clock,
  PackageCheck,
  AlertCircle,
  MessageSquare,
  Mail,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from "lucide-react"
import { toAED, STANDARD_DELIVERY_FEE_FILS, FREE_DELIVERY_THRESHOLD_FILS } from "@/lib/money"
import { STORE_CONTACT } from "@/lib/contact"
import { AnimatedSection, FadeIn } from "@/components/store/AnimatedSection"

export const metadata: Metadata = {
  title: "Shipping & Delivery | AR Boutique",
  description:
    "Learn about AR Boutique's delivery areas across all seven UAE emirates, dispatch times, standard charges, and complimentary shipping threshold.",
}

const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
]

const SHIPPING_FAQS = [
  {
    question: "How does Cash on Delivery (COD) work with shipping?",
    answer:
      "Cash on Delivery is available across all seven emirates. Once dispatched, our courier will contact you via call or WhatsApp to confirm your availability and collect payment upon handover.",
  },
  {
    question: "Can I update my delivery address after placing an order?",
    answer:
      "If your order has not yet been dispatched, message us immediately on WhatsApp with your order number and updated address. We will update the shipment details right away.",
  },
  {
    question: "What days of the week are deliveries made?",
    answer:
      "Deliveries operate Monday through Saturday. Sunday delivery availability varies by emirate and courier route.",
  },
]

export default function ShippingPage() {
  const deliveryFee = toAED(STANDARD_DELIVERY_FEE_FILS)
  const freeDeliveryMin = toAED(FREE_DELIVERY_THRESHOLD_FILS)

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
                  <span className="text-muted-foreground">Policies</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Shipping & Delivery</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="inline-block text-[11px] uppercase tracking-widest font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                UAE Doorstep Delivery
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-normal text-foreground tracking-tight">
                Shipping & Delivery
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Carefully inspected, tissue-wrapped, and delivered directly to your doorstep across all seven emirates of the United Arab Emirates.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-14 space-y-12 sm:space-y-16">
          {/* Top 4 Key Highlights */}
          <FadeIn delay={0.05}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="border-border/60 hover:border-foreground/30 transition-all duration-300 shadow-xs bg-card">
                <CardContent className="p-6 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Delivery Charges
                    </h2>
                    <p className="text-base font-medium text-foreground mt-1">
                      AED {deliveryFee} per order
                    </p>
                    <p className="text-xs text-primary font-medium mt-0.5">
                      Free on orders of AED {freeDeliveryMin}+
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 hover:border-foreground/30 transition-all duration-300 shadow-xs bg-card">
                <CardContent className="p-6 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Order Processing
                    </h2>
                    <p className="text-base font-medium text-foreground mt-1">
                      1 to 2 working days
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Packed and dispatched
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 hover:border-foreground/30 transition-all duration-300 shadow-xs bg-card">
                <CardContent className="p-6 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Transit Time
                    </h2>
                    <p className="text-base font-medium text-foreground mt-1">
                      Dubai 1–2 days
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Other emirates 2–4 days
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 hover:border-foreground/30 transition-all duration-300 shadow-xs bg-card">
                <CardContent className="p-6 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Concierge Support
                    </h2>
                    <p className="text-base font-medium text-foreground mt-1">
                      WhatsApp & Email
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Reply within 1 working day
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </FadeIn>

          {/* 2-Column Detailed Layout */}
          <AnimatedSection delay={0.08}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Primary Copy Sections */}
              <div className="lg:col-span-8 flex flex-col gap-8">
                {/* 1. Delivery areas & Delivery time */}
                <Card className="border-border/60 shadow-xs bg-card overflow-hidden">
                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h2 className="font-heading text-xl sm:text-2xl font-normal text-foreground">
                        Delivery areas
                      </h2>
                    </div>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      We deliver across all seven emirates of the UAE.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {/* Dubai Box */}
                      <div className="rounded-lg border border-border/60 bg-muted/30 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-foreground">Dubai</h3>
                          <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                            1 to 2 working days
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          1 to 2 working days after dispatch directly to all residential, business, and atelier addresses in Dubai.
                        </p>
                      </div>

                      {/* Other Emirates Box */}
                      <div className="rounded-lg border border-border/60 bg-muted/30 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-foreground">Other emirates</h3>
                          <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-foreground">
                            2 to 4 working days
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          2 to 4 working days after dispatch across Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-xs text-muted-foreground font-medium mr-1">Covered regions:</span>
                      {EMIRATES.map((emirate) => (
                        <span
                          key={emirate}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-foreground/80 border border-border/40"
                        >
                          {emirate}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* 2. Order processing */}
                <Card className="border-border/60 shadow-xs bg-card">
                  <div className="p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                        <PackageCheck className="w-4 h-4" />
                      </div>
                      <h2 className="font-heading text-xl sm:text-2xl font-normal text-foreground">
                        Order processing
                      </h2>
                    </div>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Orders are packed and dispatched within 1 to 2 working days.
                    </p>

                    <div className="rounded-lg bg-muted/20 border border-border/40 p-4 sm:p-5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Each piece undergoes individual quality checks at our boutique atelier, followed by protective garment wrapping and sealed luxury presentation prior to courier collection.
                    </div>
                  </div>
                </Card>

                {/* 3. Delivery charges */}
                <Card className="border-border/60 shadow-xs bg-card">
                  <div className="p-6 sm:p-8 space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                        <Truck className="w-4 h-4" />
                      </div>
                      <h2 className="font-heading text-xl sm:text-2xl font-normal text-foreground">
                        Delivery charges
                      </h2>
                    </div>

                    <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xl sm:text-2xl font-heading font-medium text-foreground">
                          AED {deliveryFee} per order
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Free delivery on orders of AED {freeDeliveryMin} and above.
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground shrink-0 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        Free Over AED {freeDeliveryMin}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Delivery fees are automatically calculated and clearly displayed during checkout based on your bag subtotal before payment confirmation.
                    </p>
                  </div>
                </Card>

                {/* 4. Delayed or missing orders */}
                <Card className="border-border/60 shadow-xs bg-card">
                  <div className="p-6 sm:p-8 space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <h2 className="font-heading text-xl sm:text-2xl font-normal text-foreground">
                        Delayed or missing orders
                      </h2>
                    </div>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      If your order has not arrived within the delivery time, or something is missing, message us on WhatsApp at{" "}
                      <a
                        href={STORE_CONTACT.whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
                      >
                        {STORE_CONTACT.whatsapp}
                      </a>{" "}
                      or email{" "}
                      <a
                        href={STORE_CONTACT.emailHref}
                        className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
                      >
                        {STORE_CONTACT.email}
                      </a>{" "}
                      with your order number. We will get back to you within 1 working day.
                    </p>

                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 sm:p-5 flex items-start gap-3.5">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          Address & Phone Verification
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Please check your address and phone number at checkout so our delivery partner can reach you.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Sticky Concierge, FAQs & Related Links */}
              <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-28">
                {/* Concierge Assistance Card */}
                <Card className="border-border/60 shadow-xs bg-card">
                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-primary">
                        Direct Assistance
                      </span>
                      <h2 className="font-heading text-xl font-normal text-foreground">
                        Concierge Support
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Have questions about an existing delivery or special courier instructions? Reach out directly to our team.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      <a
                        href={STORE_CONTACT.whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat on WhatsApp
                      </a>
                      <a
                        href={STORE_CONTACT.emailHref}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium border border-input bg-background text-foreground hover:bg-accent transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Send an Email
                      </a>
                    </div>

                    <div className="pt-3 border-t border-border/40 text-xs text-muted-foreground text-center">
                      Replies typically within 1 working day.
                    </div>
                  </div>
                </Card>

                {/* Quick Delivery FAQs */}
                <Card className="border-border/60 shadow-xs bg-card">
                  <div className="p-6 space-y-4">
                    <h2 className="font-heading text-lg font-normal text-foreground">
                      Frequently Asked
                    </h2>
                    <Accordion className="w-full">
                      {SHIPPING_FAQS.map((faq, idx) => (
                        <AccordionItem key={idx} value={`faq-${idx}`}>
                          <AccordionTrigger className="text-left font-medium text-xs sm:text-sm text-foreground hover:no-underline py-3">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-3">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </Card>

                {/* Related Policies & Help */}
                <Card className="border-border/60 shadow-xs bg-muted/30">
                  <div className="p-6 space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Customer Care
                    </h2>
                    <ul className="flex flex-col gap-2.5 text-sm">
                      <li>
                        <Link
                          href="/policies/returns"
                          className="inline-flex items-center justify-between w-full text-foreground hover:text-primary transition-colors py-1 group"
                        >
                          <span>Returns & Exchanges</span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </li>
                      <li className="border-t border-border/40 pt-2.5">
                        <Link
                          href="/size-guide"
                          className="inline-flex items-center justify-between w-full text-foreground hover:text-primary transition-colors py-1 group"
                        >
                          <span>Size Guide</span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </li>
                      <li className="border-t border-border/40 pt-2.5">
                        <Link
                          href="/contact"
                          className="inline-flex items-center justify-between w-full text-foreground hover:text-primary transition-colors py-1 group"
                        >
                          <span>Contact Us</span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
