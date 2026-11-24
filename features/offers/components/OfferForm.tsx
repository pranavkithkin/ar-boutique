"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormProvider, useForm, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Field, FieldLabel, FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select"
import { offerSchema, type OfferInput } from "../schemas"
import type { Offer, OfferChoice } from "../types"
import { saveOfferAction } from "../actions"
import { OfferRuleFields } from "./OfferRuleFields"
import { OfferStyleCodeUpload } from "./OfferStyleCodeUpload"
import { formatAED } from "@/lib/money"

export function OfferForm({ offer, products, categories }: { offer?: Offer; products: OfferChoice[]; categories: OfferChoice[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [productChoices, setProductChoices] = useState(products)
  const form = useForm<OfferInput>({ resolver: zodResolver(offerSchema), defaultValues: offer ?? {
    title: "", slug: "", description: "", terms: "", status: "draft", discount_type: "percentage", discount_value: 10,
    scope: "all", product_ids: [], category_ids: [], min_order_fils: 0, max_discount_fils: null,
    usage_limit: null, per_customer_limit: null, starts_at: null, expires_at: null,
  } })
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = form
  const values = useWatch({ control })
  const targeting = values.scope === "categories" ? "category_ids" : "product_ids"
  const choices = values.scope === "categories" ? categories : productChoices
  const submit = handleSubmit(async input => {
    setError(null)
    try {
      const result = await saveOfferAction(offer?.id ?? null, input)
      if (!result.success) { setError(result.error); return }
      router.push("/admin/offers"); router.refresh()
    } catch { setError("Offer could not be saved. Please try again.") }
  })
  const preview = values.discount_type === "percentage" ? `${values.discount_value}% off` : values.discount_type === "free_shipping" ? "Free delivery" : `${formatAED(values.discount_value || 0)} off`
  return <FormProvider {...form}><form onSubmit={submit} className="mx-auto w-full min-w-0 max-w-4xl flex flex-col gap-6 p-4 sm:p-8">
    <Link href="/admin/offers" className="text-sm underline underline-offset-4">Back to offers</Link>
    <h1 className="text-2xl font-semibold">{offer ? "Edit offer" : "Create offer"}</h1>
    <Card><CardHeader><CardTitle>Campaign details</CardTitle><CardDescription>Create the page customers open from your banner.</CardDescription></CardHeader><CardContent>
      <FieldGroup>
        <Field><FieldLabel htmlFor="offer-title">Title</FieldLabel><Input id="offer-title" defaultValue={offer?.title ?? ""} {...register("title")} aria-invalid={!!errors.title} /></Field>
        <Field><FieldLabel htmlFor="offer-slug">Offer link: /offers/</FieldLabel><Input id="offer-slug" defaultValue={offer?.slug ?? ""} placeholder="festive-sale" {...register("slug")} aria-invalid={!!errors.slug} /><p className="text-sm text-muted-foreground">Use lowercase words separated by hyphens. If you change this link, update banners using the old link.</p></Field>
        <Field><FieldLabel htmlFor="offer-description">Description</FieldLabel><Textarea id="offer-description" defaultValue={offer?.description ?? ""} {...register("description")} /></Field>
        <Field><FieldLabel htmlFor="offer-terms">Additional terms</FieldLabel><Textarea id="offer-terms" defaultValue={offer?.terms ?? ""} {...register("terms")} /></Field>
        <Field><FieldLabel htmlFor="offer-status">Status</FieldLabel><Controller name="status" control={control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger id="offer-status"><SelectValue>{field.value === "draft" ? "Draft" : field.value === "published" ? "Published" : "Disabled"}</SelectValue></SelectTrigger><SelectContent><SelectGroup><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="disabled">Disabled</SelectItem></SelectGroup></SelectContent>
        </Select>} /></Field>
      </FieldGroup>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Discount and timing</CardTitle><CardDescription>Current prices are used, including existing sale prices. Offers cannot stack with coupons.</CardDescription></CardHeader><CardContent><OfferRuleFields /></CardContent></Card>
    <Card><CardHeader><CardTitle>Eligible pieces</CardTitle><CardDescription>Select the products or categories this offer covers.</CardDescription></CardHeader><CardContent className="flex flex-col gap-5">
      <Field><FieldLabel htmlFor="offer-scope">Applies to</FieldLabel><Controller name="scope" control={control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger id="offer-scope"><SelectValue>{field.value === "all" ? "All products" : field.value === "products" ? "Selected products" : "Selected categories"}</SelectValue></SelectTrigger><SelectContent><SelectGroup><SelectItem value="all">All products</SelectItem><SelectItem value="products">Selected products</SelectItem><SelectItem value="categories">Selected categories</SelectItem></SelectGroup></SelectContent>
      </Select>} /></Field>
      {values.scope === "products" && <OfferStyleCodeUpload onMatchedProducts={matched => setProductChoices(current => {
        const knownIds = new Set(current.map(product => product.id))
        return [...current, ...matched.filter(product => !knownIds.has(product.id))]
      })} />}
      {values.scope !== "all" && <FieldSet><FieldLegend>{values.scope === "products" ? "Products" : "Categories"}</FieldLegend><div className="max-h-72 overflow-y-auto border border-border p-3 flex flex-col gap-3">
        {choices.map(choice => <Controller key={choice.id} name={targeting} control={control} render={({ field }) => <label className="flex items-center gap-3 text-sm"><Checkbox checked={field.value.includes(choice.id)} onCheckedChange={checked => field.onChange(checked ? [...field.value, choice.id] : field.value.filter(id => id !== choice.id))} />{choice.name}</label>} />)}
        {!choices.length && <p className="text-sm text-muted-foreground">No choices available.</p>}
      </div></FieldSet>}
    </CardContent></Card>
    <p className="text-sm text-muted-foreground">Preview: {preview}{(values.min_order_fils ?? 0) > 0 ? ` on eligible spend of ${formatAED(values.min_order_fils ?? 0)} or more` : ""}.</p>
    {(error || Object.keys(errors).length > 0) && <div role="alert" className="text-sm text-destructive">{error || Object.values(errors).map(e => e.message).filter(Boolean).join(". ")}</div>}
    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save offer"}</Button>
  </form></FormProvider>
}
