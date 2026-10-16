"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { StoreSettings } from "../types"
import { updateStoreSettingsAction } from "../actions"
import { FAQEditorSection } from "./FAQEditorSection"
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Store,
  Truck,
  RotateCcw,
  Megaphone,
  Bell,
  Banknote,
  Receipt,
} from "lucide-react"

interface SettingsFormProps {
  initialSettings: StoreSettings
}

// ── Helper sub-components ──────────────────────────────────────────────────────

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

// ── Main form ──────────────────────────────────────────────────────────────────

export function SettingsForm({ initialSettings }: SettingsFormProps) {
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
    setSaveError(null)
    setSavedOk(false)
    const res = await updateStoreSettingsAction(s)
    setIsSaving(false)
    if (res.success) {
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 4000)
    } else {
      setSaveError(res.error || "Failed to save settings.")
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Administration
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-0.5">
            Store Settings
          </h1>
          <p className="mt-1 text-xs text-muted-foreground font-sans">
            Configure store details, delivery, COD, returns, VAT, FAQs and notifications.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {savedOk && (
        <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-2 rounded-none">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Settings saved successfully.</span>
        </div>
      )}
      {saveError && (
        <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2 rounded-none">
          <AlertCircle className="size-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ── Store Details ── */}
      <SectionCard
        icon={<Store className="size-4" />}
        title="Store Details"
        description="Basic information shown on invoices, emails and the storefront."
      >
        <div className="space-y-4">
          <FieldRow label="Store Name">
            <Input
              value={s.store_name}
              onChange={(e) => set("store_name", e.target.value)}
              className="h-9 text-xs font-sans bg-background border-input rounded-none"
              placeholder="AR Boutique"
            />
          </FieldRow>
          <FieldRow label="Store Email" hint="Used as reply-to on customer emails">
            <Input
              type="email"
              value={s.store_email}
              onChange={(e) => set("store_email", e.target.value)}
              className="h-9 text-xs font-mono bg-background border-input rounded-none"
              placeholder="hello@arboutique.ae"
            />
          </FieldRow>
          <FieldRow label="Phone">
            <Input
              type="tel"
              value={s.store_phone}
              onChange={(e) => set("store_phone", e.target.value)}
              className="h-9 text-xs font-mono bg-background border-input rounded-none"
              placeholder="+971 50 000 0000"
            />
          </FieldRow>
          <FieldRow label="Address" hint="Shown on invoices">
            <Textarea
              value={s.store_address}
              onChange={(e) => set("store_address", e.target.value)}
              rows={3}
              className="text-xs font-sans bg-background border-input rounded-none leading-relaxed resize-y"
              placeholder="Dubai, UAE"
            />
          </FieldRow>
        </div>
      </SectionCard>

      {/* ── VAT ── */}
      <SectionCard
        icon={<Receipt className="size-4" />}
        title="Tax (VAT)"
        description="Enable VAT to include a 5 % tax line on invoices. Confirm TRN with your accountant before enabling."
      >
        <div className="space-y-4">
          <FieldRow label="TRN" hint="Tax Registration Number">
            <Input
              value={s.trn}
              onChange={(e) => set("trn", e.target.value)}
              className="h-9 text-xs font-mono bg-background border-input rounded-none"
              placeholder="100123456700003"
            />
          </FieldRow>
          <FieldRow label="Enable VAT">
            <div className="flex items-center gap-2.5 pt-1">
              <Checkbox
                id="vat_enabled"
                checked={s.vat_enabled}
                onCheckedChange={(v) => set("vat_enabled", !!v)}
                className="rounded-none size-4"
              />
              <label
                htmlFor="vat_enabled"
                className="text-xs font-sans text-foreground cursor-pointer select-none"
              >
                Charge 5 % VAT on orders and include a VAT line on invoices
              </label>
            </div>
          </FieldRow>
        </div>
      </SectionCard>

      {/* ── Delivery ── */}
      <SectionCard
        icon={<Truck className="size-4" />}
        title="Delivery"
        description="Flat delivery fee charged at checkout. Set free-delivery threshold to 0 to always charge."
      >
        <div className="space-y-4">
          <FieldRow label="Delivery Fee">
            <AEDInput
              value={s.delivery_fee_fils}
              onChange={(v) => set("delivery_fee_fils", v)}
            />
          </FieldRow>
          <FieldRow
            label="Free Delivery Over"
            hint="Set to 0 to disable free-delivery threshold"
          >
            <AEDInput
              value={s.free_delivery_over_fils}
              onChange={(v) => set("free_delivery_over_fils", v)}
            />
          </FieldRow>
        </div>
      </SectionCard>

      {/* ── Cash on Delivery ── */}
      <SectionCard
        icon={<Banknote className="size-4" />}
        title="Cash on Delivery"
        description="Control whether COD is available at checkout and configure its rules."
      >
        <div className="space-y-4">
          <FieldRow label="Enable COD">
            <div className="flex items-center gap-2.5 pt-1">
              <Checkbox
                id="cod_enabled"
                checked={s.cod_enabled}
                onCheckedChange={(v) => set("cod_enabled", !!v)}
                className="rounded-none size-4"
              />
              <label
                htmlFor="cod_enabled"
                className="text-xs font-sans text-foreground cursor-pointer select-none"
              >
                Allow customers to pay on delivery
              </label>
            </div>
          </FieldRow>
          <FieldRow label="COD Fee" hint="Extra fee added to COD orders">
            <AEDInput
              value={s.cod_fee_fils}
              onChange={(v) => set("cod_fee_fils", v)}
            />
          </FieldRow>
          <FieldRow label="Max Order Value" hint="COD disabled above this amount">
            <AEDInput
              value={s.cod_max_order_fils}
              onChange={(v) => set("cod_max_order_fils", v)}
            />
          </FieldRow>
          <FieldRow
            label="Confirm Within"
            hint="Hours admin has to confirm before order auto-cancels"
          >
            <div className="relative">
              <Input
                type="number"
                min="1"
                step="1"
                value={s.cod_confirm_hours}
                onChange={(e) => set("cod_confirm_hours", parseInt(e.target.value, 10) || 24)}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                className="h-9 pr-14 text-xs font-mono bg-background border-input rounded-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none">
                hours
              </span>
            </div>
          </FieldRow>
          <FieldRow
            label="Block After Refusals"
            hint="Block customer from COD after this many refused parcels"
          >
            <div className="relative">
              <Input
                type="number"
                min="1"
                step="1"
                value={s.cod_refused_block_count}
                onChange={(e) =>
                  set("cod_refused_block_count", parseInt(e.target.value, 10) || 3)
                }
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                className="h-9 pr-20 text-xs font-mono bg-background border-input rounded-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none">
                refusals
              </span>
            </div>
          </FieldRow>
        </div>
      </SectionCard>

      {/* ── Returns ── */}
      <SectionCard
        icon={<RotateCcw className="size-4" />}
        title="Returns & Exchanges"
        description="Return eligibility window and instructions shown to customers."
      >
        <div className="space-y-4">
          <FieldRow
            label="Return Window"
            hint="Days from delivery during which a return can be requested"
          >
            <div className="relative">
              <Input
                type="number"
                min="1"
                step="1"
                value={s.return_window_days}
                onChange={(e) => set("return_window_days", parseInt(e.target.value, 10) || 14)}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                className="h-9 pr-10 text-xs font-mono bg-background border-input rounded-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none">
                days
              </span>
            </div>
          </FieldRow>
          <FieldRow
            label="Approved Return Expiry"
            hint="Days before an approved-but-not-sent return expires"
          >
            <div className="relative">
              <Input
                type="number"
                min="1"
                step="1"
                value={s.return_expiry_days}
                onChange={(e) => set("return_expiry_days", parseInt(e.target.value, 10) || 7)}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                className="h-9 pr-10 text-xs font-mono bg-background border-input rounded-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none">
                days
              </span>
            </div>
          </FieldRow>
          <FieldRow
            label="Return Instructions"
            hint="Shown to the customer after a return is approved"
          >
            <Textarea
              value={s.return_instructions}
              onChange={(e) => set("return_instructions", e.target.value)}
              rows={4}
              className="text-xs font-sans bg-background border-input rounded-none leading-relaxed resize-y"
              placeholder="Please pack the item securely and drop it at the nearest courier…"
            />
          </FieldRow>
        </div>
      </SectionCard>

      {/* ── Storefront ── */}
      <SectionCard
        icon={<Megaphone className="size-4" />}
        title="Announcement Bar"
        description="Short message shown in the top bar across the storefront."
      >
        <div className="space-y-4">
          <FieldRow label="Enable Bar">
            <div className="flex items-center gap-2.5 pt-1">
              <Checkbox
                id="announcement_enabled"
                checked={s.announcement_bar_enabled}
                onCheckedChange={(v) => set("announcement_bar_enabled", !!v)}
                className="rounded-none size-4"
              />
              <label
                htmlFor="announcement_enabled"
                className="text-xs font-sans text-foreground cursor-pointer select-none"
              >
                Show announcement bar on storefront
              </label>
            </div>
          </FieldRow>
          <FieldRow label="Message" hint="Keep it under 100 characters">
            <Input
              value={s.announcement_bar_text}
              onChange={(e) => set("announcement_bar_text", e.target.value)}
              maxLength={120}
              className="h-9 text-xs font-sans bg-background border-input rounded-none"
              placeholder="Free delivery on orders over AED 500 · New arrivals every week"
            />
            <p className="mt-1 text-[10px] font-mono text-muted-foreground">
              {s.announcement_bar_text.length} / 120 characters
            </p>
          </FieldRow>
        </div>
      </SectionCard>

      {/* ── FAQ Section ── */}
      <FAQEditorSection
        faqs={s.faqs ?? []}
        onChange={(faqs) => set("faqs", faqs)}
      />

      {/* ── Notifications ── */}
      <SectionCard
        icon={<Bell className="size-4" />}
        title="Notifications"
        description="Where admin order and return alerts are sent."
      >
        <div className="space-y-4">
          <FieldRow label="Admin Email" hint="Receives new order and return alerts">
            <Input
              type="email"
              value={s.admin_notification_email}
              onChange={(e) => set("admin_notification_email", e.target.value)}
              className="h-9 text-xs font-mono bg-background border-input rounded-none"
              placeholder="orders@arboutique.ae"
            />
          </FieldRow>
          <FieldRow
            label="Low Stock Threshold"
            hint='"Only N left" shown to shoppers at or below this number'
          >
            <div className="relative">
              <Input
                type="number"
                min="1"
                step="1"
                value={s.low_stock_threshold}
                onChange={(e) =>
                  set("low_stock_threshold", parseInt(e.target.value, 10) || 3)
                }
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                className="h-9 pr-10 text-xs font-mono bg-background border-input rounded-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none">
                units
              </span>
            </div>
          </FieldRow>
        </div>
      </SectionCard>

      {/* Sticky save footer */}
      <div className="sticky bottom-0 bg-background/90 backdrop-blur-sm border-t border-border py-3 -mx-4 sm:-mx-6 px-4 sm:px-6 flex items-center justify-between gap-4">
        <p className="text-[11px] text-muted-foreground font-sans">
          {savedOk
            ? "✓ All changes saved."
            : saveError
              ? saveError
              : "Unsaved changes will be lost if you leave."}
        </p>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-9 px-5 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none gap-2 shrink-0 transition-opacity"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Saving Settings…</span>
            </>
          ) : (
            <>
              <Save className="size-3.5" />
              <span>Save Settings</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
