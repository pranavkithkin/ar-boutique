"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field"
import {
  adminProductSchema,
  AdminProductFormValues,
} from "../schemas"
import {
  createAdminProduct,
  updateAdminProduct,
} from "../actions"
import { AdminCategory, AdminProductDetail, AdminSize, AdminColour } from "../types"
import { ProductVariantsManager } from "./ProductVariantsManager"
import { formatAED } from "@/lib/money"
import {
  ArrowLeft,
  Save,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react"

interface ProductFormProps {
  initialProduct?: AdminProductDetail | null
  categories: AdminCategory[]
  sizes?: AdminSize[]
  colours?: AdminColour[]
  mode: "create" | "edit"
}

export function ProductForm({
  initialProduct,
  categories,
  sizes = [],
  colours = [],
  mode,
}: ProductFormProps) {
  const router = useRouter()
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const defaultValues: AdminProductFormValues = {
    name: initialProduct?.name || "",
    slug: initialProduct?.slug || "",
    category_id: initialProduct?.category_id || "",
    description: initialProduct?.description || "",
    status: initialProduct?.status || "draft",
    is_final_sale: initialProduct?.is_final_sale || false,
    seo_title: initialProduct?.seo_title || "",
    seo_description: initialProduct?.seo_description || "",
  }

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { isSubmitting, isDirty },
  } = useForm<AdminProductFormValues>({
    resolver: zodResolver(adminProductSchema),
    defaultValues,
  })

  // Auto-generate slug from name in create mode
  function handleNameChange(val: string) {
    if (mode === "create") {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
      setValue("slug", autoSlug, { shouldValidate: true })
    }
  }

  async function onSubmit(data: AdminProductFormValues) {
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      if (mode === "create") {
        const res = await createAdminProduct(data)
        if (!res.success) {
          setErrorMessage(res.error || "Failed to create product.")
          return
        }
        setSuccessMessage("Product created successfully! Redirecting...")
        setTimeout(() => {
          router.push(`/admin/products/${res.productId}`)
          router.refresh()
        }, 1200)
      } else if (initialProduct) {
        const res = await updateAdminProduct(initialProduct.id, data)
        if (!res.success) {
          setErrorMessage(res.error || "Failed to update product.")
          return
        }
        setSuccessMessage("Product details saved successfully.")
        setTimeout(() => setSuccessMessage(null), 4000)
        router.refresh()
      }
    } catch {
      setErrorMessage("An unexpected error occurred while saving the product.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-none border-border size-8"
            render={<Link href="/admin/products" />}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {mode === "create" ? "New Product" : "Edit Catalogue Item"}
              </span>
              {initialProduct?.status && (
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-muted border border-border">
                  {initialProduct.status}
                </span>
              )}
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-0.5">
              {mode === "create"
                ? "Create Product"
                : initialProduct?.name || "Product Details"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {mode === "edit" && initialProduct && (
            <Button
              variant="outline"
              className="h-9 px-3 text-xs font-sans rounded-none gap-1.5"
              render={
                <Link
                  href={`/collections/${initialProduct.slug}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <ExternalLink className="size-3.5" />
              <span>View Live</span>
            </Button>
          )}

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
                <span>{mode === "create" ? "Create Product" : "Save Changes"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-none flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-none flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Core Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border p-6 rounded-none space-y-5">
            <h2 className="font-sans text-base font-semibold text-foreground border-b border-border pb-3">
              Core Garment Details
            </h2>

            <FieldGroup className="gap-5">
              {/* Product Name */}
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor={field.name}
                      className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground"
                    >
                      Product Name <span className="text-foreground">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="e.g. Set AR0478"
                      onChange={(e) => {
                        field.onChange(e)
                        handleNameChange(e.target.value)
                      }}
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

              {/* URL Slug */}
              <Controller
                name="slug"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor={field.name}
                      className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground"
                    >
                      Storefront Slug (URL) <span className="text-foreground">*</span>
                    </FieldLabel>
                    <div className="flex items-center mt-1.5 border border-input bg-background rounded-none overflow-hidden">
                      <span className="px-3 text-xs font-mono text-muted-foreground bg-muted/40 border-r border-input py-2.5">
                        /collections/
                      </span>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="set-j0478"
                        className="h-10 text-xs sm:text-sm bg-background border-none rounded-none font-mono focus-visible:ring-0"
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldError className="text-[11px] text-destructive mt-1">
                        {fieldState.error?.message}
                      </FieldError>
                    )}
                  </Field>
                )}
              />

              {/* Creative Description */}
              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor={field.name}
                      className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground"
                    >
                      Creative Description (Atelier Notes)
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      value={field.value || ""}
                      rows={5}
                      placeholder="Crafted with pure organza and hand embroidery..."
                      className="text-xs sm:text-sm bg-background border-input rounded-none mt-1.5 leading-relaxed resize-y"
                    />
                    {fieldState.invalid && (
                      <FieldError className="text-[11px] text-destructive mt-1">
                        {fieldState.error?.message}
                      </FieldError>
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>



          {/* Editable Variants & Inventory Stock (Edit Mode) */}
          {mode === "edit" && initialProduct && (
            <div className="space-y-4 pt-2">
              <div>
                <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Inventory & Variants
                </span>
                <h2 className="font-sans text-lg sm:text-xl font-semibold text-foreground mt-0.5">
                  Variants, SKUs & Stock Management
                </h2>
                <p className="text-xs text-muted-foreground font-sans mt-1">
                  Edit client style codes, SKUs, sizes, AED prices, and perform instant inventory stock adjustments.
                </p>
              </div>

              <ProductVariantsManager
                productId={initialProduct.id}
                colourways={initialProduct.colourways}
                sizes={sizes}
                colours={colours}
              />
            </div>
          )}
        </div>

        {/* Right 1 Col: Status & Classification */}
        <div className="space-y-6">
          {/* Classification & Publication */}
          <div className="bg-card border border-border p-6 rounded-none space-y-5">
            <h2 className="font-sans text-base font-semibold text-foreground border-b border-border pb-3">
              Status & Category
            </h2>

            <FieldGroup className="gap-5">
              {/* Publication Status */}
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel
                      htmlFor={field.name}
                      className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground"
                    >
                      Catalogue Status
                    </FieldLabel>
                    <select
                      {...field}
                      id={field.name}
                      className="h-10 px-3 text-xs font-sans bg-background border border-input rounded-none text-foreground w-full mt-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="draft">Draft (Hidden from Storefront)</option>
                      <option value="published">Published (Live Online)</option>
                      <option value="archived">Archived (Deactivated)</option>
                    </select>
                  </Field>
                )}
              />

              {/* Category */}
              <Controller
                name="category_id"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor={field.name}
                      className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground"
                    >
                      Garment Category
                    </FieldLabel>
                    <select
                      {...field}
                      id={field.name}
                      value={field.value || ""}
                      className="h-10 px-3 text-xs font-sans bg-background border border-input rounded-none text-foreground w-full mt-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="">Select Category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {fieldState.invalid && (
                      <FieldError className="text-[11px] text-destructive mt-1">
                        {fieldState.error?.message}
                      </FieldError>
                    )}
                  </Field>
                )}
              />

              {/* Final Sale Checkbox */}
              <Controller
                name="is_final_sale"
                control={control}
                render={({ field }) => (
                  <div className="flex items-start gap-2.5 pt-2 border-t border-border/60">
                    <Checkbox
                      id="is_final_sale"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5 rounded-none"
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor="is_final_sale"
                        className="text-xs font-sans font-medium text-foreground cursor-pointer select-none"
                      >
                        Final Sale (Non-Returnable)
                      </label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Items flagged as final sale cannot be refunded or exchanged per our store policy.
                      </p>
                    </div>
                  </div>
                )}
              />
            </FieldGroup>
          </div>

          {/* Product Visuals & Attached Media */}
          {mode === "edit" && initialProduct && (
            <div className="bg-card border border-border p-6 rounded-none space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="size-4 text-muted-foreground" />
                  <h3 className="font-sans text-sm font-semibold text-foreground">
                    Product Visuals
                  </h3>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {initialProduct.colourways.length} Colourways
                </span>
              </div>

              <div className="space-y-4">
                {initialProduct.colourways.map((cw) => (
                  <div key={cw.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="font-medium text-foreground">{cw.colour_name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">Style: {cw.style_code}</span>
                    </div>
                    {cw.images.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {cw.images.map((img) => (
                          <div key={img.id} className="relative aspect-[3/4] border border-border/80 bg-muted/40 overflow-hidden">
                            <Image
                              src={img.url}
                              alt={img.alt || cw.colour_name}
                              fill
                              sizes="120px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center border border-dashed border-border text-[11px] text-muted-foreground font-mono">
                        No photos uploaded yet
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
