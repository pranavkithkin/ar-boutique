"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Search, User, ShoppingBag, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { CartDrawer } from "@/features/cart/components/CartDrawer"
import { useCartStore } from "@/features/cart/store"
import { CategoryMenu, useMenuCategories } from "@/components/store/CategoryMenu"
import { JOURNAL_ENABLED } from "@/lib/journal"

const subscribeToHydration = () => () => {}

export function StoreHeader() {
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const categories = useMenuCategories()
  const handleMobileMenu = (open: boolean) => {
    setIsMobileMenuOpen(open)
    if (open) void categories.refresh()
  }

  const openCart = useCartStore((state) => state.openCart)
  const cartItems = useCartStore((state) => state.items)
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const mounted = React.useSyncExternalStore(subscribeToHydration, () => true, () => false)

  React.useEffect(() => {
    if (!isHomePage) return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isHomePage])

  const isActive = !isHomePage || isScrolled || isHovered

  return (
    <header
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`sticky top-0 z-50 w-full transition-colors duration-300 ${
        isActive
          ? "bg-background/95 backdrop-blur border-b border-border supports-[backdrop-filter]:bg-background/60 text-foreground"
          : "bg-background/95 backdrop-blur border-b border-border text-foreground lg:bg-transparent lg:border-transparent lg:backdrop-blur-none lg:supports-[backdrop-filter]:bg-transparent lg:text-white"
      }`}
    >
      {/* Top shadow gradient from top of header so text is easily readable on any banner background */}
      <div
        className={`hidden lg:block absolute top-0 left-0 right-0 h-36 -z-10 bg-gradient-to-b from-black/60 via-black/30 to-transparent transition-opacity duration-300 pointer-events-none ${
          isActive ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Size the mobile side columns to their controls so the complete brand always has room. */}
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center px-4 sm:px-6 lg:px-8 lg:grid-cols-[auto_1fr_auto]">
        <div className="flex min-w-0 items-center -ml-2 lg:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={handleMobileMenu}>
            <SheetTrigger render={<button aria-label="Menu" className="flex h-11 w-11 shrink-0 items-center justify-center" />}>
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto text-foreground">
              <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
              <div className="flex flex-col gap-6 pt-12 p-6">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-heading hover:opacity-70">Home</Link>
                <Link href="/collections" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-heading hover:opacity-70">Collections</Link>
                <CategoryMenu {...categories} mobile onNavigate={() => setIsMobileMenuOpen(false)} />
                {JOURNAL_ENABLED && <Link href="/journal" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-heading hover:opacity-70">Journal</Link>}
                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-heading hover:opacity-70">About</Link>
                <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-heading hover:opacity-70">Contact Us</Link>
                <div className="mt-8 flex flex-col gap-4 border-t border-border pt-8">
                  <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-muted-foreground hover:text-foreground">
                    <User className="h-5 w-5" />
                    Account
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <button aria-label="Search" className="flex h-11 w-11 shrink-0 items-center justify-center">
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <Link
          href="/"
          aria-label="AR Boutique home"
          className="flex min-w-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {/* Mobile-only brand logo */}
          <div className="relative h-9 w-36 sm:h-11 sm:w-44 shrink-0 flex items-center justify-center lg:hidden">
            <Image
              src="/images/logo-black.png"
              alt="The AR Boutique"
              width={2126}
              height={740}
              unoptimized
              priority
              className="h-full w-full object-contain"
            />
          </div>

          {/* Desktop logo */}
          <div className="relative hidden lg:flex h-12 w-44 xl:h-14 xl:w-52 shrink-0 items-center justify-center">
            {/* White logo when transparent on homepage top (desktop only) */}
            <Image
              src="/images/logo-white.png"
              alt="AR Boutique"
              width={1169}
              height={432}
              unoptimized
              priority
              className={`h-full w-full object-contain transition-opacity duration-300 ${
                isActive ? "opacity-0 absolute pointer-events-none" : "opacity-100 drop-shadow-md"
              }`}
            />
            {/* Black logo when scrolled, hovered, or on internal pages */}
            <Image
              src="/images/logo-black.png"
              alt="AR Boutique"
              width={2126}
              height={740}
              unoptimized
              priority
              className={`h-full w-full object-contain transition-opacity duration-300 ${
                isActive ? "opacity-100" : "opacity-0 absolute pointer-events-none"
              }`}
            />
          </div>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden lg:flex items-center justify-center gap-4 xl:gap-8 text-[15px] font-normal"
        >
          <Link href="/" className="hover:opacity-70 transition-opacity">Home</Link>
          <CategoryMenu {...categories} />
          {JOURNAL_ENABLED && <Link href="/journal" className="hover:opacity-70 transition-opacity">Journal</Link>}
          <Link href="/about" className="hover:opacity-70 transition-opacity">About</Link>
          <Link href="/contact" className="hover:opacity-70 transition-opacity">Contact Us</Link>
        </nav>

        <div className="flex min-w-0 items-center justify-end sm:gap-1">
          <button aria-label="Search" className="hidden lg:flex h-11 w-11 shrink-0 items-center justify-center">
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <Link href="/account" aria-label="Account" className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center">
            <User className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <button onClick={openCart} aria-label="Open Shopping Bag" className="relative flex h-11 w-11 shrink-0 items-center justify-center hover:opacity-75">
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {mounted && totalItemCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-semibold tabular-nums">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
      <CartDrawer />
    </header>
  )
}
