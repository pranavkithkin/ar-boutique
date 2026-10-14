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
  Clock,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  MessageSquare,
  Mail,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  FileText,
} from "lucide-react"
import { STORE_CONTACT } from "@/lib/contact"
import { AnimatedSection, FadeIn } from "@/components/store/AnimatedSection"

export const metadata: Metadata = {
  title: "Returns & Exchanges | AR Boutique",
  description:
    "Learn about AR Boutique's 7-day return and exchange policy, garment condition standards, refund timelines, and concierge assistance.",
}

const RETURN_CONDITIONS = [
  "Unworn, unwashed, and completely odor-free",
  "All boutique designer tags intact and attached",
  "In the original luxury packaging and garment bags",
  "No alterations, tailoring, or cosmetic blemishes",
]

const RETURN_STEPS = [
  {
    step: "1",
    title: "Initiate Your Request",
    description: `Message our concierge team on WhatsApp at ${STORE_CONTACT.whatsapp} or email ${STORE_CONTACT.email} with your order number and the item(s) you wish to return or exchange.`,
  },
  {
    step: "2",
    title: "Courier Collection",
    description:
      "Our team will confirm eligibility and arrange a convenient courier pickup from your delivery address.",
  },
  {
    step: "3",
    title: "Inspection & Refund",
    description:
      "Upon receipt at our atelier, pieces are inspected. Refunds are issued to your original payment method within 5 to 10 working days.",
  },
]

const RETURN_FAQS = [
  {
    question: "Can I exchange an item for a different size or colour?",
    answer:
      "Yes. Subject to availability in our collection, our concierge will reserve your requested size or colourway and dispatch it once your return parcel is collected and verified.",
  },
  {
    question: "How are Cash on Delivery (COD) refunds processed?",
    answer:
      "For COD orders, refunds are transferred directly and securely to your UAE bank account after atelier inspection. Our concierge will request your account details via email.",
  },
  {
    question: "What if I received a damaged or incorrect piece?",
    answer:
      "Contact us within 48 hours of delivery with a photo. We will immediately arrange a replacement or complete refund at zero extra cost to you.",
  },
]

export default function ReturnsPage() {
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
                  <BreadcrumbPage>Returns & Exchanges</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="inline-block text-[11px] uppercase tracking-widest font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                Client Satisfaction & Care
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-normal text-foreground tracking-tight">
                Returns & Exchanges
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                You can return or exchange an item within 7 days of delivery. Transparent, seamless, and guided personally by our concierge.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-14 space-y-12 sm:space-y-16">
          {/* Top 4 Key Metric Cards */}
          <FadeIn delay={0.05}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="border-border/60 hover:border-foreground/30 transition-all duration-300 shadow-xs bg-card">
                <CardContent className="p-6 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Return Window
                    </h2>
                    <p className="text-base font-medium text-foreground mt-1">
                      7 Days of Delivery
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Returns & exchanges eligible
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
                      Item Condition
                    </h2>
                    <p className="text-base font-medium text-foreground mt-1">
                      Unworn with Tags
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Original luxury packaging
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 hover:border-foreground/30 transition-all duration-300 shadow-xs bg-card">
                <CardContent className="p-6 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Refund Processing
                    </h2>
                    <p className="text-base font-medium text-foreground mt-1">
                      5 to 10 Working Days
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Back to original payment method
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 hover:border-foreground/30 transition-all duration-300 shadow-xs bg-card">
                <CardContent className="p-6 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Damaged / Wrong Item
                    </h2>
                    <p className="text-base font-medium text-foreground mt-1">
                      48-Hour Notice
                    </p>
                    <p className="text-xs text-primary font-medium mt-0.5">
                      Free replacement or refund
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
                {/* 1. Policy Overview & Conditions */}
                <Card className="border-border/60 shadow-xs bg-card">
                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="space-y-2 pb-4 border-b border-border/40">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <h2 className="font-heading text-xl sm:text-2xl font-normal text-foreground">
                          Returns & Exchanges
                        </h2>
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-1">
                        You can return or exchange an item within 7 days of delivery.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-base font-semibold text-foreground">
                        Conditions
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Items must be unworn, unwashed, with all tags attached and in the original packaging.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {RETURN_CONDITIONS.map((condition, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/40 text-xs sm:text-sm text-foreground/90"
                          >
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span>{condition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 2. How to return or exchange */}
                <Card className="border-border/60 shadow-xs bg-card">
                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h2 className="font-heading text-xl sm:text-2xl font-normal text-foreground">
                        How to return or exchange
                      </h2>
                    </div>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Message us on WhatsApp at{" "}
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
                      with your order number and the item. We will share the next steps.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      {RETURN_STEPS.map((step) => (
                        <div
                          key={step.step}
                          className="rounded-lg border border-border/60 bg-muted/20 p-5 space-y-2.5"
                        >
                          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center">
                            {step.step}
                          </div>
                          <h4 className="font-medium text-foreground text-sm">
                            {step.title}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* 3. Refunds */}
                <Card className="border-border/60 shadow-xs bg-card">
                  <div className="p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <h2 className="font-heading text-xl sm:text-2xl font-normal text-foreground">
                        Refunds
                      </h2>
                    </div>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Once we receive and check the item, we refund it to your original payment method. It can take 5 to 10 working days to show in your account, depending on your bank.
                    </p>

                    <div className="rounded-lg bg-muted/30 border border-border/50 p-4 sm:p-5 text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                      <p>
                        • <strong className="text-foreground font-medium">Card Payments:</strong> Credited automatically back to the original card used at checkout.
                      </p>
                      <p>
                        • <strong className="text-foreground font-medium">Cash on Delivery:</strong> Processed via direct UAE electronic bank transfer once bank details are verified by our finance desk.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* 4. Damaged or wrong item & Return delivery */}
                <Card className="border-border/60 shadow-xs bg-card">
                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="space-y-3 pb-5 border-b border-border/40">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <h2 className="font-heading text-xl sm:text-2xl font-normal text-foreground">
                          Damaged or wrong item
                        </h2>
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        Contact us within 48 hours of delivery with a photo. We will replace it or refund it at no extra cost.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-heading text-lg sm:text-xl font-normal text-foreground">
                        Return delivery
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        Return delivery is paid by the customer, except for damaged or wrong items.
                      </p>

                      <div className="rounded-lg bg-muted/30 border border-border/60 p-4 sm:p-5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        In case of an approved exchange or damaged item replacement, AR Boutique covers all outbound shipment costs for the replacement garment.
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Sticky Concierge, FAQs & Related Links */}
              <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-28">
                {/* Concierge Action Card */}
                <Card className="border-border/60 shadow-xs bg-card">
                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-primary">
                        Concierge Assistance
                      </span>
                      <h2 className="font-heading text-xl font-normal text-foreground">
                        Start a Return
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Have your order number ready. Our concierge will guide you through return pickup and size replacement options.
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
                        Message on WhatsApp
                      </a>
                      <a
                        href={STORE_CONTACT.emailHref}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium border border-input bg-background text-foreground hover:bg-accent transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Email Returns Desk
                      </a>
                    </div>

                    <div className="pt-3 border-t border-border/40 text-xs text-muted-foreground text-center">
                      Concierge hours: Mon–Sat 9:00 AM – 8:00 PM GST
                    </div>
                  </div>
                </Card>

                {/* Frequently Asked Questions */}
                <Card className="border-border/60 shadow-xs bg-card">
                  <div className="p-6 space-y-4">
                    <h2 className="font-heading text-lg font-normal text-foreground">
                      Return FAQs
                    </h2>
                    <Accordion className="w-full">
                      {RETURN_FAQS.map((faq, idx) => (
                        <AccordionItem key={idx} value={`return-faq-${idx}`}>
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
                          href="/policies/shipping"
                          className="inline-flex items-center justify-between w-full text-foreground hover:text-primary transition-colors py-1 group"
                        >
                          <span>Shipping & Delivery</span>
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
