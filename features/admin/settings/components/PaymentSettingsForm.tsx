"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { StoreSettings } from "../types"
import { updateStoreSettingsAction } from "../actions"
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  ShieldCheck,
  Clock,
  Wallet,
} from "lucide-react"

interface PaymentSettingsFormProps {
  initialSettings: StoreSettings
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-card border border-border rounded-none p-6 space-y-5">
      <div className="flex items-start gap-3 pb-3 border-b border-border">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <div>
          <h2 className="font-sans text-sm font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-[11px] text-muted-foreground font-sans mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
      <div className="sm:pt-2">
        <span className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        {hint && (
          <p className="text-[10px] text-muted-foreground/70 font-sans mt-0.5 leading-snug">
            {hint}
          </p>
        )}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  )
}

function AEDInput({
  value,
  onChange,
  placeholder = "0",
}: {
  value: number
  onChange: (fils: number) => void
  placeholder?: string
}) {
  const [prevValue, setPrevValue] = React.useState(value)
  const [raw, setRaw] = React.useState((value / 100).toFixed(0))

  if (value !== prevValue) {
    setPrevValue(value)
    setRaw((value / 100).toFixed(0))
  }

  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none">
        AED
      </span>
      <Input
        type="number"
        min="0"
        step="1"
        value={raw}
        placeholder={placeholder}
        onChange={(e) => {
          setRaw(e.target.value)
          const parsed = parseFloat(e.target.value)
          if (!isNaN(parsed) && parsed >= 0) onChange(Math.round(parsed * 100))
        }}
        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        className="h-9 pl-10 text-xs font-mono bg-background border-input rounded-none"
      />
    </div>
  )
}

export function PaymentSettingsForm({ initialSettings }: PaymentSettingsFormProps) {
  const [s, setS] = React.useState<StoreSettings>(initialSettings)
  const [isSaving, setIsSaving] = React.useState(false)
  const [savedOk, setSavedOk] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)

  function set<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setS((prev) => ({ ...prev, [key]: value }))
    setSavedOk(false)
    setSaveError(null)
  }

  async function handleSave() {
    setIsSaving(true)
    setSavedOk(false)
    setSaveError(null)

    try {
      const res = await updateStoreSettingsAction({
        card_enabled: s.card_enabled,
        cod_enabled: s.cod_enabled,
        cod_fee_fils: s.cod_fee_fils,
        cod_max_order_fils: s.cod_max_order_fils,
        cod_confirm_hours: s.cod_confirm_hours,
        cod_refused_block_count: s.cod_refused_block_count,
      })

      if (res.success) {
        setSavedOk(true)
      } else {
        setSaveError(res.error || "Failed to save payment settings.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error while saving."
      setSaveError(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Administration
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-0.5">
            Payment Methods
          </h1>
          <p className="mt-1 text-xs text-muted-foreground font-sans">
            Configure online gateway cards, cash on delivery rules, thresholds, and storefront payment options.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-none h-9 text-xs px-5 uppercase tracking-widest font-sans font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-3.5 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {savedOk && (
        <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-2 rounded-none font-sans">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Payment settings saved successfully.</span>
        </div>
      )}
      {saveError && (
        <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2 rounded-none font-sans">
          <AlertCircle className="size-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ── Method 1: Online Card & Digital Wallets ── */}
      <SectionCard
        icon={<CreditCard className="size-4" />}
        title="Online Card & Digital Wallets"
        description="Instant card payments and mobile digital wallets powered by Stripe."
      >
        <div className="space-y-5">
          <div className="p-4.5 rounded-none border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="card_enabled"
                  checked={s.card_enabled}
                  onCheckedChange={(v) => set("card_enabled", Boolean(v))}
                  className="rounded-none size-4"
                />
                <label
                  htmlFor="card_enabled"
                  className="text-xs font-sans font-medium text-foreground cursor-pointer select-none"
                >
                  Enable Online Card Payments (Stripe)
                </label>
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-none border ${
                  s.card_enabled
                    ? "bg-primary/10 text-primary border-primary/20 font-semibold"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {s.card_enabled ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground pl-7 leading-relaxed">
              When enabled, customers can instantly pay during checkout using Visa, Mastercard, American Express, Apple Pay, and Google Pay with 3D Secure authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 border border-border bg-card space-y-1">
              <div className="flex items-center gap-2 text-foreground text-xs font-medium">
                <CreditCard className="size-3.5 text-primary" />
                <span>Major Cards</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Visa, Mastercard & AMEX accepted across UAE and international banks.
              </p>
            </div>

            <div className="p-3 border border-border bg-card space-y-1">
              <div className="flex items-center gap-2 text-foreground text-xs font-medium">
                <Wallet className="size-3.5 text-primary" />
                <span>Digital Wallets</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Seamless one-touch checkout via Apple Pay and Google Pay.
              </p>
            </div>

            <div className="p-3 border border-border bg-card space-y-1">
              <div className="flex items-center gap-2 text-foreground text-xs font-medium">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>3D Secure 2.0</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Automated biometric authentication and chargeback liability shift.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Method 2: Cash on Delivery (COD) ── */}
      <SectionCard
        icon={<Banknote className="size-4" />}
        title="Cash on Delivery (COD)"
        description="Physical cash collection upon courier handover across the UAE with automated risk controls."
      >
        <div className="space-y-6">
          <div className="p-4.5 rounded-none border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="cod_enabled"
                  checked={s.cod_enabled}
                  onCheckedChange={(v) => set("cod_enabled", Boolean(v))}
                  className="rounded-none size-4"
                />
                <label
                  htmlFor="cod_enabled"
                  className="text-xs font-sans font-medium text-foreground cursor-pointer select-none"
                >
                  Enable Cash on Delivery (COD)
                </label>
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-none border ${
                  s.cod_enabled
                    ? "bg-primary/10 text-primary border-primary/20 font-semibold"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {s.cod_enabled ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground pl-7 leading-relaxed">
              When enabled, UAE customers can place orders with cash payment upon doorstep courier delivery. Stock is reserved and confirmed via phone/WhatsApp.
            </p>
          </div>

          {/* COD Rules & Limits */}
          <div
            className={`space-y-5 transition-opacity ${
              s.cod_enabled ? "opacity-100" : "opacity-45 pointer-events-none"
            }`}
          >
            <FieldRow
              label="COD Surcharge Fee"
              hint="Additional handling fee added to COD orders (0 to disable fee)"
            >
              <AEDInput
                value={s.cod_fee_fils}
                onChange={(v) => set("cod_fee_fils", v)}
              />
            </FieldRow>

            <FieldRow
              label="Max Order Value"
              hint="Orders above this amount must pay online via Card"
            >
              <AEDInput
                value={s.cod_max_order_fils}
                onChange={(v) => set("cod_max_order_fils", v)}
              />
            </FieldRow>

            <FieldRow
              label="Confirmation Window"
              hint="Hours customer has to confirm COD order before auto-cancellation"
            >
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="72"
                  value={s.cod_confirm_hours}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10)
                    if (!isNaN(parsed) && parsed > 0) set("cod_confirm_hours", parsed)
                  }}
                  className="h-9 pr-14 text-xs font-mono bg-background border-input rounded-none"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none">
                  HOURS
                </span>
              </div>
            </FieldRow>

            <FieldRow
              label="Refusal Block Limit"
              hint="Refused deliveries allowed before COD is blocked for customer account & phone"
            >
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={s.cod_refused_block_count}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10)
                    if (!isNaN(parsed) && parsed > 0) set("cod_refused_block_count", parsed)
                  }}
                  className="h-9 pr-16 text-xs font-mono bg-background border-input rounded-none"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none">
                  PARCELS
                </span>
              </div>
            </FieldRow>
          </div>
        </div>
      </SectionCard>

      {/* ── Operational Guidelines ── */}
      <SectionCard
        icon={<Clock className="size-4" />}
        title="Compliance & Reconciliation"
        description="Standard operating procedures for order reconciliation and refunds."
      >
        <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <div className="p-3 bg-muted/30 border border-border space-y-1">
            <span className="font-semibold text-foreground block">
              1. Card Settlements & Refunds
            </span>
            <p>
              Stripe card transactions are automatically marked as paid upon webhook confirmation. Refunds on card orders are processed directly through Stripe to the original card.
            </p>
          </div>

          <div className="p-3 bg-muted/30 border border-border space-y-1">
            <span className="font-semibold text-foreground block">
              2. Cash on Delivery Reconciliation
            </span>
            <p>
              COD orders are created in awaiting confirmation state. Once delivered, administrators record courier cash handover in Orders Management, which marks payment as paid and generates the invoice.
            </p>
          </div>

          <div className="p-3 bg-muted/30 border border-border space-y-1">
            <span className="font-semibold text-foreground block">
              3. Protection Against Returns to Sender (RTS)
            </span>
            <p>
              If a customer refuses a COD delivery, courier mark returned to sender is logged. Reaching the refusal limit ({s.cod_refused_block_count} parcels) disables COD for that customer account and phone number automatically.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
