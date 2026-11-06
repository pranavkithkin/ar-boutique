import type { Metadata } from "next"
import { LegalBusinessDetails } from "@/components/store/LegalBusinessDetails"
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
import { getStoreSettings } from "@/features/admin/settings/actions"
import { STORE_CONTACT } from "@/lib/contact"

export const metadata: Metadata = {
  title: "Privacy Policy | AR Boutique",
  description: "How AR Boutique collects, uses and protects your personal information when you shop with us.",
}

export default async function PrivacyPage() {
  const settings = await getStoreSettings()
  const storeName = settings.store_name || "AR Boutique"
  const storeEmail = settings.store_email || STORE_CONTACT.email

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />
      <main className="flex-1 pb-20 sm:pb-24">
        <div className="border-b border-border/40 bg-muted/40 py-10 sm:py-14">
          <div className="mx-auto max-w-[1340px] px-4 sm:px-6 lg:px-8">
            <Breadcrumb className="mb-4 sm:mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Privacy Policy</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-center font-heading text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl">
              Privacy Policy
            </h1>
          </div>
        </div>

        <article className="mx-auto mt-10 max-w-3xl space-y-8 px-4 text-sm leading-relaxed text-muted-foreground sm:mt-14 sm:px-6 sm:text-base lg:px-8">
          <div className="space-y-3">
            <p>
              Your privacy matters to {storeName}. This policy explains how we collect,
              use and protect your personal information when you visit our website,
              create an account or place an order.
            </p>
            <p className="text-xs">Last updated 6 November 2026</p>
          </div>

          <section aria-labelledby="business-details" className="space-y-3">
            <h2 id="business-details" className="font-heading text-xl font-normal text-foreground sm:text-2xl">
              Who is responsible for your information?
            </h2>
            <p>
              The AR Boutique FZE operates this website and is responsible for the personal
              information described in this policy. You can contact us using the email below.
            </p>
            <LegalBusinessDetails />
          </section>

          <section aria-labelledby="personal-information" className="space-y-3">
            <h2 id="personal-information" className="font-heading text-xl font-normal text-foreground sm:text-2xl">
              What personal information do we collect?
            </h2>
            <p>
              When you register, contact us or place an order, we may collect your name,
              email address, phone number, delivery address and order details. We also
              collect the information and photos you choose to provide when requesting a return.
            </p>
          </section>

          <section aria-labelledby="information-use" className="space-y-3">
            <h2 id="information-use" className="font-heading text-xl font-normal text-foreground sm:text-2xl">
              How do we use this information?
            </h2>
            <p>
              We use your information to manage your account, process payments and orders,
              arrange delivery, handle returns and refunds, and respond to customer service
              requests. We also use it to send order updates, protect our store from fraud
              and meet our legal and accounting obligations.
            </p>
          </section>

          <section aria-labelledby="information-sharing" className="space-y-3">
            <h2 id="information-sharing" className="font-heading text-xl font-normal text-foreground sm:text-2xl">
              Do we share your information?
            </h2>
            <p>
              We do not sell, rent or trade your personal information. We share the information
              needed to operate our store with service providers that support hosting,
              customer accounts, payments, emails and delivery. Some providers may process
              information outside the UAE. We may also disclose information when required by law.
            </p>
          </section>

          <section aria-labelledby="payment-details" className="space-y-3">
            <h2 id="payment-details" className="font-heading text-xl font-normal text-foreground sm:text-2xl">
              How are payment details handled?
            </h2>
            <p>
              Card payments are handled through Stripe’s hosted checkout. We do not store
              your full credit or debit card number or card security code on our servers.
              We retain order and payment references to manage your purchase and any refunds.
            </p>
          </section>

          <section aria-labelledby="cookies" className="space-y-3">
            <h2 id="cookies" className="font-heading text-xl font-normal text-foreground sm:text-2xl">
              Cookies and browser storage
            </h2>
            <p>
              We use cookies and browser storage to support sign-in, remember your shopping
              bag and save your preferences. You can manage cookies through your browser
              settings. Blocking them may affect sign-in and other store features.
            </p>
          </section>

          <section aria-labelledby="data-protection" className="space-y-3">
            <h2 id="data-protection" className="font-heading text-xl font-normal text-foreground sm:text-2xl">
              How do we protect and retain your information?
            </h2>
            <p>
              We use technical and organisational measures to protect your personal information.
              We keep it for as long as needed to provide our services, handle enquiries and
              meet applicable legal obligations. Order and invoice records may need to be
              retained after an account is closed.
            </p>
          </section>

          <section aria-labelledby="privacy-contact" className="space-y-3">
            <h2 id="privacy-contact" className="font-heading text-xl font-normal text-foreground sm:text-2xl">
              Your information and how to contact us
            </h2>
            <p>
              To ask about this policy or request access to, correction of or deletion of your
              personal information, email us at{" "}
              <a href={`mailto:${storeEmail}`} className="text-foreground underline underline-offset-4">
                {storeEmail}
              </a>.
              We will review your request in accordance with applicable law and any record-keeping obligations.
            </p>
          </section>

          <section aria-labelledby="policy-updates" className="space-y-3">
            <h2 id="policy-updates" className="font-heading text-xl font-normal text-foreground sm:text-2xl">
              Changes to this policy
            </h2>
            <p>
              We may update this policy when our services or requirements change. Updates
              will be posted on this page with a revised date. Please review it periodically.
            </p>
          </section>
        </article>
      </main>
      <StoreFooter />
    </div>
  )
}
