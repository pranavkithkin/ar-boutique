"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { PreviewProduct } from "@/features/catalog/preview-catalogue";

// Labels are presentation copy; source values are never rewritten.
const labels: Record<string, string> = {
  "Package Contains": "Package contains", "Top Portal Fabric": "Top fabric",
  "Top Primary Color": "Top colour", "Top Pattern Type": "Top pattern",
  "Top Neck Details": "Neck", "Top Sleeve Details": "Sleeves",
  "Top Category": "Top type", "BTM Style Type": "Bottom style",
  "BTM Fabric Type": "Bottom fabric", "BTM Primary Color": "Bottom colour",
  "DPT Fabric Type": "Dupatta fabric", "DPT Primary Color": "Dupatta colour",
  "DPT Pattern Type": "Dupatta pattern",
};

export function ProductAccordions({ product }: { product: PreviewProduct }) {
  const details = product.details.filter(([, value]) => value !== "" && value !== "-");
  return (
    <Accordion defaultValue={["details"]} className="border-t border-border">
      <AccordionItem value="details">
        <AccordionTrigger className="text-base py-4">Garment details</AccordionTrigger>
        <AccordionContent className="text-base pb-5">
          <dl className="space-y-3">
            {details.map(([key, value]) => <div key={key} className="grid grid-cols-2 gap-4"><dt className="text-muted-foreground">{labels[key] ?? key}</dt><dd className="whitespace-pre-wrap break-words">{value}</dd></div>)}
          </dl>
        </AccordionContent>
      </AccordionItem>
      {product.description && <AccordionItem value="description">
        <AccordionTrigger className="text-base py-4">Description</AccordionTrigger>
        <AccordionContent className="text-base pb-5 whitespace-pre-wrap leading-relaxed">{product.description}</AccordionContent>
      </AccordionItem>}
      <AccordionItem value="reference">
        <AccordionTrigger className="text-base py-4">Catalogue references</AccordionTrigger>
        <AccordionContent className="text-base pb-5">
          <p className="text-muted-foreground mb-3">Supplied SKU references only. Sizes have not been confirmed from these codes.</p>
          <ul className="space-y-2">{product.variants.map((variant) => <li key={variant.sku} className="break-all">{variant.sku}</li>)}</ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
