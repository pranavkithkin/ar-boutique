import Link from "next/link"
import Image from "next/image"
import { TrustStrip } from "@/components/store/TrustStrip"

export function StoreFooter() {
  return (
    <footer className="mt-16">
      <TrustStrip />
      <div className="bg-secondary pt-16 pb-8 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="mb-6 inline-block">
              <Image src="/images/logo-black.png" alt="AR Boutique" width={300} height={120} unoptimized className="h-20 sm:h-24 w-auto" />
            </Link>
            <p className="text-[14px] text-muted-foreground leading-relaxed max-w-xs mt-2">
              Timeless style meets modern elegance. Designed for the way you live.
            </p>
          </div>
          <div>
            <h4 className="text-[14px] font-medium mb-6 text-foreground tracking-wide">Explore</h4>
            <ul className="flex flex-col gap-4 text-[14px] text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">Home</Link></li>
              <li><Link href="/collections" className="hover:text-foreground transition-colors">Collections</Link></li>
              <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[14px] font-medium mb-6 text-foreground tracking-wide">Customer Care</h4>
            <ul className="flex flex-col gap-4 text-[14px] text-muted-foreground">
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
