import Link from "next/link"
import Image from "next/image"
import { TrustStrip } from "@/components/store/TrustStrip"
import { getStoreSettings } from "@/features/admin/settings/actions"
import { JOURNAL_ENABLED } from "@/lib/journal"
import { buildWhatsAppHref } from "@/lib/contact"
import { FloatingWhatsAppButton } from "@/components/store/FloatingWhatsAppButton"
import { WhatsAppIcon } from "@/components/store/WhatsAppIcon"

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

export async function StoreFooter() {
  const settings = await getStoreSettings()
  const instagramUrl = settings.instagram_url?.trim() || null
  const facebookUrl = settings.facebook_url?.trim() || null
  const whatsappNumber = (settings.whatsapp_number || settings.store_phone || "").trim()
  const whatsappUrl = buildWhatsAppHref(whatsappNumber)
  const hasSocial = Boolean(instagramUrl || facebookUrl || whatsappUrl)

  return (
    <footer className="mt-16">
      <FloatingWhatsAppButton href={whatsappUrl || "/contact"} />
      <TrustStrip />
      <div className="bg-secondary pt-16 pb-8 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="mb-6 inline-block">
              <Image src="/images/logo-black.png" alt="AR Boutique" width={2126} height={740} unoptimized className="h-12 sm:h-14 w-auto object-contain" />
            </Link>
            <p className="text-[14px] text-muted-foreground leading-relaxed max-w-xs mt-2">
              Timeless style meets modern elegance. Designed for the way you live.
            </p>

            {/* Social & Concierge Links */}
            {hasSocial && (
              <div className="mt-8">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80 block mb-3.5">
                  Connect With Us
                </span>
                <div className="flex items-center gap-5 text-muted-foreground">
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Follow AR Boutique on Instagram"
                      className="hover:text-foreground transition-colors p-1 -m-1"
                    >
                      <InstagramIcon className="w-5 h-5" />
                    </a>
                  )}
                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Follow AR Boutique on Facebook"
                      className="hover:text-foreground transition-colors p-1 -m-1"
                    >
                      <FacebookIcon className="w-5 h-5" />
                    </a>
                  )}
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Connect with AR Boutique on WhatsApp"
                      className="hover:text-foreground transition-colors p-1 -m-1"
                    >
                      <WhatsAppIcon className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-[14px] font-medium mb-6 text-foreground tracking-wide">Explore</h4>
            <ul className="flex flex-col gap-4 text-[14px] text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">Home</Link></li>
              <li><Link href="/collections" className="hover:text-foreground transition-colors">Collections</Link></li>
              <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
              {JOURNAL_ENABLED && <li><Link href="/journal" className="hover:text-foreground transition-colors">Journal</Link></li>}
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[14px] font-medium mb-6 text-foreground tracking-wide">Customer Care</h4>
            <ul className="flex flex-col gap-4 text-[14px] text-muted-foreground">
              <li><Link href="/track-order" className="hover:text-foreground transition-colors">Track Your Order</Link></li>
              <li><Link href="/policies/shipping" className="hover:text-foreground transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="/policies/returns" className="hover:text-foreground transition-colors">Returns</Link></li>
              <li><Link href="/size-guide" className="hover:text-foreground transition-colors">Size Guide</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[14px] font-medium mb-6 text-foreground tracking-wide">Legal</h4>
            <ul className="flex flex-col gap-4 text-[14px] text-muted-foreground">
              <li><Link href="/policies/terms" className="hover:text-foreground transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/policies/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[13px] text-muted-foreground tracking-wide">
            © 2026 AR BOUTIQUE. All Rights Reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground">VISA</span>
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground">MASTERCARD</span>
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground">APPLE PAY</span>
          </div>
        </div>
        </div>
      </div>
    </footer>
  )
}
