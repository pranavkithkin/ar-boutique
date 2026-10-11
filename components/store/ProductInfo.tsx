import { Button } from "@/components/ui/button";
import { previewLabel, previewPrice, type PreviewProduct } from "@/features/catalog/preview-catalogue";
import { ProductAccordions } from "./ProductAccordions";

export function ProductInfo({ product }: { product: PreviewProduct }) {
  return (
    <section aria-labelledby="product-title" className="bg-secondary/50 p-5 sm:p-8 lg:p-10">
      <p className="text-sm text-muted-foreground mb-3">Catalogue preview</p>
      <h1 id="product-title" className="font-heading text-3xl sm:text-4xl leading-tight">{previewLabel(product)}</h1>
      <p className="text-sm text-muted-foreground mt-3 break-all">Style: {product.styleCode}</p>
      <p className="text-2xl font-semibold mt-6">{previewPrice(product).priceLabel}</p>
      <p className="text-sm text-muted-foreground mt-2">Price supplied for review. Tax and delivery terms are awaiting confirmation.</p>
      <dl className="text-base space-y-3 my-8">
        <div className="flex flex-wrap gap-x-3"><dt className="text-muted-foreground">Colour</dt><dd>{product.colour}</dd></div>
        <div className="flex flex-wrap gap-x-3"><dt className="text-muted-foreground">Sizes</dt><dd>Awaiting confirmation</dd></div>
        <div className="flex flex-wrap gap-x-3"><dt className="text-muted-foreground">Availability</dt><dd>Awaiting confirmation</dd></div>
      </dl>
      <Button disabled className="w-full min-h-12 text-base" aria-describedby="preview-purchase-note">Purchases unavailable in preview</Button>
      <p id="preview-purchase-note" className="text-sm text-muted-foreground mt-3 mb-8">This is a catalogue review, not a live store. The display label combines the supplied colour and garment type; the final product name is pending.</p>
      <ProductAccordions product={product} />
    </section>
  );
}
