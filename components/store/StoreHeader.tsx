"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Search, User, ShoppingBag, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { CartDrawer } from "@/features/cart/components/CartDrawer"
import { useCartStore } from "@/features/cart/store"

export function StoreHeader() {
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  // Cart state
  const openCart = useCartStore((state) => state.openCart)
  const cartItems = useCartStore((state) => state.items)
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!isHomePage) return
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isHomePage])

  const isActive = !isHomePage || isScrolled || isHovered

  return (
    <header 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`sticky top-0 z-50 w-full transition-colors duration-300 ${isActive ? "bg-background/95 backdrop-blur border-b border-border supports-[backdrop-filter]:bg-background/60 text-foreground" : "border-transparent text-white"}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-32 -z-10 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 pointer-events-none ${isActive ? "opacity-0" : "opacity-100"}`} />
      
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-4 lg:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger render={<button aria-label="Menu" className="p-2 -ml-2" />}>
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
              <div className="flex flex-col gap-6 pt-12 p-6">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-heading hover:opacity-70">Home</Link>
                <Link href="/collections" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-heading hover:opacity-70">Collections</Link>
                <Link href="/journal" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-heading hover:opacity-70">Journal</Link>
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
          <button aria-label="Search" className="p-2">
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex justify-center lg:justify-start lg:flex-none">
          <Link href="/" className="inline-block pt-1">
            <Image src="/images/logo.png" alt="AR Boutique" width={300} height={120} unoptimized className={`h-14 sm:h-16 w-auto transition-all duration-300 ${!isActive ? "brightness-0 invert drop-shadow-md" : ""}`} />
          </Link>
        </div>

        <nav className="hidden lg:flex flex-1 justify-center gap-8 text-[15px] font-normal">
          <Link href="/" className="hover:opacity-70 transition-opacity">Home</Link>
          <Link href="/collections" className="hover:opacity-70 transition-opacity">Collections</Link>
          <Link href="/journal" className="hover:opacity-70 transition-opacity">Journal</Link>
          <Link href="/about" className="hover:opacity-70 transition-opacity">About</Link>
          <Link href="/contact" className="hover:opacity-70 transition-opacity">Contact Us</Link>
        </nav>

        <div className="flex flex-1 lg:flex-none items-center justify-end gap-2 sm:gap-4">
          <button aria-label="Search" className="hidden lg:block p-2">
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <Link href="/account" aria-label="Account" className="hidden sm:block p-2">
            <User className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <button
            onClick={openCart}
            aria-label="Open Shopping Bag"
            className="flex items-center p-2 relative hover:opacity-75 transition-opacity"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {mounted && totalItemCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-semibold tabular-nums animate-in zoom-in-75">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </header>
  )
}
