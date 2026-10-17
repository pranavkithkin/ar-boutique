"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AccountAddress } from "../types"
import { addressSchema, type AddressFormValues } from "../schemas"
import { StoreButton } from "@/components/store/StoreButton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Plus, Check, Trash2, Edit3, Home, Building2 } from "lucide-react"

interface AddressesTabProps {
  addresses: AccountAddress[]
  onUpdateAddresses: (addresses: AccountAddress[]) => void
}

const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
] as const

export function AddressesTab({
  addresses,
  onUpdateAddresses,
}: AddressesTabProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingAddress, setEditingAddress] = React.useState<AccountAddress | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "Home",
      recipientName: "",
      phone: "+971 ",
      emirate: "Dubai",
      area: "",
      street: "",
      building: "",
      apartment: "",
      landmark: "",
      isDefault: false,
    },
  })

  // Open modal for editing or new
  const handleOpenAdd = () => {
    setEditingAddress(null)
    reset({
      label: "Home",
      recipientName: "",
      phone: "+971 ",
      emirate: "Dubai",
      area: "",
      street: "",
      building: "",
      apartment: "",
      landmark: "",
      isDefault: addresses.length === 0,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (addr: AccountAddress) => {
    setEditingAddress(addr)
    reset({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      emirate: addr.emirate as AddressFormValues["emirate"],
      area: addr.area,
      street: addr.street,
      building: addr.building,
      apartment: addr.apartment || "",
      landmark: addr.landmark || "",
      isDefault: addr.isDefault,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id)
    // If deleted address was default and other addresses remain, make the first default
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true
    }
    onUpdateAddresses(updated)
  }

  const handleSetDefault = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }))
    onUpdateAddresses(updated)
  }

  const onSubmit = (data: AddressFormValues) => {
    let updated: AccountAddress[]
    if (editingAddress) {
      updated = addresses.map((a) => {
        if (a.id === editingAddress.id) {
          return {
            ...a,
            ...data,
          }
        }
        return data.isDefault ? { ...a, isDefault: false } : a
      })
    } else {
      const newAddr: AccountAddress = {
        id: `addr_${addresses.length + 1}_${data.area.slice(0, 3)}`,
        ...data,
      }
      if (data.isDefault) {
        updated = [newAddr, ...addresses.map((a) => ({ ...a, isDefault: false }))]
      } else {
        updated = [...addresses, newAddr]
      }
    }

    onUpdateAddresses(updated)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-sans font-semibold tracking-tight text-foreground">Delivery Addresses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your saved UAE shipping addresses for rapid, one-click checkout.
          </p>
        </div>

        <StoreButton
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 h-10 px-4 text-xs uppercase tracking-widest self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add New Address
        </StoreButton>
      </div>

      {/* Address Grid or Empty State */}
      {addresses.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-xs">
          <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-60" />
          <h3 className="text-base font-sans font-semibold text-foreground">No saved addresses</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            You haven&apos;t added any delivery addresses yet. Add your primary residence for rapid, 1-click checkout.
          </p>
          <div className="mt-6">
            <StoreButton
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 h-10 px-4 text-xs uppercase tracking-widest"
            >
              <Plus className="h-4 w-4" />
              Add First Address
            </StoreButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`relative p-5 rounded-xs border transition-all flex flex-col justify-between ${
              addr.isDefault
                ? "bg-card border-foreground/30 shadow-xs ring-1 ring-foreground/20"
                : "bg-card border-border hover:border-border/80"
            }`}
          >
            <div>
              {/* Top row */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-muted/50 rounded-xs text-foreground">
                    {addr.label.toLowerCase().includes("office") ||
                    addr.label.toLowerCase().includes("atelier") ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <Home className="h-4 w-4" />
                    )}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {addr.label}
                  </span>
                </div>

                {addr.isDefault && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] uppercase tracking-wider font-semibold">
                    Default
                  </Badge>
                )}
              </div>

              {/* Recipient info */}
              <div className="space-y-1 text-xs text-muted-foreground mt-2">
                <p className="font-medium text-foreground text-sm">
                  {addr.recipientName}
                </p>
                <p>{addr.building}{addr.apartment ? `, ${addr.apartment}` : ""}</p>
                <p>{addr.street}</p>
                <p className="font-medium text-foreground">
                  {addr.area}, {addr.emirate}
                </p>
                {addr.landmark && (
                  <p className="text-[11px] italic text-muted-foreground/80">
                    Note: {addr.landmark}
                  </p>
                )}
                <p className="pt-2 text-foreground font-mono">{addr.phone}</p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-5 mt-4 border-t border-border/50 flex items-center justify-between gap-2 text-xs">
              <div>
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium underline-offset-4 hover:underline"
                  >
                    Set as default
                  </button>
                ) : (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Check className="h-3 w-3 text-success" /> Primary shipping
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(addr)}
                  aria-label={`Edit ${addr.label}`}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-xs hover:bg-muted"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                {addresses.length > 1 && (
                  <button
                    onClick={() => handleDelete(addr.id)}
                    aria-label={`Delete ${addr.label}`}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-xs hover:bg-muted"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

      {/* Add / Edit Address Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-sans font-semibold tracking-tight">
              {editingAddress ? "Edit Delivery Address" : "Add New UAE Address"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide your residential or office destination across the UAE.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FieldGroup className="gap-3.5">
              {/* Address Label */}
              <Controller
                name="label"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Address Label *
                    </FieldLabel>
                    <Input
                      {...field}
                      placeholder="e.g. Home Villa, Downtown Office"
                      className="h-10 text-xs bg-background"
                    />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />

              {/* Recipient Full Name */}
              <Controller
                name="recipientName"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Recipient Full Name *
                    </FieldLabel>
                    <Input
                      {...field}
                      placeholder="e.g. Fatima Al Mansoori"
                      className="h-10 text-xs bg-background"
                    />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />

              {/* Phone & Emirate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Controller
                  name="phone"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Phone Number (+971) *
                      </FieldLabel>
                      <Input
                        {...field}
                        placeholder="+971 50 123 4567"
                        className="h-10 text-xs bg-background font-mono"
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="emirate"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Emirate *
                      </FieldLabel>
                      <select
                        {...field}
                        className="w-full h-10 px-3 text-xs bg-background border border-input rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {EMIRATES.map((em) => (
                          <option key={em} value={em}>
                            {em}
                          </option>
                        ))}
                      </select>
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Area & Street */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Controller
                  name="area"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Area / District *
                      </FieldLabel>
                      <Input
                        {...field}
                        placeholder="e.g. Jumeirah 1, Al Bateen"
                        className="h-10 text-xs bg-background"
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="street"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Street Address *
                      </FieldLabel>
                      <Input
                        {...field}
                        placeholder="e.g. Al Wasl Road, 12B Street"
                        className="h-10 text-xs bg-background"
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Building & Apartment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Controller
                  name="building"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Villa or Building Name *
                      </FieldLabel>
                      <Input
                        {...field}
                        placeholder="e.g. Villa 48, Tower A"
                        className="h-10 text-xs bg-background"
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="apartment"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Apt / Suite (Optional)
                      </FieldLabel>
                      <Input
                        {...field}
                        placeholder="e.g. Apt 302"
                        className="h-10 text-xs bg-background"
                      />
                    </Field>
                  )}
                />
              </div>

              {/* Landmark */}
              <Controller
                name="landmark"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Nearby Landmark / Driver Note (Optional)
                    </FieldLabel>
                    <Input
                      {...field}
                      placeholder="e.g. Near BoxPark, opposite mosque"
                      className="h-10 text-xs bg-background"
                    />
                  </Field>
                )}
              />

              {/* Default Checkbox */}
              <Controller
                name="isDefault"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="isDefault"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <label
                      htmlFor="isDefault"
                      className="text-xs text-foreground font-sans cursor-pointer"
                    >
                      Set as primary delivery address
                    </label>
                  </div>
                )}
              />
            </FieldGroup>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                Cancel
              </button>
              <StoreButton
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 text-xs uppercase tracking-widest"
              >
                {editingAddress ? "Save Changes" : "Save Address"}
              </StoreButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
