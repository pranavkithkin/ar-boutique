"use client"

import { useState, type ChangeEvent } from "react"
import { useFormContext } from "react-hook-form"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { OfferInput } from "../schemas"
import type { OfferChoice } from "../types"
import { matchOfferStyleCodesAction } from "../actions"

export function OfferStyleCodeUpload({ onMatchedProducts }: { onMatchedProducts: (products: OfferChoice[]) => void }) {
  const { getValues, setValue } = useFormContext<OfferInput>()
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (!file) return

    setError(null)
    setMessage(null)
    setIsPending(true)
    try {
      const formData = new FormData()
      formData.set("file", file)
      const result = await matchOfferStyleCodesAction(formData)
      if (!result.success) {
        setError(result.error)
        return
      }

      const selected = new Set(getValues("product_ids"))
      const previousCount = selected.size
      for (const product of result.matchedProducts) selected.add(product.id)
      onMatchedProducts(result.matchedProducts)
      setValue("product_ids", [...selected], { shouldDirty: true, shouldValidate: true })

      const addedCount = selected.size - previousCount
      const unmatched = result.unmatchedStyleCodeCount
        ? ` ${result.unmatchedStyleCodeCount} style code${result.unmatchedStyleCodeCount === 1 ? " was" : "s were"} not matched${result.unmatchedStyleCodeExamples.length ? ` (for example: ${result.unmatchedStyleCodeExamples.join(", ")})` : ""}.`
        : ""
      setMessage(`Added ${addedCount} product${addedCount === 1 ? "" : "s"} from ${result.matchedStyleCodeCount} matching style code${result.matchedStyleCodeCount === 1 ? "" : "s"}.${unmatched}`)
    } catch {
      setError("The style code file could not be processed. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Field>
      <FieldLabel htmlFor="offer-style-code-file">Select products from style codes</FieldLabel>
      <Input id="offer-style-code-file" type="file" accept=".csv,.xlsx" disabled={isPending} onChange={handleFileChange} />
      <FieldDescription>Upload a CSV or Excel file with a “Style Code” or “Style” column. Matching products are added to the selection; offers apply to all active colours and sizes of each selected product.</FieldDescription>
      {isPending && <p role="status" className="text-sm text-muted-foreground">Matching style codes…</p>}
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </Field>
  )
}
