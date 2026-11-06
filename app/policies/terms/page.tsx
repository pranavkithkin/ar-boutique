import Link from "next/link"
import { LegalBusinessDetails } from "@/components/store/LegalBusinessDetails"
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
import { getStoreSettings } from "@/features/admin/settings/actions"
import { STORE_CONTACT } from "@/lib/contact"

export const metadata: Metadata = {
  title: "Terms & Conditions | AR Boutique",
  description: "Terms for shopping with AR Boutique, including orders, payments, delivery and returns.",
}

export default async function TermsPage() {
  const settings = await getStoreSettings()
  const storeName = settings.store_name || "AR Boutique"
  const storeEmail = settings.store_email || STORE_CONTACT.email
  const returnDays = settings.return_window_days
  const returnWindow = `${returnDays} ${returnDays === 1 ? "day" : "days"}`

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
                  <BreadcrumbPage>Terms & Conditions</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-center font-heading text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl">
              Terms & Conditions
            </h1>
          </div>
        </div>

        <article className="mx-auto mt-10 max-w-3xl space-y-8 px-4 text-sm leading-relaxed text-muted-foreground sm:mt-14 sm:px-6 sm:text-base lg:px-8">
          <div className="space-y-3">
            <p>
              Welcome to {storeName}. These terms explain the conditions for using our website
              and purchasing from our store. By using the website or placing an order, you agree
              to these terms and the policies linked below.
            </p>
            <p className="text-xs">Last updated 6 November 2026</p>
          </div>

          <section aria-labelledby="business-details" className="space-y-3">
            <h2 id="business-details" className="font-heading text-xl font-normal text-foreground sm:text-2xl">Business details</h2>
            <p>This website is operated by The AR Boutique FZE.</p>
            <LegalBusinessDetails />
          </section>

          <section aria-labelledby="using-store" className="space-y-3">
            <h2 id="using-store" className="font-heading text-xl font-normal text-foreground sm:text-2xl">Using our store</h2>
            <p>
              You must have the legal capacity to enter into a purchase agreement. Please use
              the website lawfully and provide accurate account, contact and delivery information.
              Keep your sign-in details secure. You must not misuse the website, interfere with
              its security or submit unlawful or misleading content.
            </p>
          </section>

          <section aria-labelledby="products-prices" className="space-y-3">
            <h2 id="products-prices" className="font-heading text-xl font-normal text-foreground sm:text-2xl">Products and prices</h2>
            <p>
              Prices are shown in UAE dirhams (AED). Delivery charges and any applicable cash
              on delivery fee are displayed at checkout before you place your order. Prices
              and availability may change for future purchases. Product colours may appear
              slightly different depending on your screen.
            </p>
          </section>

          <section aria-labelledby="orders-payment" className="space-y-3">
            <h2 id="orders-payment" className="font-heading text-xl font-normal text-foreground sm:text-2xl">Orders and payments</h2>
            <p>
              Orders are subject to availability and payment verification. Available payment
              methods are shown at checkout. Card payments are handled through Stripe’s hosted
              checkout. Cash on delivery, when offered, is subject to the eligibility conditions,
              limits and fees shown at checkout and requires confirmation by our team.
            </p>
            <p>
              If an error or availability issue prevents us from fulfilling your order, we
              will contact you and arrange a refund for any payment collected for items we
              cannot supply. If you need to change or cancel an order, contact us promptly.
              We will confirm whether your request can be accommodated based on its status.
            </p>
          </section>

          <section aria-labelledby="delivery" className="space-y-3">
            <h2 id="delivery" className="font-heading text-xl font-normal text-foreground sm:text-2xl">Delivery</h2>
            <p>
              We deliver within the United Arab Emirates. Please check your address and phone
              number before ordering so our team and courier can reach you. Delivery information
              and estimated timeframes are available in our{" "}
              <Link href="/policies/shipping" className="text-foreground underline underline-offset-4">Shipping &amp; Delivery Policy</Link>.
              Contact us if your parcel is delayed, missing or damaged.
            </p>
          </section>

          <section aria-labelledby="returns-refunds" className="space-y-3">
            <h2 id="returns-refunds" className="font-heading text-xl font-normal text-foreground sm:text-2xl">Returns and refunds</h2>
            <p>
              Our current return request window is {returnWindow} from delivery, subject to
              the eligibility and condition requirements in our{" "}
              <Link href="/policies/returns" className="text-foreground underline underline-offset-4">Returns &amp; Refunds Policy</Link>.
              Please contact us promptly if an item is damaged, faulty or different from what
              you ordered. Any applicable statutory rights continue to apply.
            </p>
          </section>

          <section aria-labelledby="privacy" className="space-y-3">
            <h2 id="privacy" className="font-heading text-xl font-normal text-foreground sm:text-2xl">Your personal information</h2>
            <p>
              Our{" "}
              <Link href="/policies/privacy" className="text-foreground underline underline-offset-4">Privacy Policy</Link>{" "}
              explains how we collect, use and protect information provided when you use the
              website, create an account, place an order or contact us.
            </p>
          </section>

          <section aria-labelledby="content-links" className="space-y-3">
            <h2 id="content-links" className="font-heading text-xl font-normal text-foreground sm:text-2xl">Website content and external links</h2>
            <p>
              Please respect the intellectual property rights in our photographs, text, designs
              and branding. Reproduction or commercial use requires permission from the rights
              holder. External websites linked from our store have their own terms and privacy
              policies, which you should review when using those services.
            </p>
          </section>

          <section aria-labelledby="applicable-law" className="space-y-3">
            <h2 id="applicable-law" className="font-heading text-xl font-normal text-foreground sm:text-2xl">Applicable law and consumer rights</h2>
            <p>
              These terms are governed by the applicable laws of the United Arab Emirates.
              Nothing in these terms excludes or limits consumer rights, warranties or remedies
              that cannot lawfully be excluded or limited. If any provision is unenforceable,
              the remaining provisions continue to apply to the extent permitted by law.
            </p>
          </section>

          <section aria-labelledby="updates" className="space-y-3">
            <h2 id="updates" className="font-heading text-xl font-normal text-foreground sm:text-2xl">Changes to these terms</h2>
            <p>
              We may update these terms as our services or requirements change. The latest
              version will appear here with a revised date. Updates do not remove rights or
              commitments that already apply to an order you have placed.
            </p>
          </section>

          <section aria-labelledby="contact" className="space-y-3">
            <h2 id="contact" className="font-heading text-xl font-normal text-foreground sm:text-2xl">Contact us</h2>
            <p>
              For questions about these terms or your order, email {storeName} at{" "}
              <a href={`mailto:${storeEmail}`} className="text-foreground underline underline-offset-4">{storeEmail}</a>.
            </p>
            {settings.store_phone && <p>Phone {settings.store_phone}</p>}
            {settings.store_address && <p>{settings.store_address}</p>}
          </section>
        </article>
      </main>
      <StoreFooter />
    </div>
  )
}
