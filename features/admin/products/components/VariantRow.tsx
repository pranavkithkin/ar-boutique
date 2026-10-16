"use client"

import * as React from "react"
import { AdminProductVariant, AdminSize } from "../types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import {
  adjustVariantStockAction,
  updateVariantAction,
  deleteVariantAction,
} from "../actions"
import {
  Save,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react"

interface VariantRowProps {
  variant: AdminProductVariant
  productId: string
  sizes: AdminSize[]
  onOpenStockModal?: (v: AdminProductVariant) => void
  onVariantUpdated: () => void
}

export function VariantRow({
  variant,
  productId,
  sizes,
  onVariantUpdated,
}: VariantRowProps) {
  const [sku, setSku] = React.useState(variant.sku)
  const [sizeId, setSizeId] = React.useState<string>(variant.size_id || "")
  const [priceAED, setPriceAED] = React.useState<string>(
    (variant.price_fils / 100).toFixed(0)
  )
  const [compareAtAED, setCompareAtAED] = React.useState<string>(
    variant.compare_at_fils ? (variant.compare_at_fils / 100).toFixed(0) : ""
  )
  const [stockOnHand, setStockOnHand] = React.useState<string>(
    variant.on_hand.toString()
  )
  const [isActive, setIsActive] = React.useState<boolean>(variant.is_active)

  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [savedSuccess, setSavedSuccess] = React.useState(false)
  const [rowError, setRowError] = React.useState<string | null>(null)

  // Keep state in sync if parent updates variant
  React.useEffect(() => {
    setSku(variant.sku)
    setSizeId(variant.size_id || "")
    setPriceAED((variant.price_fils / 100).toFixed(0))
    setCompareAtAED(
      variant.compare_at_fils ? (variant.compare_at_fils / 100).toFixed(0) : ""
    )
    setStockOnHand(variant.on_hand.toString())
    setIsActive(variant.is_active)
  }, [variant])

  const initialPriceAED = (variant.price_fils / 100).toFixed(0)
  const initialCompareAED = variant.compare_at_fils
    ? (variant.compare_at_fils / 100).toFixed(0)
    : ""

  const isDirty =
    sku !== variant.sku ||
    sizeId !== (variant.size_id || "") ||
    priceAED !== initialPriceAED ||
    compareAtAED !== initialCompareAED ||
    stockOnHand !== variant.on_hand.toString() ||
    isActive !== variant.is_active

  async function handleSave() {
    setRowError(null)
    setIsSaving(true)

    const parsedPrice = parseFloat(priceAED)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setRowError("Price must be greater than 0.")
      setIsSaving(false)
      return
    }

    const priceFils = Math.round(parsedPrice * 100)
    const compareAtFils = compareAtAED.trim()
      ? Math.round(parseFloat(compareAtAED) * 100)
      : null

    const parsedStock = parseInt(stockOnHand, 10)
    if (isNaN(parsedStock) || parsedStock < 0) {
      setRowError("Stock on hand must be 0 or greater.")
      setIsSaving(false)
      return
    }

    try {
      // 1. Update variant details if changed
      const variantNeedsUpdate =
        sku !== variant.sku ||
        sizeId !== (variant.size_id || "") ||
        priceAED !== initialPriceAED ||
        compareAtAED !== initialCompareAED ||
        isActive !== variant.is_active

      if (variantNeedsUpdate) {
        const res = await updateVariantAction({
          variantId: variant.id,
          productId,
          sku: sku.trim(),
          sizeId: sizeId || null,
          priceFils,
          compareAtFils,
          isActive,
        })

        if (!res.success) {
          setRowError(res.error || "Failed to save variant.")
          setIsSaving(false)
          return
        }
      }

      // 2. Update stock level if changed
      if (parsedStock !== variant.on_hand) {
        const stockRes = await adjustVariantStockAction({
          variantId: variant.id,
          productId,
          newOnHand: parsedStock,
          reason: parsedStock > variant.on_hand ? "restock" : "correction",
        })

        if (!stockRes.success) {
          setRowError(stockRes.error || "Failed to adjust stock.")
          setIsSaving(false)
          return
        }
      }

      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2500)
      onVariantUpdated()
    } catch {
      setRowError("Error saving variant.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to remove variant SKU "${variant.sku}"?`)) {
      return
    }

    setIsDeleting(true)
    setRowError(null)

    try {
      const res = await deleteVariantAction({
        variantId: variant.id,
        productId,
      })

      if (!res.success) {
        setRowError(res.error || "Failed to delete variant.")
        setIsDeleting(false)
        return
      }

      onVariantUpdated()
    } catch {
      setRowError("Error deleting variant.")
      setIsDeleting(false)
    }
  }

  return (
    <div className={`p-3 bg-card border border-border/80 transition-colors ${!isActive ? "opacity-60 bg-muted/20" : ""}`}>
      {rowError && (
        <div className="mb-2 p-2 text-[11px] bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-1.5">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{rowError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* SKU Input */}
        <div className="md:col-span-3">
          <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block md:hidden mb-1">
            Client SKU
          </label>
          <Input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="e.g. AR0478-KR-NP-S"
            className="h-8 text-xs font-mono bg-background border-input rounded-none"
            title="Client SKU exactly as given"
          />
        </div>

        {/* Size Select (shadcn) */}
        <div className="md:col-span-2">
          <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block md:hidden mb-1">
            Size
          </label>
          <Select
            value={sizeId || "none"}
            onValueChange={(val) => setSizeId(val === "none" ? "" : (val ?? ""))}
          >
            <SelectTrigger className="h-8 px-2 text-xs font-sans bg-background border border-input rounded-none text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
              <SelectValue placeholder="No size">
                {sizes.find((s) => s.id === sizeId)?.label || "No size"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              <SelectItem value="none">No size</SelectItem>
              {sizes.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price (AED) */}
        <div className="md:col-span-2">
          <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block md:hidden mb-1">
            Price (AED)
          </label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none">
              AED
            </span>
            <Input
              type="number"
              min="0"
              step="1"
              value={priceAED}
              onChange={(e) => setPriceAED(e.target.value)}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              className="h-8 pl-9 text-xs font-mono bg-background border-input rounded-none"
            />
          </div>
        </div>

        {/* Stock On Hand & Reserved Badge */}
        <div className="md:col-span-3">
          <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block md:hidden mb-1">
            Stock On Hand
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="1"
              value={stockOnHand}
              onChange={(e) => setStockOnHand(e.target.value)}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              className="h-8 w-24 text-xs font-mono bg-background border-input rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              title="Stock on hand"
            />
            <span className="text-[10px] text-muted-foreground">units</span>
            {variant.reserved > 0 && (
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                title={`${variant.reserved} unit(s) reserved for checkout`}
              >
                {variant.reserved} held
              </span>
            )}
          </div>
        </div>

        {/* Active Toggle & Action Buttons */}
        <div className="md:col-span-2 flex items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 mr-1">
            <Checkbox
              id={`active-${variant.id}`}
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(!!checked)}
              className="rounded-none size-3.5"
            />
            <label
              htmlFor={`active-${variant.id}`}
              className="text-[11px] font-sans text-muted-foreground cursor-pointer select-none"
            >
              Active
            </label>
          </div>

          {/* Save Button */}
          <Button
            size="icon-xs"
            variant={isDirty ? "default" : "ghost"}
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={`size-7 rounded-none ${isDirty ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            title="Save variant changes"
          >
            {isSaving ? (
              <Loader2 className="size-3 animate-spin" />
            ) : savedSuccess ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Save className="size-3.5" />
            )}
          </Button>

          {/* Delete Button */}
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleDelete}
            disabled={isDeleting}
            className="size-7 rounded-none text-muted-foreground hover:text-destructive"
            title={variant.first_sold_at ? "Deactivate variant" : "Delete variant"}
          >
            {isDeleting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
