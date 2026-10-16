"use client"

import * as React from "react"
import { AdminSize } from "../types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createVariantAction } from "../actions"
import { Plus, X, Loader2, AlertCircle } from "lucide-react"

interface AddVariantFormProps {
  productId: string
  productColourId: string
  sizes: AdminSize[]
  defaultPriceFils?: number
  onSuccess: () => void
}

export function AddVariantForm({
  productId,
  productColourId,
  sizes,
  defaultPriceFils,
  onSuccess,
}: AddVariantFormProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [sku, setSku] = React.useState("")
  const [sizeId, setSizeId] = React.useState("")
  const [priceAED, setPriceAED] = React.useState(
    defaultPriceFils ? (defaultPriceFils / 100).toFixed(0) : ""
  )
  const [compareAtAED, setCompareAtAED] = React.useState("")
  const [initialStock, setInitialStock] = React.useState("5")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="rounded-none border-dashed border-border h-8 text-xs font-sans gap-1.5 w-full hover:border-foreground"
      >
        <Plus className="size-3.5" />
        <span>Add Variant / SKU</span>
      </Button>
    )
  }

  async function handleSubmit(e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) {
    if (e) e.preventDefault()
    setErrorMessage(null)

    if (!sku.trim()) {
      setErrorMessage("SKU is required.")
      return
    }

    const parsedPrice = parseFloat(priceAED)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMessage("Price must be greater than 0.")
      return
    }

    const priceFils = Math.round(parsedPrice * 100)
    const compareAtFils = compareAtAED.trim()
      ? Math.round(parseFloat(compareAtAED) * 100)
      : null
    const stock = parseInt(initialStock, 10) || 0

    setIsSubmitting(true)

    try {
      const res = await createVariantAction({
        productId,
        productColourId,
        sku: sku.trim(),
        sizeId: sizeId || null,
        priceFils,
        compareAtFils,
        initialStock: stock,
      })

      if (!res.success) {
        setErrorMessage(res.error || "Failed to create variant.")
        setIsSubmitting(false)
        return
      }

      setSku("")
      setSizeId("")
      setCompareAtAED("")
      setInitialStock("5")
      setIsOpen(false)
      onSuccess()
    } catch {
      setErrorMessage("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          handleSubmit(e)
        }
      }}
      className="p-4 bg-muted/40 border border-border space-y-4 rounded-none"
    >
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <span className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-foreground">
          Add Variant to Colourway
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground p-0.5"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {errorMessage && (
        <div className="p-2 text-xs bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-1.5">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* SKU */}
        <div>
          <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">
            SKU <span className="text-foreground">*</span>
          </label>
          <Input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="AR0478-KR-NP-XS"
            className="h-8 text-xs font-mono bg-background border-input rounded-none"
          />
        </div>

        {/* Size */}
        <div>
          <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">
            Size
          </label>
          <select
            value={sizeId}
            onChange={(e) => setSizeId(e.target.value)}
            className="h-8 px-2 text-xs font-sans bg-background border border-input rounded-none text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">No size</option>
            {sizes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price (AED) */}
        <div>
          <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">
            Price (AED) <span className="text-foreground">*</span>
          </label>
          <Input
            type="number"
            min="0"
            step="1"
            value={priceAED}
            onChange={(e) => setPriceAED(e.target.value)}
            placeholder="158"
            className="h-8 text-xs font-mono bg-background border-input rounded-none"
          />
        </div>

        {/* Compare At (AED) */}
        <div>
          <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">
            Compare At (AED)
          </label>
          <Input
            type="number"
            min="0"
            step="1"
            value={compareAtAED}
            onChange={(e) => setCompareAtAED(e.target.value)}
            placeholder="Optional"
            className="h-8 text-xs font-mono bg-background border-input rounded-none"
          />
        </div>

        {/* Initial Stock */}
        <div>
          <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">
            Initial Stock
          </label>
          <Input
            type="number"
            min="0"
            step="1"
            value={initialStock}
            onChange={(e) => setInitialStock(e.target.value)}
            className="h-8 text-xs font-mono bg-background border-input rounded-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-8 text-xs font-sans rounded-none"
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-8 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <span>Create Variant</span>
          )}
        </Button>
      </div>
    </div>
  )
}
