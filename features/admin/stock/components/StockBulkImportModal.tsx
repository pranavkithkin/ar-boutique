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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  previewBulkStockSheetAction,
  applyBulkStockSheetAction,
} from "../actions"
import { BulkStockImportPreview, BulkStockRowStatus } from "../types"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StockBulkImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type FilterTab = "all" | "ready" | "unchanged" | "error"

export function StockBulkImportModal({
  isOpen,
  onClose,
  onSuccess,
}: StockBulkImportModalProps) {
  const router = useRouter()
  const [file, setFile] = React.useState<File | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isApplying, setIsApplying] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState<BulkStockImportPreview | null>(null)
  const [activeTab, setActiveTab] = React.useState<FilterTab>("all")

  // Adjustment metadata
  const [reason, setReason] = React.useState<
    | "restock"
    | "correction"
    | "opening stock"
    | "damaged"
    | "offline sale"
    | "return restock"
    | "COD refused"
  >("restock")
  const [defaultNote, setDefaultNote] = React.useState("")

  const [appliedCount, setAppliedCount] = React.useState<number | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function resetState() {
    setFile(null)
    setIsDragging(false)
    setIsUploading(false)
    setIsApplying(false)
    setErrorMessage(null)
    setPreview(null)
    setActiveTab("all")
    setAppliedCount(null)
    setDefaultNote("")
    setReason("restock")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleClose() {
    if (isUploading || isApplying) return
    resetState()
    onClose()
  }

  async function handleFileSelect(selectedFile: File) {
    setErrorMessage(null)
    setFile(selectedFile)
    setIsUploading(true)

    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const res = await previewBulkStockSheetAction(formData)
      if (!res.success || !res.preview) {
        setErrorMessage(res.error || "Failed to process stock sheet.")
        setIsUploading(false)
        return
      }

      setPreview(res.preview)
      setIsUploading(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred."
      setErrorMessage(msg)
      setIsUploading(false)
    }
  }

  async function handleApply() {
    if (!preview) return
    setIsApplying(true)
    setErrorMessage(null)

    const readyRows = preview.rows.filter((r) => r.status === "ready" && r.variantId)
    if (readyRows.length === 0) {
      setErrorMessage("There are no valid stock adjustments ready to apply.")
      setIsApplying(false)
      return
    }

    try {
      const payload = readyRows.map((r) => ({
        variantId: r.variantId!,
        newOnHand: r.newOnHand,
        delta: r.delta ?? 0,
        currentOnHand: r.currentOnHand ?? 0,
        note: defaultNote ? defaultNote.trim() : undefined,
      }))

      const res = await applyBulkStockSheetAction({
        updates: payload,
        reason,
        defaultNote: defaultNote ? defaultNote.trim() : undefined,
      })

      if (!res.success) {
        setErrorMessage(res.error || "Failed to apply stock updates.")
        setIsApplying(false)
        return
      }

      setAppliedCount(res.updatedCount ?? readyRows.length)
      setIsApplying(false)
      router.refresh()
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred."
      setErrorMessage(msg)
      setIsApplying(false)
    }
  }

  function downloadSampleCsv() {
    const csvContent =
      "SKU,Stock,Notes\n" +
      "TEST-s-2,15,Monthly warehouse recount\n" +
      "TEST-m-7,20,Restock batch A\n"
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "stock_update_sample.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const displayedRows = React.useMemo(() => {
    if (!preview) return []
    if (activeTab === "ready") return preview.rows.filter((r) => r.status === "ready")
    if (activeTab === "unchanged") return preview.rows.filter((r) => r.status === "unchanged")
    if (activeTab === "error") return preview.rows.filter((r) => r.status === "error")
    return preview.rows
  }, [preview, activeTab])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-card border-border rounded-none p-6">
        <DialogHeader className="border-b border-border pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Inventory Management
            </span>
          </div>
          <DialogTitle className="text-xl font-sans font-semibold tracking-tight text-foreground flex items-center justify-between">
            <span>Update Stock from Spreadsheet</span>
          </DialogTitle>
          <DialogDescription className="text-xs font-sans text-muted-foreground">
            Upload an Excel (.xlsx/.xls) or CSV (.csv) containing SKU and new stock levels.
          </DialogDescription>
        </DialogHeader>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 mt-3 flex items-start gap-2 font-sans shrink-0">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* SCREEN 1: Success Confirmation Screen */}
        {appliedCount !== null ? (
          <div className="py-10 text-center space-y-4 flex-1 flex flex-col items-center justify-center">
            <div className="size-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-sans font-semibold text-foreground">
                Stock Levels Successfully Updated
              </h3>
              <p className="text-xs text-muted-foreground font-sans max-w-md mx-auto">
                Updated inventory counts and written audit records for{" "}
                <span className="font-mono font-medium text-foreground">
                  {appliedCount} SKU{appliedCount === 1 ? "" : "s"}
                </span>
                . The stock grid and boutique totals have been refreshed.
              </p>
            </div>
            <div className="pt-2">
              <Button
                type="button"
                onClick={handleClose}
                className="h-9 px-6 rounded-none text-xs font-sans uppercase tracking-[0.08em] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Done &amp; View Stock Grid
              </Button>
            </div>
          </div>
        ) : !preview ? (
          /* SCREEN 2: Upload Dropzone Screen */
          <div className="space-y-5 py-4 flex-1 overflow-y-auto">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const dropped = e.dataTransfer.files?.[0]
                if (dropped) handleFileSelect(dropped)
              }}
              className={cn(
                "border-2 border-dashed p-10 text-center cursor-pointer transition-colors group flex flex-col items-center justify-center gap-3",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-foreground/50 bg-muted/10 hover:bg-muted/20"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFileSelect(f)
                }}
              />

              {isUploading ? (
                <div className="space-y-3 py-4">
                  <Loader2 className="size-8 text-primary animate-spin mx-auto" />
                  <div className="text-xs font-sans font-medium text-foreground">
                    Reading spreadsheet and calculating stock diffs...
                  </div>
                </div>
              ) : (
                <>
                  <div className="size-12 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-foreground/30 transition-colors shadow-2xs">
                    <FileSpreadsheet className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium font-sans text-foreground">
                      <span className="underline underline-offset-2">Click to select file</span>{" "}
                      or drag &amp; drop here
                    </p>
                    <p className="text-[11px] text-muted-foreground font-sans">
                      Excel (.xlsx, .xls) or CSV (.csv) up to 10MB
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Template Info & Sample Download */}
            <div className="p-3.5 border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Flexible Column Matching</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your sheet needs only 2 columns: <code className="font-mono text-foreground font-medium">SKU</code> and{" "}
                  <code className="font-mono text-foreground font-medium">Stock</code> (or Quantity/On Hand).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadSampleCsv}
                className="rounded-none h-8 px-3 text-xs gap-1.5 shrink-0 border-input hover:bg-muted"
              >
                <Download className="size-3.5" />
                <span>Download Sample CSV</span>
              </Button>
            </div>
          </div>
        ) : (
          /* SCREEN 3: Diff Review & Confirm Screen */
          <div className="flex flex-col flex-1 min-h-0 space-y-4 py-3">
            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              <div className="p-2.5 bg-muted/30 border border-border">
                <div className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground">
                  Total Rows
                </div>
                <div className="text-base font-mono font-semibold text-foreground mt-0.5">
                  {preview.totalRows}
                </div>
              </div>

              <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/20">
                <div className="text-[10px] font-sans uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Ready to Update
                </div>
                <div className="text-base font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {preview.readyCount}
                </div>
              </div>

              <div className="p-2.5 bg-muted/30 border border-border">
                <div className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground">
                  Unchanged
                </div>
                <div className="text-base font-mono font-semibold text-muted-foreground mt-0.5">
                  {preview.unchangedCount}
                </div>
              </div>

              <div className="p-2.5 bg-destructive/5 border border-destructive/20">
                <div className="text-[10px] font-sans uppercase tracking-wider text-destructive">
                  Errors / Not Found
                </div>
                <div className="text-base font-mono font-semibold text-destructive mt-0.5">
                  {preview.errorCount}
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 border-b border-border pb-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-3 py-1 text-xs font-sans font-medium transition-colors cursor-pointer",
                  activeTab === "all"
                    ? "border-b-2 border-primary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All Rows ({preview.totalRows})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ready")}
                className={cn(
                  "px-3 py-1 text-xs font-sans font-medium transition-colors cursor-pointer",
                  activeTab === "ready"
                    ? "border-b-2 border-emerald-600 text-emerald-600 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Ready ({preview.readyCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("unchanged")}
                className={cn(
                  "px-3 py-1 text-xs font-sans font-medium transition-colors cursor-pointer",
                  activeTab === "unchanged"
                    ? "border-b-2 border-primary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Unchanged ({preview.unchangedCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("error")}
                className={cn(
                  "px-3 py-1 text-xs font-sans font-medium transition-colors cursor-pointer",
                  activeTab === "error"
                    ? "border-b-2 border-destructive text-destructive font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Errors ({preview.errorCount})
              </button>
            </div>

            {/* Diff Table */}
            <div className="flex-1 overflow-y-auto border border-border bg-card">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-muted/40 border-b border-border sticky top-0 z-10 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center">#</th>
                    <th className="py-2 px-3">SKU</th>
                    <th className="py-2 px-3">Product / Garment</th>
                    <th className="py-2 px-3 text-center">Stock Change</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                        No rows in this filter.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row) => (
                      <tr key={row.rowNumber} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-muted-foreground">
                          {row.rowNumber}
                        </td>
                        <td className="py-2 px-3 font-mono font-medium text-foreground">
                          {row.sku}
                        </td>
                        <td className="py-2 px-3">
                          {row.productName ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground truncate max-w-[200px]">
                                {row.productName}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {row.colourName || "—"} &bull; Size {row.sizeLabel || "—"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Not matched</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {row.status === "error" ? (
                            <span className="text-muted-foreground">
                              {row.newOnHand !== null ? row.newOnHand : "—"}
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <span className="text-muted-foreground">{row.currentOnHand}</span>
                              <ArrowRight className="size-3 text-muted-foreground" />
                              <span className="font-semibold text-foreground">
                                {row.newOnHand}
                              </span>
                              {row.delta !== undefined && row.delta !== 0 && (
                                <span
                                  className={cn(
                                    "text-[10px] px-1 py-0.2 font-medium",
                                    row.delta > 0
                                      ? "text-emerald-600 bg-emerald-500/10"
                                      : "text-amber-600 bg-amber-500/10"
                                  )}
                                >
                                  {row.delta > 0 ? `+${row.delta}` : row.delta}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {row.status === "ready" && (
                            <Badge
                              variant="outline"
                              className="rounded-none text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            >
                              Ready
                            </Badge>
                          )}
                          {row.status === "unchanged" && (
                            <Badge
                              variant="outline"
                              className="rounded-none text-[10px] bg-muted text-muted-foreground border-border"
                            >
                              Unchanged
                            </Badge>
                          )}
                          {row.status === "error" && (
                            <span
                              className="text-[11px] text-destructive truncate inline-block max-w-[220px]"
                              title={row.errorMessage}
                            >
                              {row.errorMessage || "Error"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Adjustment Reason & Note Settings Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border border-border bg-muted/10 shrink-0">
              <div className="space-y-1">
                <Label htmlFor="stock-import-reason" className="text-xs font-medium">
                  Adjustment Reason
                </Label>
                <select
                  id="stock-import-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  disabled={isApplying}
                  className="w-full h-8 text-xs bg-background border border-input rounded-none px-2 focus:ring-1 focus:ring-primary font-sans"
                >
                  <option value="restock">Restock (Received new shipments)</option>
                  <option value="correction">Correction (Audit or stocktake)</option>
                  <option value="opening stock">Opening Stock</option>
                  <option value="offline sale">Offline / In-Store Sale</option>
                  <option value="damaged">Damaged / Written Off</option>
                  <option value="return restock">Customer Return Restock</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="stock-import-note" className="text-xs font-medium">
                  Audit Ledger Note <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="stock-import-note"
                  type="text"
                  placeholder="e.g. Bulk stock upload from warehouse count"
                  value={defaultNote}
                  onChange={(e) => setDefaultNote(e.target.value)}
                  disabled={isApplying}
                  className="h-8 text-xs rounded-none border-input font-sans bg-background"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetState}
                disabled={isApplying}
                className="rounded-none text-xs h-9 border-input gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                <span>Upload Another File</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isApplying}
                  className="rounded-none text-xs h-9 border-input"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleApply}
                  disabled={isApplying || preview.readyCount === 0}
                  className="rounded-none text-xs h-9 px-4 uppercase tracking-[0.08em] font-medium bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Applying Updates...</span>
                    </>
                  ) : (
                    <span>Apply {preview.readyCount} Updates</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
