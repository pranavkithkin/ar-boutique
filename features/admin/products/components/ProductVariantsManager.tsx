"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AdminProductColourway,
  AdminProductVariant,
  AdminSize,
  AdminColour,
} from "../types"
import { VariantRow } from "./VariantRow"
import { AddVariantForm } from "./AddVariantForm"
import { StockAdjustmentModal } from "./StockAdjustmentModal"
import { ColourwayImageManager } from "./ColourwayImageManager"
import { updateColourwayAction } from "../actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Boxes,
  Layers,
  Save,
  Check,
  Loader2,
  AlertCircle,
  Tag,
  Palette,
} from "lucide-react"

interface ProductVariantsManagerProps {
  productId: string
  colourways: AdminProductColourway[]
  sizes: AdminSize[]
  colours?: AdminColour[]
}

export function ProductVariantsManager({
  productId,
  colourways,
  sizes,
  colours = [],
}: ProductVariantsManagerProps) {
  const router = useRouter()
  const [stockModalVariant, setStockModalVariant] =
    React.useState<AdminProductVariant | null>(null)

  // All detail keys exactly as stored in product_colours.details (per ARCHITECTURE.md)
  const DETAIL_KEYS = [
    "Package Contains",
    "Top Category",
    "Top Portal Fabric",
    "Top Pattern Type",
    "Top Neck Details",
    "Top Sleeve Details",
    "Top Primary Color",
    "BTM Style Type",
    "BTM Fabric Type",
    "BTM Primary Color",
    "DPT Fabric Type",
    "DPT Pattern Type",
    "DPT Primary Color",
  ] as const

  // Style code + full details record per colourway
  const [colourwayEdits, setColourwayEdits] = React.useState<
    Record<
      string,
      {
        styleCode: string
        details: Record<string, string>
        isSaving: boolean
        savedSuccess: boolean
        error: string | null
      }
    >
  >(() => {
    const init: Record<string, any> = {}
    colourways.forEach((cw) => {
      init[cw.id] = {
        styleCode: cw.style_code,
        details: { ...(cw.details || {}) },
        isSaving: false,
        savedSuccess: false,
        error: null,
      }
    })
    return init
  })

  // Calculate totals across all variants
  const totalVariants = colourways.reduce(
    (acc, cw) => acc + cw.variants.length,
    0
  )
  const totalOnHand = colourways.reduce(
    (acc, cw) =>
      acc + cw.variants.reduce((vAcc, v) => vAcc + (v.on_hand || 0), 0),
    0
  )
  const totalReserved = colourways.reduce(
    (acc, cw) =>
      acc + cw.variants.reduce((vAcc, v) => vAcc + (v.reserved || 0), 0),
    0
  )
  const totalAvailable = Math.max(0, totalOnHand - totalReserved)

  async function handleSaveColourway(cwId: string) {
    const edit = colourwayEdits[cwId]
    if (!edit) return

    setColourwayEdits((prev) => ({
      ...prev,
      [cwId]: { ...prev[cwId], isSaving: true, error: null },
    }))

    // Pass details exactly as typed — values as written (ADR-029)
    const details: Record<string, string> = {}
    Object.entries(edit.details).forEach(([k, v]) => {
      if (v.trim() !== "") details[k] = v
    })

    try {
      const res = await updateColourwayAction({
        colourwayId: cwId,
        productId,
        styleCode: edit.styleCode,
        details,
      })

      if (!res.success) {
        setColourwayEdits((prev) => ({
          ...prev,
          [cwId]: { ...prev[cwId], isSaving: false, error: res.error || "Failed to update." },
        }))
        return
      }

      setColourwayEdits((prev) => ({
        ...prev,
        [cwId]: { ...prev[cwId], isSaving: false, savedSuccess: true },
      }))

      setTimeout(() => {
        setColourwayEdits((prev) => ({
          ...prev,
          [cwId]: { ...prev[cwId], savedSuccess: false },
        }))
      }, 2500)

      router.refresh()
    } catch {
      setColourwayEdits((prev) => ({
        ...prev,
        [cwId]: { ...prev[cwId], isSaving: false, error: "Error updating colourway." },
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-card border border-border">
          <div className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Total Variants
          </div>
          <div className="text-xl font-mono font-medium text-foreground mt-1">
            {totalVariants} <span className="text-xs text-muted-foreground font-sans">SKUs</span>
          </div>
        </div>

        <div className="p-3.5 bg-card border border-border">
          <div className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Units On Hand
          </div>
          <div className="text-xl font-mono font-medium text-foreground mt-1">
            {totalOnHand} <span className="text-xs text-muted-foreground font-sans">units</span>
          </div>
        </div>

        <div className="p-3.5 bg-card border border-border">
          <div className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Reserved (Holds)
          </div>
          <div className="text-xl font-mono font-medium text-foreground mt-1">
            {totalReserved} <span className="text-xs text-muted-foreground font-sans">held</span>
          </div>
        </div>

        <div className="p-3.5 bg-card border border-border">
          <div className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Available to Sell
          </div>
          <div className="text-xl font-mono font-medium text-emerald-600 dark:text-emerald-400 mt-1">
            {totalAvailable} <span className="text-xs text-muted-foreground font-sans">available</span>
          </div>
        </div>
      </div>

      {/* Colourways & Variants Cards */}
      {colourways.map((cw) => {
        const editState = colourwayEdits[cw.id] || {
          styleCode: cw.style_code,
          details: { ...(cw.details || {}) },
          isSaving: false,
          savedSuccess: false,
          error: null,
        }

        const isCwDirty =
          editState.styleCode !== cw.style_code ||
          DETAIL_KEYS.some(
            (k) => (editState.details[k] ?? "") !== (cw.details?.[k] ?? "")
          )

        return (
          <div
            key={cw.id}
            className="bg-card border border-border rounded-none overflow-hidden space-y-5 p-6"
          >
            {/* Colourway Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="size-7 bg-muted/60 border border-border flex items-center justify-center">
                  <Palette className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-semibold text-foreground">
                    Colourway: {cw.colour_name}
                  </h3>
                  <p className="text-[11px] font-sans text-muted-foreground">
                    Client style code and garment specifications
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isCwDirty ? "default" : "outline"}
                  onClick={() => handleSaveColourway(cw.id)}
                  disabled={!isCwDirty || editState.isSaving}
                  className={`h-8 text-xs font-sans rounded-none gap-1.5 ${
                    isCwDirty ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  {editState.isSaving ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : editState.savedSuccess ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  <span>Save Colourway Specs</span>
                </Button>
              </div>
            </div>

            {editState.error && (
              <div className="p-2.5 text-xs bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-1.5">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{editState.error}</span>
              </div>
            )}

            {/* Editable Colourway Fields — Style Code + all stock-sheet detail keys */}
            <div className="p-3.5 bg-muted/30 border border-border/70 space-y-3">
              {/* Style Code row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="md:col-span-1">
                  <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">
                    Style Code <span className="text-foreground">*</span>
                  </label>
                  <Input
                    value={editState.styleCode}
                    onChange={(e) =>
                      setColourwayEdits((prev) => ({
                        ...prev,
                        [cw.id]: { ...prev[cw.id], styleCode: e.target.value },
                      }))
                    }
                    placeholder="e.g. J0478"
                    className="h-8 text-xs font-mono bg-background border-input rounded-none"
                  />
                </div>
              </div>

              {/* Dynamic detail key fields — exact stock-sheet keys as stored (ADR-029) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {DETAIL_KEYS.map((key) => (
                  <div key={key}>
                    <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">
                      {key}
                    </label>
                    <Input
                      value={editState.details[key] ?? ""}
                      onChange={(e) =>
                        setColourwayEdits((prev) => ({
                          ...prev,
                          [cw.id]: {
                            ...prev[cw.id],
                            details: {
                              ...prev[cw.id].details,
                              [key]: e.target.value,
                            },
                          },
                        }))
                      }
                      placeholder={`—`}
                      className="h-8 text-xs font-sans bg-background border-input rounded-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Media & Images Management */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans font-semibold uppercase tracking-[0.1em] text-foreground">
                    Garment Photos & Media
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    ({cw.images.length} {cw.images.length === 1 ? "photo" : "photos"})
                  </span>
                </div>
              </div>

              <ColourwayImageManager
                productId={productId}
                productColourId={cw.id}
                colourName={cw.colour_name}
                images={cw.images}
                onImagesChanged={() => router.refresh()}
              />
            </div>

            {/* Variants & Stock Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans font-semibold uppercase tracking-[0.1em] text-foreground">
                    Variant SKUs & Inventory Stock
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    ({cw.variants.length} {cw.variants.length === 1 ? "SKU" : "SKUs"})
                  </span>
                </div>
              </div>

              {/* Variant Rows Header (Desktop) */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-1.5 bg-muted/60 text-[10px] font-sans uppercase tracking-wider text-muted-foreground font-medium">
                <div className="col-span-3">Client SKU</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Price (AED)</div>
                <div className="col-span-3">Stock On Hand</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Variant Rows */}
              <div className="space-y-2">
                {[...cw.variants]
                  .sort((a, b) => {
                    const sizeA = sizes.find((s) => s.id === a.size_id)
                    const sizeB = sizes.find((s) => s.id === b.size_id)
                    const sortA = sizeA?.sort ?? 999
                    const sortB = sizeB?.sort ?? 999
                    if (sortA !== sortB) return sortA - sortB
                    return (a.sku || "").localeCompare(b.sku || "")
                  })
                  .map((v) => (
                    <VariantRow
                      key={v.id}
                      variant={v}
                      productId={productId}
                      sizes={sizes}
                      onOpenStockModal={(targetVariant) =>
                        setStockModalVariant(targetVariant)
                      }
                      onVariantUpdated={() => router.refresh()}
                    />
                  ))}
              </div>

              {/* Inline Add Variant Form */}
              <div className="pt-2">
                <AddVariantForm
                  productId={productId}
                  productColourId={cw.id}
                  sizes={sizes}
                  defaultPriceFils={cw.variants[0]?.price_fils}
                  onSuccess={() => router.refresh()}
                />
              </div>
            </div>
          </div>
        )
      })}

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={!!stockModalVariant}
        onClose={() => setStockModalVariant(null)}
        variant={stockModalVariant}
        productId={productId}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
