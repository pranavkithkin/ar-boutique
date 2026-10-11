import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findPreviewProduct, previewLabel } from "@/features/catalog/preview-catalogue";
import { previewImages } from "@/services/media/preview";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ProductInfo } from "@/components/store/ProductInfo";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = findPreviewProduct((await params).slug);
  if (!product) notFound();
  return { title: `${previewLabel(product)} | ${product.styleCode} | AR Boutique Preview`, robots: { index: false, follow: false } };
}

export default async function ProductPage({ params }: PageProps) {
  const product = findPreviewProduct((await params).slug);
  if (!product) notFound();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <StoreHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-8 flex flex-wrap gap-2">
          <Link href="/" className="underline underline-offset-4">Home</Link><span aria-hidden="true">/</span>
          <Link href="/collections" className="underline underline-offset-4">Collections</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{product.styleCode}</span>
        </nav>
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="lg:sticky lg:top-6"><ProductGallery key={product.slug} images={previewImages(product)} /></div>
          <ProductInfo product={product} />
        </div>
        <Link href="/collections" className="inline-flex min-h-12 items-center mt-10 underline underline-offset-4">Back to all styles</Link>
      </main>
      <StoreFooter />
    </div>
  );
}
