"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  AdminReturnDetail,
  AdminReturnItem,
  AdminReturnEvent,
  AdminRefund,
  ItemCondition,
  RefundMethod,
} from "../types"
import {
  approveReturnAction,
  rejectReturnAction,
  markReturnReceivedAction,
  processReturnRefundAction,
  restockReturnItemsAction,
} from "../actions"
import { ReturnStatusBadge } from "./columns"
import { formatAED } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Banknote,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Loader2,
  Package,
  Layers,
  ArrowUpRight,
  Building2,
  Copy,
  Check,
} from "lucide-react"

interface ReturnDetailViewProps {
  returnDetail: AdminReturnDetail
}

const CONDITION_LABELS: Record<ItemCondition, { label: string; color: string }> = {
  pending_inspection: {
    label: "Pending Inspection",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  unopened: {
    label: "Unopened / Factory Sealed",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  inspected_pass: {
    label: "Inspected & Passed",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  damaged: {
    label: "Damaged / Defective",
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
  worn_rejected: {
    label: "Worn / Tags Removed",
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
}

export function ReturnDetailView({ returnDetail: ret }: ReturnDetailViewProps) {
  const router = useRouter()
  const [isActing, setIsActing] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  // Approve dialog state
  const [showApproveForm, setShowApproveForm] = React.useState(false)
  const [instructions, setInstructions] = React.useState(
    ret.admin_instructions ||
      "Please pack the garment securely in original packaging with tags intact. Our courier partner will collect from your address within 2 business days."
  )

  // Reject dialog state
  const [showRejectForm, setShowRejectForm] = React.useState(false)
  const [rejectionReason, setRejectionReason] = React.useState("")

  // Inspection state
  const [showInspectForm, setShowInspectForm] = React.useState(false)
  const [itemConditions, setItemConditions] = React.useState<
    Record<string, ItemCondition>
  >(() => {
    const init: Record<string, ItemCondition> = {}
    ret.items.forEach((it) => {
      init[it.id] = it.condition || "inspected_pass"
    })
    return init
  })

  // Refund state
  const totalClaimedFils = ret.items.reduce(
    (sum, it) => sum + (it.refund_amount_fils || 0),
    0
  )
  const [showRefundForm, setShowRefundForm] = React.useState(false)
  const [refundAmountAED, setRefundAmountAED] = React.useState(
    (totalClaimedFils / 100).toFixed(0)
  )
  const [refundMethod, setRefundMethod] = React.useState<RefundMethod>(
    ret.payment_method === "cod" ? "bank_transfer" : "card"
  )
  const [bankDate, setBankDate] = React.useState(
    new Date().toISOString().split("T")[0]
  )
  const [bankRef, setBankRef] = React.useState("")
  const [refundReason, setRefundReason] = React.useState("Approved Customer Return")

  // Restock state
  const [isRestocking, setIsRestocking] = React.useState(false)
  const [copiedIban, setCopiedIban] = React.useState(false)

  function copyToClipboard(text: string) {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedIban(true)
    setTimeout(() => setCopiedIban(false), 2000)
  }

  // 1. Approve Return
  async function handleApprove() {
    setIsActing(true)
    setActionError(null)
    const res = await approveReturnAction({
      returnId: ret.id,
      instructions,
    })
    setIsActing(false)
    if (res.success) {
      setShowApproveForm(false)
      router.refresh()
    } else {
      setActionError(res.error || "Failed to approve return")
    }
  }

  // 2. Reject Return
  async function handleReject() {
    if (!rejectionReason.trim()) {
      setActionError("Please provide a rejection reason.")
      return
    }
    setIsActing(true)
    setActionError(null)
    const res = await rejectReturnAction({
      returnId: ret.id,
      reason: rejectionReason,
    })
    setIsActing(false)
    if (res.success) {
      setShowRejectForm(false)
      router.refresh()
    } else {
      setActionError(res.error || "Failed to reject return")
    }
  }

  // 3. Mark Received & Save Inspections
  async function handleMarkReceived() {
    setIsActing(true)
    setActionError(null)
    const formatted = Object.entries(itemConditions).map(([itemId, condition]) => ({
      itemId,
      condition,
    }))
    const res = await markReturnReceivedAction({
      returnId: ret.id,
      itemConditions: formatted,
    })
    setIsActing(false)
    if (res.success) {
      setShowInspectForm(false)
      router.refresh()
    } else {
      setActionError(res.error || "Failed to record inspection")
    }
  }

  // 4. Process Refund
  async function handleProcessRefund() {
    const amountFils = Math.round(parseFloat(refundAmountAED) * 100)
    if (isNaN(amountFils) || amountFils <= 0) {
      setActionError("Please enter a valid refund amount.")
      return
    }
    if (refundMethod === "bank_transfer" && !bankRef.trim()) {
      setActionError("Please enter a bank transfer reference number for COD refund.")
      return
    }

    setIsActing(true)
    setActionError(null)
    const res = await processReturnRefundAction({
      returnId: ret.id,
      orderId: ret.order_id,
      amountFils,
      method: refundMethod,
      bankTransferDate: refundMethod === "bank_transfer" ? bankDate : undefined,
      bankTransferReference: refundMethod === "bank_transfer" ? bankRef : undefined,
      reason: refundReason,
    })
    setIsActing(false)
    if (res.success) {
      setShowRefundForm(false)
      router.refresh()
    } else {
      setActionError(res.error || "Failed to process refund")
    }
  }

  // 5. Restock Items
  async function handleRestock() {
    const eligibleItemIds = ret.items
      .filter((it) => !it.is_restocked)
      .map((it) => it.id)

    if (eligibleItemIds.length === 0) {
      alert("All items in this return are already restocked.")
      return
    }

    if (
      !confirm(
        `Are you sure you want to restock ${eligibleItemIds.length} item(s) back into active inventory?`
      )
    ) {
      return
    }

    setIsRestocking(true)
    const res = await restockReturnItemsAction({
      returnId: ret.id,
      itemIds: eligibleItemIds,
    })
    setIsRestocking(false)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || "Failed to restock items")
    }
  }

  const allRestocked = ret.items.every((it) => it.is_restocked)

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/returns"
            className="p-1.5 border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors rounded-none"
            title="Back to Returns"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Return Claim
              </span>
              <span className="text-muted-foreground/60">•</span>
              <Link
                href={`/admin/orders/${ret.order_id}`}
                className="text-xs font-sans text-muted-foreground hover:text-foreground inline-flex items-center gap-1 hover:underline"
              >
                <span>Order #{ret.order_number}</span>
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-0.5">
              {ret.return_number}
            </h1>
          </div>
        </div>

        {/* Status & Method Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge
            variant="outline"
            className="text-xs font-sans uppercase tracking-wider rounded-none px-2.5 py-1 border-border/80"
          >
            {ret.payment_method === "cod" ? "Cash on Delivery" : "Card Payment"}
          </Badge>
          <ReturnStatusBadge status={ret.status} />
        </div>
      </div>

      {/* Error alert */}
      {actionError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="font-bold underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Action Toolbar / Status Control ── */}
      <div className="p-4 border border-border bg-card rounded-none space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Return Status Workflow
            </span>
            <p className="text-xs text-foreground font-sans font-medium mt-0.5">
              Current stage: <span className="uppercase font-semibold">{ret.status}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ret.status === "requested" && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowApproveForm(!showApproveForm)
                    setShowRejectForm(false)
                  }}
                  className="rounded-none text-xs bg-foreground text-background hover:bg-foreground/90 font-sans"
                >
                  <CheckCircle2 className="size-3.5 mr-1.5" />
                  Approve Return
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowRejectForm(!showRejectForm)
                    setShowApproveForm(false)
                  }}
                  className="rounded-none text-xs border-destructive/40 text-destructive hover:bg-destructive/10 font-sans"
                >
                  <XCircle className="size-3.5 mr-1.5" />
                  Reject Claim
                </Button>
              </>
            )}

            {(ret.status === "approved" || ret.status === "in_transit") && (
              <Button
                size="sm"
                onClick={() => setShowInspectForm(!showInspectForm)}
                className="rounded-none text-xs bg-foreground text-background hover:bg-foreground/90 font-sans"
              >
                <Package className="size-3.5 mr-1.5" />
                Mark Received & Inspect
              </Button>
            )}

            {ret.status === "received" && (
              <>
                <Button
                  size="sm"
                  onClick={() => setShowRefundForm(!showRefundForm)}
                  className="rounded-none text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-sans"
                >
                  <Banknote className="size-3.5 mr-1.5" />
                  Process Refund ({formatAED(totalClaimedFils)})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRestock}
                  disabled={isRestocking || allRestocked}
                  className="rounded-none text-xs border-border font-sans"
                >
                  {isRestocking ? (
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Layers className="size-3.5 mr-1.5" />
                  )}
                  {allRestocked ? "Items Restocked" : "Restock to Inventory"}
                </Button>
              </>
            )}

            {ret.status === "closed" && (
              <span className="text-xs text-muted-foreground font-sans inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Return resolved and closed.
              </span>
            )}
          </div>
        </div>

        {/* ── Form: Approve Return ── */}
        {showApproveForm && (
          <div className="pt-3 border-t border-border/80 space-y-3">
            <label className="text-xs font-medium text-foreground block">
              Return Shipping Instructions for Customer:
            </label>
            <Textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="text-xs font-sans rounded-none bg-background border-input"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowApproveForm(false)}
                className="rounded-none text-xs font-sans"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isActing}
                className="rounded-none text-xs bg-foreground text-background font-sans"
              >
                {isActing ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Confirm Approval & Send Instructions
              </Button>
            </div>
          </div>
        )}

        {/* ── Form: Reject Return ── */}
        {showRejectForm && (
          <div className="pt-3 border-t border-border/80 space-y-3">
            <label className="text-xs font-medium text-destructive block">
              Reason for Rejection:
            </label>
            <Textarea
              rows={2}
              placeholder="e.g. Return window expired / Item marked final sale / Garment altered"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="text-xs font-sans rounded-none bg-background border-input"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRejectForm(false)}
                className="rounded-none text-xs font-sans"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReject}
                disabled={isActing}
                className="rounded-none text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 font-sans"
              >
                {isActing ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}

        {/* ── Form: Inspect Items ── */}
        {showInspectForm && (
          <div className="pt-3 border-t border-border/80 space-y-3">
            <label className="text-xs font-medium text-foreground block">
              Assess Physical Condition of Received Items:
            </label>
            <div className="space-y-2">
              {ret.items.map((it) => (
                <div
                  key={it.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-muted/30 border border-border text-xs"
                >
                  <div>
                    <span className="font-medium text-foreground">{it.product_name}</span>{" "}
                    <span className="font-mono text-muted-foreground">({it.sku})</span>
                  </div>
                  <select
                    value={itemConditions[it.id] || "inspected_pass"}
                    onChange={(e) =>
                      setItemConditions({
                        ...itemConditions,
                        [it.id]: e.target.value as ItemCondition,
                      })
                    }
                    className="h-8 px-2 bg-background border border-input text-xs font-sans rounded-none"
                  >
                    <option value="inspected_pass">Inspected & Passed (Like New)</option>
                    <option value="unopened">Unopened / Factory Sealed</option>
                    <option value="damaged">Damaged / Defective</option>
                    <option value="worn_rejected">Worn / Tags Removed (Rejected)</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInspectForm(false)}
                className="rounded-none text-xs font-sans"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleMarkReceived}
                disabled={isActing}
                className="rounded-none text-xs bg-foreground text-background font-sans"
              >
                {isActing ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Save Condition & Mark Received
              </Button>
            </div>
          </div>
        )}

        {/* ── Form: Process Refund ── */}
        {showRefundForm && (
          <div className="pt-3 border-t border-border/80 space-y-4">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-[0.1em] font-sans">
              Record Customer Refund
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-muted-foreground font-sans">Refund Amount (AED):</label>
                <Input
                  type="number"
                  value={refundAmountAED}
                  onChange={(e) => setRefundAmountAED(e.target.value)}
                  className="h-8 text-xs font-sans rounded-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-sans">Payment Method:</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as RefundMethod)}
                  className="w-full h-8 px-2 bg-background border border-input text-xs font-sans rounded-none"
                >
                  <option value="card">Stripe Card Reversal</option>
                  <option value="bank_transfer">COD UAE Bank Transfer</option>
                </select>
              </div>

              {refundMethod === "bank_transfer" && (
                <>
                  <div className="space-y-1">
                    <label className="text-muted-foreground font-sans">Transfer Date:</label>
                    <Input
                      type="date"
                      value={bankDate}
                      onChange={(e) => setBankDate(e.target.value)}
                      className="h-8 text-xs font-sans rounded-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-muted-foreground font-sans">
                      Bank Reference / Trans ID:
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. FT261016XXXX"
                      value={bankRef}
                      onChange={(e) => setBankRef(e.target.value)}
                      className="h-8 text-xs font-mono rounded-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Customer Provided Bank Details Banner for Transfer */}
            {refundMethod === "bank_transfer" && ret.iban && (
              <div className="p-3 bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Building2 className="size-3.5 text-muted-foreground" />
                    <span>Beneficiary: {ret.account_holder_name || ret.customer_name}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{ret.bank_name || "UAE Bank"}</span>
                  </div>
                  <div className="font-mono text-xs text-foreground tracking-wide font-semibold">
                    IBAN: {ret.iban}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(ret.iban!)}
                  className="h-7 text-xs rounded-none border-border self-start sm:self-auto shrink-0 font-sans"
                >
                  {copiedIban ? (
                    <>
                      <Check className="size-3 mr-1 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3 mr-1" />
                      Copy IBAN
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRefundForm(false)}
                className="rounded-none text-xs font-sans"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleProcessRefund}
                disabled={isActing}
                className="rounded-none text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-sans"
              >
                {isActing ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Confirm & Record Refund
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Layout: 2 Columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Items & Customer Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Returned Items Card */}
          <div className="border border-border bg-card rounded-none overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
              <span className="text-xs font-sans font-semibold uppercase tracking-[0.1em] text-foreground">
                Items Under Claim ({ret.items.length})
              </span>
              <span className="text-xs font-sans text-muted-foreground">
                Total Refundable: <span className="font-semibold text-foreground font-sans">{formatAED(totalClaimedFils)}</span>
              </span>
            </div>

            <div className="divide-y divide-border">
              {ret.items.map((item) => {
                const conditionMeta =
                  CONDITION_LABELS[item.condition] ||
                  CONDITION_LABELS.pending_inspection

                return (
                  <div key={item.id} className="p-4 flex gap-4 items-start">
                    {/* Item Image */}
                    <div className="relative size-16 bg-muted/30 border border-border/60 shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-[10px] text-muted-foreground font-sans">
                          No Photo
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-foreground tracking-tight font-sans">
                            {item.product_name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground font-sans">
                            {item.colour_name} {item.size_label ? `• Size ${item.size_label}` : ""} •{" "}
                            <span className="font-sans font-medium">{item.sku}</span>
                          </p>
                        </div>
                        <span className="font-sans text-xs font-semibold text-foreground">
                          {formatAED(item.unit_price_fils * item.quantity)}
                        </span>
                      </div>

                      {/* Reason & Condition */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-sans font-normal rounded-none px-2 py-0 border-border"
                        >
                          Reason: {item.reason}
                        </Badge>

                        <Badge
                          variant="outline"
                          className={`text-[10px] font-sans font-normal rounded-none px-2 py-0 border ${conditionMeta.color}`}
                        >
                          {conditionMeta.label}
                        </Badge>

                        {item.is_restocked && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-sans rounded-none px-2 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20"
                          >
                            ✓ Restocked to Warehouse
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Customer Claim Statement */}
          <div className="border border-border bg-card p-4 rounded-none space-y-2">
            <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Customer Statement / Return Request Note
            </span>
            <p className="text-xs text-foreground bg-muted/30 p-3 border border-border/60 rounded-none leading-relaxed font-sans">
              "{ret.customer_comment || "No specific customer comment provided."}"
            </p>
          </div>

          {/* Customer Return Evidence Photos */}
          {ret.photos && ret.photos.length > 0 && (
            <div className="border border-border bg-card p-4 rounded-none space-y-3">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Customer Evidence Photos ({ret.photos.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ret.photos.map((ph) => (
                  <div
                    key={ph.id}
                    className="relative aspect-square border border-border bg-muted overflow-hidden group"
                  >
                    {ph.image_url ? (
                      <Image
                        src={ph.image_url}
                        alt="Evidence photo"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        unoptimized
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-[10px] text-muted-foreground font-sans">
                        Image Key: {ph.media_key}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refunds Recorded */}
          {ret.refunds && ret.refunds.length > 0 && (
            <div className="border border-border bg-card rounded-none overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border">
                <span className="text-xs font-sans font-semibold uppercase tracking-[0.1em] text-foreground">
                  Recorded Refunds ({ret.refunds.length})
                </span>
              </div>
              <div className="divide-y divide-border">
                {ret.refunds.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-3.5 flex items-center justify-between gap-4 text-xs font-sans"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground font-sans">
                          {formatAED(ref.amount_fils)}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-sans uppercase tracking-wider rounded-none px-1.5 py-0"
                        >
                          {ref.method === "bank_transfer" ? "Bank Transfer" : "Card"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-sans">
                        {ref.bank_transfer_reference
                          ? `Ref: ${ref.bank_transfer_reference} • `
                          : ""}
                        Processed by {ref.processed_by} on{" "}
                        {new Date(ref.created_at).toLocaleDateString("en-AE")}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 rounded-none font-sans"
                    >
                      {ref.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Customer info, Return timestamps, Timeline */}
        <div className="space-y-6">
          {/* Customer & Order Context */}
          <div className="border border-border bg-card p-4 rounded-none space-y-3">
            <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Customer Information
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-foreground font-medium font-sans">
                <User className="size-3.5 text-muted-foreground" />
                <span>{ret.customer_name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-sans">
                <Mail className="size-3.5" />
                <a href={`mailto:${ret.email}`} className="hover:underline">
                  {ret.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-sans">
                <Phone className="size-3.5" />
                <a href={`tel:${ret.phone}`} className="hover:underline">
                  {ret.phone}
                </a>
              </div>
            </div>

            <div className="pt-2 border-t border-border/80 space-y-1.5 text-[11px] font-sans">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Original Order:</span>
                <Link
                  href={`/admin/orders/${ret.order_id}`}
                  className="font-sans font-medium text-foreground hover:underline"
                >
                  #{ret.order_number}
                </Link>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Order Total:</span>
                <span className="font-sans font-medium text-foreground">
                  {formatAED(ret.order_total_fils)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Payment Status:</span>
                <span className="capitalize text-foreground font-medium">
                  {ret.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Bank Transfer Details (for COD returns) */}
          {(ret.iban || ret.bank_name) && (
            <div className="border border-border bg-card p-4 rounded-none space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="size-3.5" />
                  Customer Bank Details (COD)
                </span>
                {ret.iban && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(ret.iban!)}
                    className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-sans underline"
                  >
                    {copiedIban ? (
                      <>
                        <Check className="size-3 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        Copy IBAN
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bank:</span>
                  <span className="font-medium text-foreground">{ret.bank_name || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Beneficiary Name:</span>
                  <span className="font-medium text-foreground">
                    {ret.account_holder_name || ret.customer_name}
                  </span>
                </div>
                <div className="flex flex-col gap-1 pt-1.5 border-t border-border/60">
                  <span className="text-muted-foreground text-[11px]">UAE IBAN:</span>
                  <div className="p-2 bg-muted/40 font-mono text-xs font-semibold text-foreground tracking-wider select-all break-all border border-border/60">
                    {ret.iban || "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Instructions Banner */}
          {ret.admin_instructions && (
            <div className="border border-border bg-card p-4 rounded-none space-y-2">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Return Instructions Provided
              </span>
              <p className="text-xs text-foreground bg-muted/30 p-2.5 border border-border/60 leading-relaxed font-sans">
                {ret.admin_instructions}
              </p>
            </div>
          )}

          {/* Rejection / Close Reason */}
          {(ret.rejection_reason || ret.close_reason) && (
            <div className="border border-destructive/20 bg-destructive/5 p-4 rounded-none space-y-1">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-destructive">
                Reason Noted:
              </span>
              <p className="text-xs text-destructive leading-relaxed font-sans">
                {ret.rejection_reason || ret.close_reason}
              </p>
            </div>
          )}

          {/* Return Events Timeline */}
          <div className="border border-border bg-card p-4 rounded-none space-y-3">
            <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Claim Audit Timeline
            </span>

            <div className="space-y-4 pt-1">
              {ret.events.map((ev, i) => (
                <div key={ev.id || i} className="flex gap-3 text-xs items-start">
                  <div className="size-2 rounded-full bg-foreground mt-1 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-foreground font-sans text-xs">
                      {ev.event_type.replace(/_/g, " ").toUpperCase()}
                    </p>
                    {ev.note && (
                      <p className="text-muted-foreground font-sans text-xs">
                        {ev.note}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 font-sans">
                      {new Date(ev.created_at).toLocaleString("en-AE", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      • {ev.actor_sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
