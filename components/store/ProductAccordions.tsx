import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ProductType } from "./ProductInfo"
import { FREE_DELIVERY_MINIMUM_LABEL } from "@/lib/money"

function isValidValue(val?: string | null): boolean {
  if (!val) return false
  const trimmed = val.trim()
  return trimmed !== "" && trimmed !== "-" && trimmed.toLowerCase() !== "null"
}

export function ProductAccordions({ product }: { product: ProductType }) {
  const details = product.details || {}

  // 1. Package Contains
  const packageContains = details["Package Contains"]
  const hasPackageContains = isValidValue(packageContains)

  // 2. Top Group
  const topRows = [
    { label: "Type", value: details["Top Category"] },
    { label: "Fabric", value: details["Top Portal Fabric"] },
    { label: "Pattern", value: details["Top Pattern Type"] },
    { label: "Neckline", value: details["Top Neck Details"] },
    { label: "Sleeves", value: details["Top Sleeve Details"] },
    { label: "Colour", value: details["Top Primary Color"] || product.colour },
  ].filter((r) => isValidValue(r.value))

  // 3. Bottom Group
  const btmRows = [
    { label: "Style", value: details["BTM Style Type"] },
    { label: "Fabric", value: details["BTM Fabric Type"] },
    { label: "Colour", value: details["BTM Primary Color"] },
  ].filter((r) => isValidValue(r.value))

  // 4. Dupatta Group
  const dptRows = [
    { label: "Fabric", value: details["DPT Fabric Type"] },
    { label: "Pattern", value: details["DPT Pattern Type"] },
    { label: "Colour", value: details["DPT Primary Color"] },
  ].filter((r) => isValidValue(r.value))

  const hasAnyDetails =
    hasPackageContains || topRows.length > 0 || btmRows.length > 0 || dptRows.length > 0

  const hasDescription = Boolean(product.description && product.description.trim().length > 0)

  return (
    <Accordion
      multiple
      defaultValue={["details"]}
      className="w-full flex flex-col gap-0 border-b border-border mb-8"
    >
      {/* 1. Specifications & Details (Open by default) */}
      {hasAnyDetails && (
        <AccordionItem value="details" className="border-t border-border">
          <AccordionTrigger className="text-sm sm:text-[15px] font-heading font-medium tracking-wide text-foreground hover:no-underline py-4">
            Details & Specifications
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-1">
            <div className="space-y-6">
              {/* Package Contains */}
              {hasPackageContains && (
                <div className="flex items-baseline gap-4 py-2 border-b border-border/40">
                  <span className="w-28 sm:w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Package Contains
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {packageContains}
                  </span>
                </div>
              )}

              {/* Top / Garment Section */}
              {topRows.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground pb-1 border-b border-border/30">
                    Top / Kurta
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
                    {topRows.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-baseline justify-between sm:justify-start gap-4 py-2 border-b border-border/20"
                      >
                        <span className="w-24 shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="text-sm font-medium text-foreground text-right sm:text-left">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Section */}
              {btmRows.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground pb-1 border-b border-border/30">
                    Bottom / Pants
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
                    {btmRows.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-baseline justify-between sm:justify-start gap-4 py-2 border-b border-border/20"
                      >
                        <span className="w-24 shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="text-sm font-medium text-foreground text-right sm:text-left">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dupatta Section */}
              {dptRows.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground pb-1 border-b border-border/30">
                    Dupatta
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
                    {dptRows.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-baseline justify-between sm:justify-start gap-4 py-2 border-b border-border/20"
                      >
                        <span className="w-24 shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="text-sm font-medium text-foreground text-right sm:text-left">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* 2. Description (Only rendered if available) */}
      {hasDescription && (
        <AccordionItem value="description" className="border-t border-border">
          <AccordionTrigger className="text-sm sm:text-[15px] font-heading font-medium tracking-wide text-foreground hover:no-underline py-4">
            Description
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-5 pt-1 font-sans">
            {product.description}
          </AccordionContent>
        </AccordionItem>
      )}

      {/* 3. Wash Care */}
      <AccordionItem value="wash" className="border-t border-border">
        <AccordionTrigger className="text-sm sm:text-[15px] font-heading font-medium tracking-wide text-foreground hover:no-underline py-4">
          Wash Care
        </AccordionTrigger>
        <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-5 pt-1 space-y-2">
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>Dry clean recommended for delicate embroidered pieces and silk blends.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>Gentle hand wash separately in cold water with mild liquid detergent.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>Do not bleach, wring, or tumble dry.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>Dry flat in shade. Iron on low to medium heat inside out.</span>
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* 4. Delivery & Returns */}
      <AccordionItem value="shipping" className="border-t border-border">
        <AccordionTrigger className="text-sm sm:text-[15px] font-heading font-medium tracking-wide text-foreground hover:no-underline py-4">
          Delivery & Returns
        </AccordionTrigger>
        <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-5 pt-1 space-y-2.5">
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong className="text-foreground font-medium">UAE Fast Delivery:</strong> Dispatches within 24 hours. Doorstep delivery in 2–3 business days.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong className="text-foreground font-medium">Free Shipping:</strong> Complimentary delivery on all orders of {FREE_DELIVERY_MINIMUM_LABEL}.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong className="text-foreground font-medium">14-Day Returns:</strong> Hassle-free exchanges and returns within 14 days of receipt in original condition with tags attached.
            </span>
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* 5. Colour Disclaimer */}
      <AccordionItem value="color" className="border-t border-border border-b-0">
        <AccordionTrigger className="text-sm sm:text-[15px] font-heading font-medium tracking-wide text-foreground hover:no-underline py-4">
          Colour Disclaimer
        </AccordionTrigger>
        <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-5 pt-1">
          Actual product colours may vary slightly due to studio lighting sources and individual screen display calibration.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
