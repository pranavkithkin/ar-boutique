"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
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
import { sizeSchema, SizeFormSchema } from "../schemas"
import { createSizeAction, updateSizeAction } from "../actions"
import { AdminSizeItem } from "../types"
import { Loader2, Ruler, Save } from "lucide-react"

interface SizeFormModalProps {
  isOpen: boolean
  onClose: () => void
  sizeToEdit?: AdminSizeItem | null
  existingCount: number
}

// Preset luxury garment size standards
const STANDARD_SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"]

interface SizeFormContentProps {
  sizeToEdit?: AdminSizeItem | null
  existingCount: number
  onClose: () => void
}

function SizeFormContent({
  sizeToEdit,
  existingCount,
  onClose,
}: SizeFormContentProps) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const isEdit = !!sizeToEdit

  const defaultValues: SizeFormSchema = {
    label: sizeToEdit?.label || "",
    sort: sizeToEdit ? sizeToEdit.sort : existingCount + 1,
    is_active: sizeToEdit ? sizeToEdit.is_active : true,
  }

  const {
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting },
  } = useForm<SizeFormSchema>({
    resolver: zodResolver(sizeSchema),
    defaultValues,
  })

  async function onSubmit(data: SizeFormSchema) {
    setErrorMessage(null)

    if (isEdit && sizeToEdit) {
      const res = await updateSizeAction(sizeToEdit.id, data)
      if (!res.success) {
        setErrorMessage(res.error || "Failed to update size.")
        return
      }
    } else {
      const res = await createSizeAction(data)
      if (!res.success) {
        setErrorMessage(res.error || "Failed to create size.")
        return
      }
    }

    onClose()
  }

  return (
    <>
      <DialogHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Ruler className="size-4 text-primary" />
          <DialogTitle className="font-sans text-lg font-semibold text-foreground">
            {isEdit ? "Edit Garment Size" : "Add Garment Size"}
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-muted-foreground font-sans mt-1">
          Size labels are preserved exactly as typed per boutique specifications (ADR-029).
        </DialogDescription>
      </DialogHeader>

      {errorMessage && (
        <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-none">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2" noValidate>
        <FieldGroup className="gap-4">
          {/* Size Label */}
          <Controller
            name="label"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor={field.name}
                  className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Size Label <span className="text-foreground">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="e.g. S, M, L, Free Size"
                  className="h-10 text-xs sm:text-sm bg-background border-input rounded-none mt-1.5 font-medium"
                />

                {/* Preset Quick Labels */}
                <div className="pt-2">
                  <span className="text-[10px] text-muted-foreground font-sans">
                    Standard Size Standards:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {STANDARD_SIZE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setValue("label", preset, { shouldValidate: true })}
                        className="px-2 py-0.5 text-[11px] font-mono border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors"
                      >
                        {preset}
                      </button>
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

          {/* Sort Order */}
          <Controller
            name="sort"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor={field.name}
                  className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Sort Priority Index
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="number"
                  min={0}
                  className="h-10 text-xs sm:text-sm bg-background border-input rounded-none mt-1.5"
                />
                <p className="text-[10px] text-muted-foreground font-sans mt-1">
                  Controls the left-to-right order in size pickers and matrix tables.
                </p>
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
                  id="size_is_active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5 rounded-none"
                />
                <div className="grid gap-0.5 leading-none">
                  <label
                    htmlFor="size_is_active"
                    className="text-xs font-sans font-medium text-foreground cursor-pointer select-none"
                  >
                    Active on Storefront
                  </label>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Visible in product size selector and storefront filters.
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
                <span>{isEdit ? "Save Size" : "Create Size"}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function SizeFormModal({
  isOpen,
  onClose,
  sizeToEdit,
  existingCount,
}: SizeFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-none border-border bg-card p-6">
        {isOpen && (
          <SizeFormContent
            key={sizeToEdit?.id || "new"}
            sizeToEdit={sizeToEdit}
            existingCount={existingCount}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
