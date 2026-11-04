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
import { cn } from "cn"
import {
  Boxes,
  Layers,
  Save,
  Check,
  Loader2,
  AlertCircle,
  Tag,
  Palette,
  Plus,
  ChevronDown,
} from "lucide-react"
import { AddColourwayModal } from "./AddColourwayModal"

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
  const [isAddColourwayOpen, setIsAddColourwayOpen] = React.useState(false)

  // Active open colourway for accordion behaviour (defaults to first colourway)
  const [openColourwayId, setOpenColourwayId] = React.useState<string | null>(
    () => colourways[0]?.id || null
  )

  // Auto-expand newly added colourways or fall back if current is removed
  const prevColourwayIdsRef = React.useRef(colourways.map((cw) => cw.id))
  React.useEffect(() => {
    const currentIds = colourways.map((cw) => cw.id)
    const newId = currentIds.find(
      (id) => !prevColourwayIdsRef.current.includes(id)
    )
    if (newId) {
      setOpenColourwayId(newId)
    } else if (openColourwayId && !currentIds.includes(openColourwayId)) {
      setOpenColourwayId(currentIds[0] || null)
    }
    prevColourwayIdsRef.current = currentIds
  }, [colourways, openColourwayId])

  function handleToggleColourway(id: string) {
    setOpenColourwayId((prev) => (prev === id ? null : id))
  }

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

  // Synchronise colourwayEdits when colourways list updates
  React.useEffect(() => {
    setColourwayEdits((prev) => {
      const updated = { ...prev }
      let changed = false
      colourways.forEach((cw) => {
        if (!updated[cw.id]) {
          updated[cw.id] = {
            styleCode: cw.style_code,
            details: { ...(cw.details || {}) },
            isSaving: false,
            savedSuccess: false,
            error: null,
          }
          changed = true
        }
      })
      return changed ? updated : prev
    })
  }, [colourways])

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
          <div className="text-xl font-sans font-semibold text-foreground mt-1 tabular-nums">
            {totalVariants} <span className="text-xs text-muted-foreground font-sans font-normal">SKUs</span>
          </div>
        </div>

        <div className="p-3.5 bg-card border border-border">
          <div className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Units On Hand
          </div>
          <div className="text-xl font-sans font-semibold text-foreground mt-1 tabular-nums">
            {totalOnHand} <span className="text-xs text-muted-foreground font-sans font-normal">units</span>
          </div>
        </div>

        <div className="p-3.5 bg-card border border-border">
          <div className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Reserved (Holds)
          </div>
          <div className="text-xl font-sans font-semibold text-foreground mt-1 tabular-nums">
            {totalReserved} <span className="text-xs text-muted-foreground font-sans font-normal">held</span>
          </div>
        </div>

        <div className="p-3.5 bg-card border border-border">
          <div className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Available to Sell
          </div>
          <div className="text-xl font-sans font-semibold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {totalAvailable} <span className="text-xs text-muted-foreground font-sans font-normal">available</span>
          </div>
        </div>
      </div>

      {/* Colourway Variations Header & Add Button */}
      <div className="flex items-center justify-between border-b border-border pb-3 pt-2">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-muted-foreground" />
          <h3 className="font-sans text-sm font-semibold text-foreground uppercase tracking-[0.08em]">
            Product Colourways ({colourways.length})
          </h3>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsAddColourwayOpen(true)}
          className="h-8 text-xs font-sans rounded-none gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-3.5" />
          <span>Add Colourway</span>
        </Button>
      </div>

      {/* Empty State when no colourways exist */}
      {colourways.length === 0 && (
        <div className="p-8 text-center bg-card border border-border space-y-3">
          <Palette className="size-8 text-muted-foreground mx-auto" />
          <h4 className="font-sans text-sm font-semibold text-foreground">
            No Colourways Added Yet
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create your first colourway to start uploading photos, assigning style codes, and adding size variants.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddColourwayOpen(true)}
            className="h-8 text-xs font-sans rounded-none gap-1.5 bg-primary text-primary-foreground"
          >
            <Plus className="size-3.5" />
            <span>Add First Colourway</span>
          </Button>
        </div>
      )}

      {/* Colourways Accordion List */}
      <div className="space-y-3">
        {colourways.map((cw) => {
          const isOpen = openColourwayId === cw.id
          const matchedColour = colours.find((c) => c.id === cw.colour_id)
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

          const cwOnHand = cw.variants.reduce((acc, v) => acc + (v.on_hand || 0), 0)
          const cwReserved = cw.variants.reduce((acc, v) => acc + (v.reserved || 0), 0)
          const cwAvailable = Math.max(0, cwOnHand - cwReserved)

          return (
            <div
              key={cw.id}
              className="bg-card border border-border rounded-none overflow-hidden transition-all shadow-xs"
            >
              {/* Accordion Trigger Header */}
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-controls={`colourway-panel-${cw.id}`}
                id={`colourway-trigger-${cw.id}`}
                onClick={() => handleToggleColourway(cw.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleToggleColourway(cw.id)
                  }
                }}
                className={cn(
                  "w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 select-none cursor-pointer transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isOpen ? "bg-muted/30 border-b border-border" : "hover:bg-muted/20"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 bg-muted/60 border border-border flex items-center justify-center shrink-0">
                    {matchedColour?.swatch_hex ? (
                      <span
                        className="size-4 rounded-full border border-border/80 shadow-xs"
                        style={{ backgroundColor: matchedColour.swatch_hex }}
                      />
                    ) : (
                      <Palette className="size-3.5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-sans text-sm sm:text-base font-semibold text-foreground truncate">
                        Colourway: {cw.colour_name}
                      </h4>
                      {!cw.is_active && (
                        <span className="text-[10px] font-sans uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                          Draft
                        </span>
                      )}
                      {isCwDirty && (
                        <span className="text-[10px] font-sans px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                          Unsaved Changes
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-sans mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-sans font-semibold text-foreground tabular-nums">{cw.images.length}</span>{" "}
                        {cw.images.length === 1 ? "photo" : "photos"}
                      </span>
                      <span className="text-border">•</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="font-sans font-semibold text-foreground tabular-nums">{cw.variants.length}</span>{" "}
                        {cw.variants.length === 1 ? "SKU" : "SKUs"}
                      </span>
                      <span className="text-border">•</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="font-sans font-semibold text-foreground tabular-nums">{cwAvailable}</span> available ({cwOnHand} on hand)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isOpen && (
                    <Button
                      type="button"
                      size="sm"
                      variant={isCwDirty ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSaveColourway(cw.id)
                      }}
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
                      <span>Save Specs</span>
                    </Button>
                  )}

                  <div className="size-8 flex items-center justify-center text-muted-foreground">
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Accordion Content Panel */}
              {isOpen && (
                <div
                  id={`colourway-panel-${cw.id}`}
                  role="region"
                  aria-labelledby={`colourway-trigger-${cw.id}`}
                  className="p-6 space-y-6 bg-card"
                >
                  {editState.error && (
                    <div className="p-2.5 text-xs bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-1.5">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{editState.error}</span>
                    </div>
                  )}

                  {/* Editable Colourway Fields — Style Code + all stock-sheet detail keys */}
                  <div className="p-3.5 bg-muted/30 border border-border/70 space-y-3">
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
                            placeholder="—"
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
              )}
            </div>
          )
        })}
      </div>

      {/* Add Another Colourway Button */}
      <button
        type="button"
        onClick={() => setIsAddColourwayOpen(true)}
        className="w-full py-3.5 border-2 border-dashed border-border hover:border-foreground/40 transition-colors flex items-center justify-center gap-2 text-xs font-sans font-medium text-muted-foreground hover:text-foreground bg-muted/20"
      >
        <Plus className="size-4" />
        <span>Add Another Colourway to Product</span>
      </button>

      {/* Add Colourway Modal */}
      <AddColourwayModal
        isOpen={isAddColourwayOpen}
        onClose={() => setIsAddColourwayOpen(false)}
        productId={productId}
        existingColours={colours}
        defaultStyleCode={colourways[0]?.style_code || ""}
      />

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
