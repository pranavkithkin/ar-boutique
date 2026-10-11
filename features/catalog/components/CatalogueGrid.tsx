"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { filterPreviewCards, type PreviewCard, type PreviewImage } from "../preview-catalogue";

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

// Review shell intentionally omits inactive cart/search/account controls and
// unapproved delivery/payment claims. Other routes keep their existing shell.
export function PreviewHeader() {
  return (
    <>
      <a href="#main-content" className={`sr-only focus:not-sr-only focus:block p-3 bg-background ${focus}`}>Skip to content</a>
      <div className="bg-primary text-primary-foreground text-center px-4 py-2 text-sm">
        Catalogue preview · Purchases are not available
      </div>
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className={focus} aria-label="AR Boutique home">
            <Image src="/images/logo.png" alt="AR Boutique" width={300} height={120} unoptimized className="h-16 w-auto object-contain" />
          </Link>
          <nav aria-label="Main navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {[["/", "Home"], ["/collections", "Collections"], ["/about", "About"], ["/contact", "Contact"]].map(([href, label]) => (
              <Link key={href} href={href} className={`py-3 underline-offset-4 hover:underline ${focus}`}>{label}</Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}

export function PreviewFooter() {
  return (
    <footer className="bg-secondary border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-5 md:flex-row md:justify-between">
        <div><p className="font-heading text-2xl">The AR Boutique</p><p className="text-sm text-muted-foreground mt-2">Catalogue review · Not open for orders</p></div>
        <div className="max-w-md text-sm text-muted-foreground space-y-3">
          <p>Product names, sizes, availability and store policies are awaiting confirmation. Display labels combine the supplied colour and garment type.</p>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-5 text-foreground">
            {[["/collections", "Browse styles"], ["/contact", "Contact"], ["/journal", "Journal"]].map(([href, label]) => (
              <Link key={href} href={href} className={`underline underline-offset-4 py-2 ${focus}`}>{label}</Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

function CardImage({ image }: { image: PreviewImage }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-[4/5] bg-muted overflow-hidden">
      {!loaded && !failed && <span className="absolute inset-0 motion-safe:animate-pulse bg-muted" aria-hidden="true" />}
      {failed ? <div className="absolute inset-0 grid place-items-center px-4 text-sm text-muted-foreground">Photograph unavailable</div> : (
        <Image src={image.src} alt={image.alt} fill unoptimized sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
          className="object-contain motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" />
      )}
    </div>
  );
}

function PreviewTile({ card }: { card: PreviewCard }) {
  return (
    <Link href={`/collections/${card.slug}`} className={`group block min-w-0 ${focus}`} aria-label={`View ${card.displayLabel}, style ${card.styleCode}`}>
      <Card className="py-0 gap-0 ring-0 bg-transparent">
        <CardImage image={card.image} />
        <CardContent className="px-0 pt-3 pb-2">
          <h3 className="text-base font-medium">{card.displayLabel}</h3>
          <p className="text-sm text-muted-foreground mt-1 break-all">{card.styleCode}</p>
          <p className="text-base font-semibold mt-2">{card.priceLabel}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CatalogueGrid({ cards, controls = true }: { cards: readonly PreviewCard[]; controls?: boolean }) {
  const [query, setQuery] = useState("");
  const [garment, setGarment] = useState("");
  const [colour, setColour] = useState("");
  const [sort, setSort] = useState("source");
  const garments = [...new Set(cards.map((card) => card.garment))];
  const colours = [...new Set(cards.map((card) => card.colour))];
  const filtered = controls ? filterPreviewCards(cards, { query, garment, colour, sort }) : [...cards];
  const reset = () => { setQuery(""); setGarment(""); setColour(""); setSort("source"); };
  const inputClass = `mt-2 block w-full min-h-12 bg-card border border-input px-3 text-base ${focus}`;
  return (
    <div>
      {controls && (
        <div className="bg-secondary p-4 sm:p-6 mb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="text-sm font-medium">Find a style
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Colour, garment or style code" className={inputClass} />
            </label>
            <label className="text-sm font-medium">Garment type
              <select value={garment} onChange={(event) => setGarment(event.target.value)} className={inputClass}>
                <option value="">All types</option>{garments.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Colour
              <select value={colour} onChange={(event) => setColour(event.target.value)} className={inputClass}>
                <option value="">All colours</option>{colours.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Sort
              <select value={sort} onChange={(event) => setSort(event.target.value)} className={inputClass}>
                <option value="source">Catalogue order</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-muted-foreground">{filtered.length} of {cards.length} preview styles</p>
            <Button variant="outline" type="button" onClick={reset} className="min-h-11 text-sm">Reset filters</Button>
          </div>
        </div>
      )}
      {filtered.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-6 lg:gap-x-8">
          {filtered.map((card) => <PreviewTile key={card.slug} card={card} />)}
        </div>
      ) : <div className="py-16 text-center bg-muted"><h2 className="font-heading text-2xl">No matching styles</h2><p className="mt-3 text-base text-muted-foreground">Try another colour or garment type.</p><Button type="button" onClick={reset} className="mt-6 min-h-12">Clear filters</Button></div>}
    </div>
  );
}
