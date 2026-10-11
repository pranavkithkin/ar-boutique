"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { isNavigationCurrent, mainNavigation } from "@/features/content/preview-pages";

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function StoreHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navigation = (mobile: boolean) => mainNavigation.map(({ href, label }) => (
    <Link key={href} href={href} onClick={() => setOpen(false)}
      aria-current={isNavigationCurrent(pathname, href) ? "page" : undefined}
      className={`${mobile ? "text-xl font-heading" : "text-base"} inline-flex min-h-12 items-center underline-offset-4 hover:underline aria-[current=page]:underline ${focus}`}>
      {label}
    </Link>
  ));

  return (
    <>
      <a href="#main-content" className={`sr-only focus:not-sr-only focus:block bg-background p-3 ${focus}`}>Skip to content</a>
      <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-sm">
        Catalogue preview · Purchases are not available
      </div>
      <header className="border-b border-border bg-background text-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger render={<button type="button" aria-label="Open navigation" className={`inline-flex min-h-12 min-w-12 items-center justify-center ${focus}`} />}>
                <Menu className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              </SheetTrigger>
              <SheetContent side="left" className="w-80 max-w-full">
                <SheetTitle className="px-6 pt-8 text-xl">Explore The AR Boutique</SheetTitle>
                <nav aria-label="Mobile navigation" className="flex flex-col gap-2 px-6 pb-6">
                  {navigation(true)}
                </nav>
                <p className="px-6 text-sm text-muted-foreground">Catalogue preview. Orders are not available.</p>
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" aria-label="AR Boutique home" className={`shrink-0 ${focus}`}>
            <Image src="/images/logo.png" alt="AR Boutique" width={300} height={120}
              unoptimized className="h-16 w-auto object-contain" />
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
            {navigation(false)}
          </nav>
          <div aria-hidden="true" className="flex-1 lg:hidden" />
        </div>
      </header>
    </>
  );
}
