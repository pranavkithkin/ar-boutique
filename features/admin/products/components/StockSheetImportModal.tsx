"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { previewStockSheetAction, applyStockSheetAction } from "../import/actions"
import { ImportPreviewSummary } from "../import/types"
import { formatAED } from "@/lib/money"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
} from "lucide-react"

interface StockSheetImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StockSheetImportModal({
  isOpen,
  onClose,
}: StockSheetImportModalProps) {
  const router = useRouter()
  const [, setFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isApplying, setIsApplying] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState<ImportPreviewSummary | null>(null)
  const [activeTab, setActiveTab] = React.useState<"all" | "new" | "updates" | "errors">("all")
  const [appliedResult, setAppliedResult] = React.useState<{
    createdProducts: number
    createdVariants: number
    updatedVariants: number
  } | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function resetState() {
    setFile(null)
    setIsUploading(false)
    setIsApplying(false)
    setErrorMessage(null)
    setPreview(null)
    setAppliedResult(null)
    setActiveTab("all")
  }

  function handleClose() {
    resetState()
    onClose()
  }

  async function handleFileSelect(selectedFile: File) {
    setFile(selectedFile)
    setErrorMessage(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const res = await previewStockSheetAction(formData)
      if (!res.success || !res.preview) {
        setErrorMessage(res.error || "Failed to parse spreadsheet.")
        setIsUploading(false)
        return
      }

      setPreview(res.preview)
    } catch {
      setErrorMessage("An unexpected error occurred while processing the spreadsheet.")
    } finally {
      setIsUploading(false)
    }
  }

  async function handleApply() {
    if (!preview) return
    setIsApplying(true)
    setErrorMessage(null)

    try {
      const res = await applyStockSheetAction(preview.importId)
      if (!res.success) {
        setErrorMessage(res.error || "Failed to apply changes to database.")
        setIsApplying(false)
        return
      }

      setAppliedResult({
        createdProducts: res.createdProducts ?? 0,
        createdVariants: res.createdVariants ?? 0,
        updatedVariants: res.updatedVariants ?? 0,
      })

      router.refresh()
    } catch {
      setErrorMessage("An unexpected error occurred while applying changes.")
    } finally {
      setIsApplying(false)
    }
  }

  // Filter diffs based on selected preview tab
  const filteredDiffs = (preview?.diffs || []).filter((d) => {
    if (activeTab === "new") return d.isNewProduct || d.isNewColourway || d.isNewVariant
    if (activeTab === "updates") return d.action === "update_variant"
    if (activeTab === "errors") return d.errors.length > 0 || d.warnings.length > 0
    return true
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-4xl bg-card border-border rounded-none p-6 max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-sans font-semibold uppercase tracking-[0.16em]">
            <FileSpreadsheet className="size-3.5" />
            <span>Catalogue Bulk Operations</span>
          </div>
          <DialogTitle className="text-xl font-sans font-bold tracking-tight text-foreground">
            Bulk Edit &amp; Stock Sheet Upload
          </DialogTitle>
          <DialogDescription className="text-xs font-sans text-muted-foreground">
            Upload the client&apos;s stock spreadsheet (.xlsx or .csv) to create new products,
            add colour/size variants, or update prices and stock levels in bulk.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-sans">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SCREEN 1: Success State */}
          {appliedResult ? (
            <div className="py-8 text-center space-y-4">
              <div className="size-12 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h3 className="font-sans text-base font-semibold text-foreground">
                  Spreadsheet Changes Applied Successfully!
                </h3>
                <p className="text-xs font-sans text-muted-foreground mt-1 max-w-md mx-auto">
                  The catalogue and stock ledger have been synchronized with the uploaded spreadsheet.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
                <div className="p-3 bg-muted/40 border border-border">
                  <div className="text-[10px] uppercase font-sans text-muted-foreground">New Products</div>
                  <div className="text-lg font-mono font-bold text-foreground mt-0.5">
                    {appliedResult.createdProducts}
                  </div>
                </div>
                <div className="p-3 bg-muted/40 border border-border">
                  <div className="text-[10px] uppercase font-sans text-muted-foreground">New Variants</div>
                  <div className="text-lg font-mono font-bold text-emerald-600 mt-0.5">
                    +{appliedResult.createdVariants}
                  </div>
                </div>
                <div className="p-3 bg-muted/40 border border-border">
                  <div className="text-[10px] uppercase font-sans text-muted-foreground">Updated SKUs</div>
                  <div className="text-lg font-mono font-bold text-amber-600 mt-0.5">
                    {appliedResult.updatedVariants}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <Button
                  type="button"
                  onClick={handleClose}
                  className="rounded-none text-xs font-sans bg-primary text-primary-foreground px-6"
                >
                  Done &amp; View Catalogue
                </Button>
              </div>
            </div>
          ) : !preview ? (
            /* SCREEN 2: Dropzone Upload Screen */
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const dropped = e.dataTransfer.files?.[0]
                  if (dropped) handleFileSelect(dropped)
                }}
                className="border-2 border-dashed border-border hover:border-primary/60 transition-colors p-10 text-center cursor-pointer bg-muted/20"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileSelect(f)
                  }}
                />

                {isUploading ? (
                  <div className="space-y-3 py-4">
                    <Loader2 className="size-8 text-primary animate-spin mx-auto" />
                    <div className="text-xs font-sans font-medium text-foreground">
                      Reading spreadsheet and calculating diffs...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="size-12 bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
                      <Upload className="size-6" />
                    </div>
                    <div>
                      <span className="text-xs font-sans font-semibold text-foreground">
                        Click to browse or drag and drop your spreadsheet here
                      </span>
                      <p className="text-[11px] font-sans text-muted-foreground mt-1">
                        Supports client stock sheets in <span className="font-mono">.xlsx</span> or{" "}
                        <span className="font-mono">.csv</span> format (up to 5 MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Download Current Catalogue Link */}
              <div className="flex items-center justify-between p-3 bg-muted/40 border border-border text-xs font-sans">
                <span className="text-muted-foreground">Need the current boutique stock sheet?</span>
                <a
                  href="/api/admin/catalogue-export"
                  download
                  className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold"
                >
                  <Download className="size-3.5" />
                  <span>Download Current Catalogue (.xlsx)</span>
                </a>
              </div>

              <div className="p-4 bg-muted/30 border border-border text-xs font-sans space-y-2">
                <div className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                  Supported Features
                </div>
                <ul className="text-muted-foreground text-[11px] space-y-1 list-disc list-inside">
                  <li>
                    <strong className="text-foreground">Existing SKUs:</strong> Automatically updates
                    stock quantities and AED prices with full audit logging in the ledger.
                  </li>
                  <li>
                    <strong className="text-foreground">New Colourways &amp; Sizes:</strong> If you add a
                    new size or colour row to an existing Style code, the new variant will be created
                    under that product.
                  </li>
                  <li>
                    <strong className="text-foreground">New Products:</strong> Brand new style codes will
                    be created in <span className="font-mono text-foreground">Draft</span> mode with all
                    garment details populated.
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            /* SCREEN 3: Diff Preview Screen */
            <div className="space-y-4">
              {/* Preview KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 bg-muted/40 border border-border">
                  <div className="text-[10px] uppercase font-sans text-muted-foreground">Total Rows</div>
                  <div className="text-base font-mono font-bold text-foreground mt-0.5">
                    {preview.totalRows}
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-[10px] uppercase font-sans text-emerald-600">New Products</div>
                  <div className="text-base font-mono font-bold text-emerald-600 mt-0.5">
                    +{preview.productsToCreate}
                  </div>
                </div>

                <div className="p-3 bg-blue-500/5 border border-blue-500/20">
                  <div className="text-[10px] uppercase font-sans text-blue-600">New Variants</div>
                  <div className="text-base font-mono font-bold text-blue-600 mt-0.5">
                    +{preview.variantsToCreate}
                  </div>
                </div>

                <div className="p-3 bg-amber-500/5 border border-amber-500/20">
                  <div className="text-[10px] uppercase font-sans text-amber-600">Updates</div>
                  <div className="text-base font-mono font-bold text-amber-600 mt-0.5">
                    {preview.variantsToUpdate}
                  </div>
                </div>

                <div className="p-3 bg-muted/40 border border-border">
                  <div className="text-[10px] uppercase font-sans text-muted-foreground">Unchanged</div>
                  <div className="text-base font-mono font-bold text-muted-foreground mt-0.5">
                    {preview.unchangedRows}
                  </div>
                </div>
              </div>

              {preview.errorCount > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-sans">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>
                    Found {preview.errorCount} blocking error(s) in the spreadsheet. Please correct
                    them before applying.
                  </span>
                </div>
              )}

              {/* Filter Tabs for Diff Table */}
              <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-sans">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-2.5 py-1 rounded-none border ${
                    activeTab === "all"
                      ? "bg-foreground text-background font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Rows ({preview.diffs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("new")}
                  className={`px-2.5 py-1 rounded-none border ${
                    activeTab === "new"
                      ? "bg-foreground text-background font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  New ({preview.productsToCreate + preview.variantsToCreate})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("updates")}
                  className={`px-2.5 py-1 rounded-none border ${
                    activeTab === "updates"
                      ? "bg-foreground text-background font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Updates ({preview.variantsToUpdate})
                </button>
                {preview.errorCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("errors")}
                    className={`px-2.5 py-1 rounded-none border ${
                      activeTab === "errors"
                        ? "bg-destructive text-destructive-foreground font-semibold"
                        : "text-destructive hover:bg-destructive/10"
                    }`}
                  >
                    Errors ({preview.errorCount})
                  </button>
                )}
              </div>

              {/* Diffs Table */}
              <div className="border border-border max-h-[40vh] overflow-y-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead className="bg-muted/50 border-b border-border text-[10px] uppercase text-muted-foreground font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">Style / SKU</th>
                      <th className="py-2 px-3">Product Name</th>
                      <th className="py-2 px-3">Colour &amp; Size</th>
                      <th className="py-2 px-3 text-right">Stock Diff</th>
                      <th className="py-2 px-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDiffs.map((diff) => {
                      let badgeStyle = "bg-muted text-muted-foreground"
                      if (diff.action === "create_product") {
                        badgeStyle = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      } else if (diff.action === "create_variant" || diff.action === "create_colourway") {
                        badgeStyle = "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      } else if (diff.action === "update_variant") {
                        badgeStyle = "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      } else if (diff.action === "error") {
                        badgeStyle = "bg-destructive/10 text-destructive border-destructive/20"
                      }

                      return (
                        <tr key={diff.rowNumber} className="hover:bg-muted/20">
                          <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">
                            #{diff.rowNumber}
                          </td>
                          <td className="py-2 px-3">
                            <Badge
                              variant="outline"
                              className={`text-[9px] uppercase font-sans font-medium rounded-none px-1 py-0 border ${badgeStyle}`}
                            >
                              {diff.actionLabel}
                            </Badge>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-mono text-xs font-semibold text-foreground">
                              {diff.sku}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              Style: {diff.style}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-foreground line-clamp-1">
                            {diff.productName}
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-foreground">{diff.colourName}</span>
                            {diff.sizeLabel && (
                              <span className="font-mono text-muted-foreground ml-1">
                                ({diff.sizeLabel})
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-xs">
                            {diff.isNewVariant ? (
                              <span className="text-emerald-600 font-semibold">
                                New ({diff.stockAfter ?? 5})
                              </span>
                            ) : diff.stockDelta !== null && diff.stockDelta !== 0 ? (
                              <span
                                className={
                                  diff.stockDelta > 0 ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"
                                }
                              >
                                {diff.stockBefore} &rarr; {diff.stockAfter} (
                                {diff.stockDelta > 0 ? `+${diff.stockDelta}` : diff.stockDelta})
                              </span>
                            ) : (
                              <span className="text-muted-foreground">{diff.stockAfter ?? "—"}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-xs text-foreground">
                            {diff.priceFilsAfter !== null ? formatAED(diff.priceFilsAfter) : "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={preview ? resetState : handleClose}
            disabled={isApplying}
            className="rounded-none text-xs font-sans"
          >
            {preview && !appliedResult ? "Upload Different File" : "Close"}
          </Button>

          {preview && !appliedResult && (
            <Button
              type="button"
              size="sm"
              disabled={!preview.canApply || isApplying}
              onClick={handleApply}
              className="rounded-none text-xs font-sans bg-primary text-primary-foreground min-w-[140px] gap-1.5"
            >
              {isApplying ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Applying Changes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Apply Import ({preview.totalRows} Rows)</span>
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
