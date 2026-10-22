"use client"

import * as React from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Field,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { StoreButton } from "@/components/store/StoreButton"
import { formatAED } from "@/lib/money"
import {
  RotateCcw,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
} from "lucide-react"
import type { AccountOrder, AccountOrderItem } from "../types"
import {
  evaluateOrderReturnEligibility,
  type OrderForEligibility,
} from "../returns/eligibility"
import {
  RETURN_REASONS,
  type ReturnReason,
} from "../returns/schemas"
import {
  submitCustomerReturnAction,
  uploadReturnPhotoAction,
} from "../returns/actions"

interface ReturnRequestModalProps {
  isOpen: boolean
  onClose: () => void
  orders: AccountOrder[]
  preselectedOrderId?: string
  onReturnSubmitted: (returnNumber: string) => void
}

interface SelectedItemState {
  orderItemId: string
  quantity: number
  reason: ReturnReason
  unitPriceFils: number
  productName: string
  colourName: string
  sizeLabel: string
  sku: string
  styleCode?: string
  mediaKey?: string
  imageSrc?: string
}

interface UploadedPhoto {
  mediaKey: string
  url: string
}

interface ReturnRequestFormProps {
  deliveredOrders: AccountOrder[]
  selectedOrderId: string
  onSelectOrderId: (orderId: string) => void
  onClose: () => void
  onReturnSubmitted: (returnNumber: string) => void
}

function ReturnRequestForm({
  deliveredOrders,
  selectedOrderId,
  onSelectOrderId,
  onClose,
  onReturnSubmitted,
}: ReturnRequestFormProps) {
  const activeOrder = React.useMemo(() => {
    return deliveredOrders.find((o) => o.id === selectedOrderId) || null
  }, [deliveredOrders, selectedOrderId])

  // Evaluate eligibility for this order
  const eligibility = React.useMemo(() => {
    if (!activeOrder) return null
    const orderForCheck: OrderForEligibility = {
      id: activeOrder.id,
      orderNumber: activeOrder.orderNumber,
      status: activeOrder.status,
      deliveredAt: activeOrder.date,
      createdAt: activeOrder.date,
      items: activeOrder.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
      })),
    }
    return evaluateOrderReturnEligibility(orderForCheck)
  }, [activeOrder])

  // Form states initialized clean per key
  const [selectedItems, setSelectedItems] = React.useState<Map<string, SelectedItemState>>(
    new Map()
  )
  const [customerComment, setCustomerComment] = React.useState("")
  const [photos, setPhotos] = React.useState<UploadedPhoto[]>([])
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false)

  // COD Bank Details
  const isCod = activeOrder?.paymentMethod === "cod"
  const [bankName, setBankName] = React.useState("")
  const [accountHolderName, setAccountHolderName] = React.useState("")
  const [iban, setIban] = React.useState("")

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [successReturnNumber, setSuccessReturnNumber] = React.useState<string | null>(null)

  // Handle item toggle
  const toggleItem = (item: AccountOrderItem, maxReturnable: number) => {
    setSelectedItems((prev) => {
      const next = new Map(prev)
      if (next.has(item.id)) {
        next.delete(item.id)
      } else {
        next.set(item.id, {
          orderItemId: item.id,
          quantity: Math.min(1, maxReturnable),
          reason: RETURN_REASONS[0],
          unitPriceFils: item.priceFils,
          productName: item.productName,
          colourName: item.colourName,
          sizeLabel: item.sizeLabel,
          sku: item.styleCode,
          styleCode: item.styleCode,
          imageSrc: item.imageSrc,
        })
      }
      return next
    })
  }

  const updateItemQuantity = (itemId: string, qty: number, maxReturnable: number) => {
    const validQty = Math.max(1, Math.min(qty, maxReturnable))
    setSelectedItems((prev) => {
      const next = new Map(prev)
      const current = next.get(itemId)
      if (current) {
        next.set(itemId, { ...current, quantity: validQty })
      }
      return next
    })
  }

  const updateItemReason = (itemId: string, reason: ReturnReason) => {
    setSelectedItems((prev) => {
      const next = new Map(prev)
      const current = next.get(itemId)
      if (current) {
        next.set(itemId, { ...current, reason })
      }
      return next
    })
  }

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (photos.length >= 5) {
      setErrorMessage("You can attach up to 5 photos per return request.")
      return
    }

    setIsUploadingPhoto(true)
    setErrorMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await uploadReturnPhotoAction(formData)

      if (res.success && res.mediaKey) {
        setPhotos((prev) => [
          ...prev,
          {
            mediaKey: res.mediaKey!,
            url: res.url || URL.createObjectURL(file),
          },
        ])
      } else {
        setErrorMessage(res.error || "Failed to upload photo. Please try again.")
      }
    } catch {
      setErrorMessage("An unexpected error occurred during photo upload.")
    } finally {
      setIsUploadingPhoto(false)
      e.target.value = ""
    }
  }

  const removePhoto = (mediaKey: string) => {
    setPhotos((prev) => prev.filter((p) => p.mediaKey !== mediaKey))
  }

  // Calculate total refund estimate
  const totalEstimatedRefundFils = React.useMemo(() => {
    let sum = 0
    selectedItems.forEach((it) => {
      sum += it.unitPriceFils * it.quantity
    })
    return sum
  }, [selectedItems])

  // Handle Submission
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!activeOrder) {
      setErrorMessage("Please select a delivered order.")
      return
    }

    if (selectedItems.size === 0) {
      setErrorMessage("Please select at least one garment piece to return.")
      return
    }

    // Validate COD bank details
    if (isCod) {
      if (!bankName.trim()) {
        setErrorMessage("Please enter your Bank Name for the refund transfer.")
        return
      }
      if (!accountHolderName.trim()) {
        setErrorMessage("Please enter the Account Beneficiary Name.")
        return
      }
      const cleanIban = iban.replace(/\s+/g, "").toUpperCase()
      if (!cleanIban.startsWith("AE") || cleanIban.length !== 23) {
        setErrorMessage(
          "Please enter a valid 23-character UAE IBAN starting with 'AE'."
        )
        return
      }
    }

    setIsSubmitting(true)

    try {
      const itemsPayload = Array.from(selectedItems.values()).map((it) => ({
        orderItemId: it.orderItemId,
        productName: it.productName,
        colourName: it.colourName,
        styleCode: it.styleCode,
        sizeLabel: it.sizeLabel,
        sku: it.sku,
        unitPriceFils: it.unitPriceFils,
        quantity: it.quantity,
        reason: it.reason,
        mediaKey: it.mediaKey,
      }))

      const res = await submitCustomerReturnAction({
        orderId: activeOrder.id,
        isCodOrder: isCod,
        items: itemsPayload,
        customerComment: customerComment.trim() || undefined,
        photoKeys: photos.map((p) => p.mediaKey),
        bankName: isCod ? bankName.trim() : undefined,
        accountHolderName: isCod ? accountHolderName.trim() : undefined,
        iban: isCod ? iban.replace(/\s+/g, "").toUpperCase() : undefined,
      })

      if (res.success && res.returnNumber) {
        setSuccessReturnNumber(res.returnNumber)
        onReturnSubmitted(res.returnNumber)
      } else {
        setErrorMessage(res.error || "Failed to submit return request.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit return."
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successReturnNumber) {
    return (
      <div className="py-8 text-center space-y-5 animate-in fade-in-50">
        <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-sans font-semibold text-foreground">
            Return Request Submitted
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Your return request has been assigned reference number:
          </p>
          <div className="inline-block px-4 py-2 bg-muted border border-border rounded-xs font-mono font-semibold text-base text-foreground tracking-wider">
            {successReturnNumber}
          </div>
        </div>

        <div className="p-4 bg-muted/30 border border-border/60 rounded-xs text-left max-w-md mx-auto space-y-2.5 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="font-semibold text-foreground">1. Courier Dispatch:</span>
            <span>Our courier partner will contact you within 1-2 business days to collect the sealed package.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-foreground">2. Inspection:</span>
            <span>Garments are inspected at our boutique atelier for tags and unworn condition.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-foreground">3. Refund:</span>
            <span>
              {isCod
                ? "Direct UAE bank transfer will be processed to your provided IBAN."
                : "Card payment reversal will credit your original payment card."}
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <StoreButton
            type="button"
            onClick={onClose}
            className="h-10 px-8 text-xs uppercase tracking-widest"
          >
            Done
          </StoreButton>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmitReturn} className="space-y-6 pt-2">
      {errorMessage && (
        <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xs flex items-start gap-2 leading-relaxed animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Order Selector */}
      {deliveredOrders.length > 1 ? (
        <div className="space-y-1.5">
          <label className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Select Delivered Order *
          </label>
          <select
            value={selectedOrderId}
            onChange={(e) => onSelectOrderId(e.target.value)}
            className="w-full h-10 px-3 text-xs bg-background border border-border rounded-xs focus:outline-none focus:ring-1 focus:ring-primary font-sans"
          >
            {deliveredOrders.map((ord) => (
              <option key={ord.id} value={ord.id}>
                {ord.orderNumber} — Delivered on {ord.date} ({ord.items.length} items)
              </option>
            ))}
          </select>
        </div>
      ) : activeOrder ? (
        <div className="p-3 bg-muted/20 border border-border/60 rounded-xs flex items-center justify-between text-xs">
          <div>
            <span className="font-medium text-foreground">Order: </span>
            <span className="font-mono text-foreground font-semibold">{activeOrder.orderNumber}</span>
            <span className="text-muted-foreground"> • Delivered {activeOrder.date}</span>
          </div>
          {eligibility?.daysRemaining !== undefined && (
            <span className="text-[11px] text-emerald-600 font-medium">
              {eligibility.daysRemaining} days remaining in return window
            </span>
          )}
        </div>
      ) : (
        <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-xs">
          No delivered orders found in your account history.
        </div>
      )}

      {/* Item Selection Section */}
      {activeOrder && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Select Garments to Return *
            </span>
            <span className="text-[11px] text-muted-foreground">
              {selectedItems.size} piece(s) selected
            </span>
          </div>

          <div className="space-y-3 border border-border/70 rounded-xs divide-y divide-border/50 overflow-hidden">
            {activeOrder.items.map((item) => {
              const itemElig = eligibility?.items.find((e) => e.orderItemId === item.id)
              const isEligible = itemElig ? itemElig.isEligible : true
              const maxReturnable = itemElig ? itemElig.maxReturnableQuantity : item.quantity
              const isSelected = selectedItems.has(item.id)
              const selectedData = selectedItems.get(item.id)

              return (
                <div
                  key={item.id}
                  className={`p-3.5 space-y-3 transition-colors ${
                    !isEligible
                      ? "opacity-50 bg-muted/10 cursor-not-allowed"
                      : isSelected
                      ? "bg-secondary/20"
                      : "bg-card"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`item_${item.id}`}
                      checked={isSelected}
                      disabled={!isEligible}
                      onCheckedChange={() => isEligible && toggleItem(item, maxReturnable)}
                      className="mt-1"
                    />

                    <div className="h-14 w-12 rounded-xs overflow-hidden bg-muted relative shrink-0 border border-border/40">
                      {item.imageSrc && (
                        <Image
                          src={item.imageSrc}
                          alt={item.productName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`item_${item.id}`}
                        className="text-xs font-semibold text-foreground block cursor-pointer"
                      >
                        {item.productName}
                      </label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Colour: <span className="text-foreground">{item.colourName}</span> • Size:{" "}
                        <span className="text-foreground">{item.sizeLabel}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="font-medium text-foreground">
                          {formatAED(item.priceFils)}
                        </span>
                        {!isEligible && itemElig?.ineligibleReason && (
                          <span className="text-[10px] text-destructive italic">
                            {itemElig.ineligibleReason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selected Item Controls */}
                  {isSelected && selectedData && (
                    <div className="pl-7 pt-2 border-t border-border/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-sans tracking-wider text-muted-foreground mb-1">
                          Quantity to Return
                        </label>
                        <select
                          value={selectedData.quantity}
                          onChange={(e) =>
                            updateItemQuantity(item.id, parseInt(e.target.value, 10), maxReturnable)
                          }
                          className="h-8 px-2 text-xs bg-background border border-border rounded-xs w-24"
                        >
                          {Array.from({ length: maxReturnable }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-sans tracking-wider text-muted-foreground mb-1">
                          Return Reason *
                        </label>
                        <select
                          value={selectedData.reason}
                          onChange={(e) =>
                            updateItemReason(item.id, e.target.value as ReturnReason)
                          }
                          className="h-8 px-2 text-xs bg-background border border-border rounded-xs w-full"
                        >
                          {RETURN_REASONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Condition Photos Upload */}
      <div className="space-y-2">
        <span className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Garment Condition Photos (Optional, Max 5)
        </span>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Attaching photos of tags and garment condition expedites atelier review and courier pickup approval.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {photos.map((p) => (
            <div
              key={p.mediaKey}
              className="h-16 w-16 rounded-xs border border-border relative overflow-hidden bg-muted group"
            >
              <Image
                src={p.url}
                alt="Uploaded return photo"
                fill
                sizes="64px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(p.mediaKey)}
                className="absolute top-1 right-1 p-0.5 bg-background/80 text-foreground rounded-full hover:bg-destructive hover:text-white transition-colors"
                title="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {photos.length < 5 && (
            <label className="h-16 w-16 flex flex-col items-center justify-center border border-dashed border-border/80 rounded-xs bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
              {isUploadingPhoto ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="h-4 w-4 mb-0.5" />
                  <span className="text-[9px] uppercase font-sans">Upload</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                disabled={isUploadingPhoto}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Cash on Delivery UAE Bank Details (ADR-039) */}
      {isCod && (
        <div className="p-4 bg-muted/20 border border-border/80 rounded-xs space-y-3.5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              UAE Bank Details for Cash on Delivery Refund
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Per boutique policy (ADR-039), Cash on Delivery refunds are issued via direct UAE bank transfer upon atelier inspection.
          </p>

          <FieldGroup className="gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel className="text-[10px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  UAE Bank Name *
                </FieldLabel>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Emirates NBD, ADCB, FAB"
                  className="h-9 text-xs bg-background"
                />
              </Field>

              <Field>
                <FieldLabel className="text-[10px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Account Beneficiary Name *
                </FieldLabel>
                <Input
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Name as on Bank Account"
                  className="h-9 text-xs bg-background"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel className="text-[10px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                UAE IBAN (23 Characters) *
              </FieldLabel>
              <Input
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="AE00 0000 0000 0000 0000 000"
                className="h-9 text-xs font-mono bg-background"
                maxLength={27}
              />
            </Field>
          </FieldGroup>
        </div>
      )}

      {/* Additional Notes */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Atelier Notes & Fitting Comments (Optional)
        </label>
        <textarea
          value={customerComment}
          onChange={(e) => setCustomerComment(e.target.value)}
          placeholder="Provide any specific comments about fit or garment condition..."
          rows={3}
          className="w-full p-2.5 text-xs bg-background border border-border rounded-xs focus:outline-none focus:ring-1 focus:ring-primary font-sans placeholder:text-muted-foreground/60 resize-none"
          maxLength={500}
        />
      </div>

      {/* Financial Summary & Actions */}
      <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
            Estimated Refund Amount
          </span>
          <span className="text-base font-semibold font-mono text-foreground">
            {formatAED(totalEstimatedRefundFils)}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>

          <StoreButton
            type="submit"
            disabled={isSubmitting || selectedItems.size === 0}
            className="flex-1 sm:flex-none h-10 px-6 text-xs uppercase tracking-widest"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Return Request"
            )}
          </StoreButton>
        </div>
      </div>
    </form>
  )
}

export function ReturnRequestModal({
  isOpen,
  onClose,
  orders,
  preselectedOrderId,
  onReturnSubmitted,
}: ReturnRequestModalProps) {
  const deliveredOrders = React.useMemo(() => {
    return orders.filter((o) => o.status === "delivered")
  }, [orders])

  const [chosenOrderId, setChosenOrderId] = React.useState<string | undefined>(undefined)

  const effectiveOrderId =
    chosenOrderId || preselectedOrderId || deliveredOrders[0]?.id || ""

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-card border-border rounded-xs">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-muted rounded-xs text-foreground">
              <RotateCcw className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-xl font-sans font-semibold tracking-tight text-foreground">
                Request a Return or Exchange
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-sans">
                7-day complimentary atelier return pickup across the UAE.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isOpen && (
          <ReturnRequestForm
            key={`${effectiveOrderId}_open`}
            deliveredOrders={deliveredOrders}
            selectedOrderId={effectiveOrderId}
            onSelectOrderId={setChosenOrderId}
            onClose={onClose}
            onReturnSubmitted={onReturnSubmitted}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
