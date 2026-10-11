import type { Metadata } from "next";
import Link from "next/link";
import { CatalogueGrid, PreviewHeader, PreviewFooter } from "@/features/catalog/components/CatalogueGrid";
import { previewCards } from "@/services/media/preview";

export const metadata: Metadata = {
  title: "Collections | AR Boutique Preview",
  robots: { index: false, follow: false },
};

export default function CollectionPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PreviewHeader />
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-8"><Link href="/" className="underline underline-offset-4">Home</Link> / <span aria-current="page">Collections</span></nav>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="font-heading text-4xl md:text-5xl">The collection</h1>
          <p className="text-base text-muted-foreground mt-4">Browse by colour, garment type or style code. Display labels are provisional; sizes and availability are awaiting confirmation.</p>
        </div>
        <CatalogueGrid cards={previewCards()} />
      </main>
      <PreviewFooter />
    </div>
  );
}
