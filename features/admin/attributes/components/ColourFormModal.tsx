"use client"

import * as React from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { colourSchema, ColourFormSchema } from "../schemas"
import { createColourAction, updateColourAction } from "../actions"
import { AdminColourItem } from "../types"
import { Loader2, Palette, Save } from "lucide-react"

interface ColourFormModalProps {
  isOpen: boolean
  onClose: () => void
  colourToEdit?: AdminColourItem | null
}

// Preset boutique catalogue colour swatches for quick pick
const LUXURY_SWATCH_PRESETS = [
  { name: "Green", hex: "#2D6A4F" },
  { name: "Teal", hex: "#006D77" },
  { name: "Mustard", hex: "#E3A857" },
  { name: "Light Yellow", hex: "#FFF3B0" },
  { name: "Cream", hex: "#FDFBF7" },
  { name: "Brown", hex: "#5E412F" },
  { name: "Blue", hex: "#1D3557" },
  { name: "Off White", hex: "#F5F2EB" },
  { name: "Light Blue", hex: "#A8DADC" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Sage Green", hex: "#8A9A86" },
  { name: "Purple", hex: "#582C4D" },
  { name: "Pink", hex: "#E09F9C" },
  { name: "Beige", hex: "#E6D7B9" },
  { name: "Black", hex: "#1A1A1A" },
  { name: "Sage", hex: "#9DA39A" },
  { name: "Sea green", hex: "#2E8B57" },
]

interface ColourFormContentProps {
  colourToEdit?: AdminColourItem | null
  onClose: () => void
}

function ColourFormContent({
  colourToEdit,
  onClose,
}: ColourFormContentProps) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const isEdit = !!colourToEdit

  const defaultValues: ColourFormSchema = {
    name: colourToEdit?.name || "",
    swatch_hex: colourToEdit?.swatch_hex || "#2D6A4F",
    is_active: colourToEdit ? colourToEdit.is_active : true,
  }

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<ColourFormSchema>({
    resolver: zodResolver(colourSchema),
    defaultValues,
  })

  const swatchHex = useWatch({ control, name: "swatch_hex" })

  async function onSubmit(data: ColourFormSchema) {
    setErrorMessage(null)

    if (isEdit && colourToEdit) {
      const res = await updateColourAction(colourToEdit.id, data)
      if (!res.success) {
        setErrorMessage(res.error || "Failed to update colour.")
        return
      }
    } else {
      const res = await createColourAction(data)
      if (!res.success) {
        setErrorMessage(res.error || "Failed to create colour.")
        return
      }
    }

    onClose()
  }

  return (
    <>
      <DialogHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          <DialogTitle className="font-sans text-lg font-semibold text-foreground">
            {isEdit ? "Edit Boutique Colour" : "Add Boutique Colour"}
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-muted-foreground font-sans mt-1">
          Names are preserved exactly as typed per boutique specifications (ADR-029).
        </DialogDescription>
      </DialogHeader>

      {errorMessage && (
        <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-none">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2" noValidate>
        <FieldGroup className="gap-4">
          {/* Colour Name */}
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor={field.name}
                  className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Colour Name <span className="text-foreground">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="e.g. Pine Green"
                  className="h-10 text-xs sm:text-sm bg-background border-input rounded-none mt-1.5"
                />
                {fieldState.invalid && (
                  <FieldError className="text-[11px] text-destructive mt-1">
                    {fieldState.error?.message}
                  </FieldError>
                )}
              </Field>
            )}
          />

          {/* Visual Swatch Hex */}
          <Controller
            name="swatch_hex"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor={field.name}
                  className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Visual Swatch Hex
                </FieldLabel>
                <div className="flex items-center gap-3 mt-1.5">
                  <div
                    className="size-10 rounded-full border border-border shrink-0 shadow-sm transition-colors"
                    style={{ backgroundColor: swatchHex || "#ffffff" }}
                  />
                  <input
                    type="color"
                    value={swatchHex || "#2D6A4F"}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="size-10 p-0 border border-input rounded-none cursor-pointer bg-background"
                    title="Select Swatch Color"
                  />
                  <Input
                    id={field.name}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="#2D6A4F"
                    className="h-10 text-xs font-mono uppercase bg-background border-input rounded-none flex-1"
                  />
                </div>

                {/* Preset Quick Swatches */}
                <div className="pt-2">
                  <span className="text-[10px] text-muted-foreground font-sans">
                    Quick Boutique Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {LUXURY_SWATCH_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => field.onChange(p.hex)}
                        className="size-5 rounded-full border border-border/80 hover:scale-110 transition-transform"
                        style={{ backgroundColor: p.hex }}
                        title={`${p.name} (${p.hex})`}
                      />
                    ))}
                  </div>
                </div>

                {fieldState.invalid && (
                  <FieldError className="text-[11px] text-destructive mt-1">
                    {fieldState.error?.message}
                  </FieldError>
                )}
              </Field>
            )}
          />

          {/* Active Toggle */}
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <div className="flex items-start gap-2.5 pt-2 border-t border-border/60">
                <Checkbox
                  id="colour_is_active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5 rounded-none"
                />
                <div className="grid gap-0.5 leading-none">
                  <label
                    htmlFor="colour_is_active"
                    className="text-xs font-sans font-medium text-foreground cursor-pointer select-none"
                  >
                    Active on Storefront
                  </label>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Visible in storefront colour filters and colourway selectors.
                  </p>
                </div>
              </div>
            )}
          />
        </FieldGroup>

        <DialogFooter className="pt-4 border-t border-border flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-9 px-4 text-xs font-sans rounded-none"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-9 px-4 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>{isEdit ? "Save Colour" : "Create Colour"}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function ColourFormModal({
  isOpen,
  onClose,
  colourToEdit,
}: ColourFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg rounded-none border-border bg-card p-6">
        {isOpen && (
          <ColourFormContent
            key={colourToEdit?.id || "new"}
            colourToEdit={colourToEdit}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
