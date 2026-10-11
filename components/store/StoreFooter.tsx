import Link from "next/link";
import Image from "next/image";
import { footerNavigation } from "@/features/content/preview-pages";

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function StoreFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" aria-label="AR Boutique home" className={`inline-block ${focus}`}>
              <Image src="/images/logo.png" alt="AR Boutique" width={300} height={120}
                unoptimized className="h-20 w-auto object-contain" />
            </Link>
            <p className="mt-4 text-base">Catalogue review · Not open for orders</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Product names, sizes, availability and store information are awaiting confirmation.
              Display labels use the supplied colour and garment type.
            </p>
          </div>
          {footerNavigation.map(({ title, links }) => (
            <nav key={title} aria-label={`${title} footer navigation`}>
              <h2 className="mb-3 text-base font-medium">{title}</h2>
              <ul className="space-y-1">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className={`inline-flex min-h-11 items-center text-sm underline underline-offset-4 hover:text-foreground text-muted-foreground ${focus}`}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          © 2026 The AR Boutique · Review preview
        </p>
      </div>
    </footer>
  );
}
