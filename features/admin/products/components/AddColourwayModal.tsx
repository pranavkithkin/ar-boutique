"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createColourwayAction } from "../actions"
import { AdminColour } from "../types"
import { Palette, Loader2, AlertCircle, Plus } from "lucide-react"

interface AddColourwayModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  existingColours: AdminColour[]
  defaultStyleCode?: string
}

export function AddColourwayModal({
  isOpen,
  onClose,
  productId,
  existingColours = [],
  defaultStyleCode = "",
}: AddColourwayModalProps) {
  const router = useRouter()
  const [selectedColourId, setSelectedColourId] = React.useState<string>("")
  const [customColourName, setCustomColourName] = React.useState("")
  const [styleCode, setStyleCode] = React.useState(defaultStyleCode)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Garment detail fields
  const [details, setDetails] = React.useState({
    packageContains: "Set",
    topCategory: "KURTA",
    topFabric: "Cotton",
    topPattern: "Floral",
    topNeck: "Round Neck",
    topSleeve: "Three-Quarter Sleeves",
    btmStyle: "Pant",
    btmFabric: "Cotton",
    dptFabric: "-",
  })

  React.useEffect(() => {
    if (isOpen) {
      setStyleCode(defaultStyleCode)
      setErrorMessage(null)
      setSelectedColourId(existingColours[0]?.id || "__new__")
      setCustomColourName("")
    }
  }, [isOpen, defaultStyleCode, existingColours])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (!styleCode.trim()) {
      setErrorMessage("Style code is required.")
      return
    }

    const isCustom = selectedColourId === "__new__" || !selectedColourId
    if (isCustom && !customColourName.trim()) {
      setErrorMessage("Please enter a new colour name.")
      return
    }

    setIsSubmitting(true)

    try {
      const selectedColourObj = existingColours.find((c) => c.id === selectedColourId)
      const colourName = isCustom ? customColourName.trim() : selectedColourObj?.name || ""

      const payloadDetails: Record<string, string> = {
        "Package Contains": details.packageContains.trim(),
        "Top Category": details.topCategory.trim(),
        "Top Portal Fabric": details.topFabric.trim(),
        "Top Pattern Type": details.topPattern.trim(),
        "Top Neck Details": details.topNeck.trim(),
        "Top Sleeve Details": details.topSleeve.trim(),
        "Top Primary Color": colourName,
        "BTM Style Type": details.btmStyle.trim(),
        "BTM Fabric Type": details.btmFabric.trim(),
        "BTM Primary Color": colourName,
        "DPT Fabric Type": details.dptFabric.trim(),
        "DPT Primary Color": details.dptFabric === "-" ? "-" : colourName,
        "DPT Pattern Type": details.dptFabric === "-" ? "-" : "Plain",
      }

      const res = await createColourwayAction({
        productId,
        colourId: isCustom ? undefined : selectedColourId,
        newColourName: isCustom ? customColourName.trim() : undefined,
        styleCode: styleCode.trim(),
        details: payloadDetails,
      })

      if (!res.success) {
        setErrorMessage(res.error || "Failed to create colourway.")
        setIsSubmitting(false)
        return
      }

      onClose()
      router.refresh()
    } catch {
      setErrorMessage("An unexpected error occurred while adding the colourway.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-card border-border rounded-none p-6 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleCreate} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-sans font-semibold uppercase tracking-[0.16em]">
              <Palette className="size-3.5" />
              <span>Garment Colourways</span>
            </div>
            <DialogTitle className="text-lg font-sans font-bold tracking-tight text-foreground">
              Add New Colourway Variant
            </DialogTitle>
            <DialogDescription className="text-xs font-sans text-muted-foreground">
              Add another colour to this product style. You can select an existing boutique colour
              or define a brand new one.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-2.5 text-xs bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-1.5 font-sans">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Style Code & Colour Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-muted/40 border border-border">
            <div>
              <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">
                Style Code <span className="text-foreground">*</span>
              </label>
              <Input
                value={styleCode}
                onChange={(e) => setStyleCode(e.target.value)}
                placeholder="e.g. J0478"
                className="h-8 text-xs font-mono bg-background border-input rounded-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">
                Select Colour <span className="text-foreground">*</span>
              </label>
              <select
                value={selectedColourId}
                onChange={(e) => setSelectedColourId(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-background border border-input rounded-none text-foreground font-sans"
              >
                {existingColours.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="__new__">+ Add Brand New Colour...</option>
              </select>
            </div>

            {selectedColourId === "__new__" && (
              <div className="sm:col-span-2">
                <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">
                  New Colour Name <span className="text-foreground">*</span>
                </label>
                <Input
                  value={customColourName}
                  onChange={(e) => setCustomColourName(e.target.value)}
                  placeholder="e.g. Blush Pink, Navy Blue, Maroon"
                  className="h-8 text-xs font-sans bg-background border-input rounded-none"
                  required
                />
              </div>
            )}
          </div>

          {/* Garment Details & Specifications */}
          <div className="space-y-3 pt-1">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-foreground block">
              Garment Specifications (Optional)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Package Contains</label>
                <Input
                  value={details.packageContains}
                  onChange={(e) => setDetails((d) => ({ ...d, packageContains: e.target.value }))}
                  className="h-7 text-xs rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Top Category</label>
                <Input
                  value={details.topCategory}
                  onChange={(e) => setDetails((d) => ({ ...d, topCategory: e.target.value }))}
                  className="h-7 text-xs rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Top Fabric</label>
                <Input
                  value={details.topFabric}
                  onChange={(e) => setDetails((d) => ({ ...d, topFabric: e.target.value }))}
                  className="h-7 text-xs rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Top Neck</label>
                <Input
                  value={details.topNeck}
                  onChange={(e) => setDetails((d) => ({ ...d, topNeck: e.target.value }))}
                  className="h-7 text-xs rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Bottom Style</label>
                <Input
                  value={details.btmStyle}
                  onChange={(e) => setDetails((d) => ({ ...d, btmStyle: e.target.value }))}
                  className="h-7 text-xs rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Dupatta Fabric</label>
                <Input
                  value={details.dptFabric}
                  onChange={(e) => setDetails((d) => ({ ...d, dptFabric: e.target.value }))}
                  className="h-7 text-xs rounded-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-none text-xs font-sans"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="rounded-none text-xs font-sans bg-primary text-primary-foreground min-w-[140px] gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  <span>Create Colourway</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
