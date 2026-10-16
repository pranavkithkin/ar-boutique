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
import { MessageSquare, Mail, MapPin, Clock, Truck, ShieldCheck } from "lucide-react"
import { ContactForm } from "@/features/contact/components/ContactForm"
import { AnimatedSection, FadeIn } from "@/components/store/AnimatedSection"
import { STORE_CONTACT } from "@/lib/contact"
import { DEFAULT_FAQS } from "@/features/admin/settings/types"
import { getStoreSettings } from "@/features/admin/settings/actions"

export const metadata: Metadata = {
  title: "Contact Us | AR Boutique",
  description:
    "Get in touch with the AR Boutique concierge team. Sizing advice, order support, and bespoke consultations across the UAE.",
}

const CONCIERGE_CHANNELS = [
  {
    icon: MessageSquare,
    title: "WhatsApp Concierge",
    subtitle: "Instant styling & order chat",
    detail: STORE_CONTACT.whatsapp,
    action: "Chat on WhatsApp",
    href: STORE_CONTACT.whatsappHref,
  },
  {
    icon: Mail,
    title: "Email Assistance",
    subtitle: "Dedicated client responses",
    detail: STORE_CONTACT.email,
    action: "Send an Email",
    href: STORE_CONTACT.emailHref,
  },
  {
    icon: MapPin,
    title: "Private Atelier",
    subtitle: "By private appointment",
    detail: STORE_CONTACT.atelier,
    action: "View Location",
    href: STORE_CONTACT.atelierHref,
  },
]

export default async function ContactPage() {
  const settings = await getStoreSettings()
  const faqs = settings.faqs && settings.faqs.length > 0 ? settings.faqs : DEFAULT_FAQS

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
                  <BreadcrumbPage>Contact Us</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-heading font-normal text-foreground tracking-tight mb-3">
                Contact Us
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                Whether you have an inquiry regarding a bespoke piece, sizing consultation, or order status, our Dubai concierge is at your service.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-16 flex flex-col gap-14 md:gap-20">
          {/* Quick Concierge Cards */}
          <FadeIn delay={0.05}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {CONCIERGE_CHANNELS.map((item, i) => {
                const Icon = item.icon
                return (
                  <Card
                    key={i}
                    className="border-border/60 hover:border-foreground/30 transition-all duration-500 shadow-xs hover:shadow-md bg-card p-6 sm:p-7 flex flex-col justify-between gap-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-heading text-lg sm:text-xl font-normal text-foreground">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {item.subtitle}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-foreground pt-1">
                        {item.detail}
                      </p>
                    </div>

                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1 pt-2"
                    >
                      {item.action} &rarr;
                    </a>
                  </Card>
                )
              })}
            </div>
          </FadeIn>

          {/* Form and FAQ 2-Column Section */}
          <AnimatedSection delay={0.08}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              {/* Left Column: Contact Form */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-normal text-foreground mb-2">
                    Send Us a Message
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Complete the form below and an AR Boutique specialist will respond within 24 business hours.
                  </p>
                </div>

                <div className="rounded-xs border border-border/60 bg-card p-6 sm:p-8 shadow-xs">
                  <ContactForm />
                </div>
              </div>

              {/* Right Column: Concierge Hours & FAQs */}
              <div className="lg:col-span-5 flex flex-col gap-8">
                {/* Concierge Service Hours Card */}
                <div className="rounded-xs bg-muted/50 border border-border/60 p-6 sm:p-7 flex flex-col gap-4">
                  <h3 className="font-heading text-xl font-normal text-foreground">
                    Concierge Hours
                  </h3>
                  <div className="flex flex-col gap-2.5 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-foreground" />
                      <span>Monday – Saturday: 9:00 AM – 8:00 PM GST</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-foreground" />
                      <span>Next-Day Delivery available in Dubai & Abu Dhabi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-foreground" />
                      <span>Complimentary returns within 14 days</span>
                    </div>
                  </div>
                </div>

                {/* Frequently Asked Questions */}
                <div className="flex flex-col gap-4">
                  <h3 className="font-heading text-xl sm:text-2xl font-normal text-foreground">
                    Frequently Asked Questions
                  </h3>
                  <Accordion className="w-full">
                    {faqs.map((faq, i) => (
                      <AccordionItem key={faq.id || i} value={`item-${i}`} className="border-b border-border/60 py-1">
                        <AccordionTrigger className="text-xs sm:text-sm font-medium text-foreground hover:no-underline text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 pb-3">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
