import type { Metadata } from "next";
import Link from "next/link";
import { HeroSlider } from "@/components/store/HeroSlider";
import { SectionHeading } from "@/components/store/SectionHeading";
import { CatalogueGrid, PreviewHeader, PreviewFooter } from "@/features/catalog/components/CatalogueGrid";
import { previewCards } from "@/services/media/preview";

export const metadata: Metadata = {
  title: "AR Boutique | Catalogue Preview",
  robots: { index: false, follow: false },
};

export default function Home() {
  const cards = previewCards();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PreviewHeader />
      <main id="main-content" className="flex-1">
        <HeroSlider />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <p className="text-sm text-muted-foreground mb-3">The AR Boutique · Collection preview</p>
            <h1 className="font-heading text-4xl md:text-5xl leading-tight">Explore the collection</h1>
            <p className="text-base text-muted-foreground mt-4">Discover the supplied styles, colours and photographs. This preview is for browsing; orders are not yet available.</p>
          </div>
          <CatalogueGrid cards={cards.slice(0, 8)} controls={false} />
          <div className="text-center mt-10">
            <Link href="/collections" className="inline-flex min-h-12 items-center justify-center px-8 border border-input text-base hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View all {cards.length} styles</Link>
          </div>
        </section>
        <section className="bg-secondary py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <SectionHeading>A closer look</SectionHeading>
            <p className="text-base text-muted-foreground mt-4">Open a style to explore its full gallery and garment details. Sizes and availability will follow once confirmed.</p>
            <Link href="/collections" className="inline-flex mt-6 min-h-12 items-center px-8 bg-primary text-primary-foreground text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Browse the collection</Link>
          </div>
        </section>
      </main>
      <PreviewFooter />
    </div>
  );
}
