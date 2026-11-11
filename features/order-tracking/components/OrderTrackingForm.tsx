"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { StoreButton } from "@/components/store/StoreButton"
import { orderTrackingSchema, type OrderTrackingInput } from "../schemas"
import { trackOrderAction, type TrackingResult } from "../actions"
import { OrderTimeline } from "./OrderTimeline"

export function OrderTrackingForm() {
  const [result, setResult] = useState<TrackingResult | null>(null)
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<OrderTrackingInput>({
    resolver: zodResolver(orderTrackingSchema),
    defaultValues: { orderId: "", email: "" },
  })

  async function onSubmit(values: OrderTrackingInput) {
    setResult(null)
    try {
      setResult(await trackOrderAction(values))
    } catch {
      setResult({ success: false, error: "We couldn’t check your order right now. Please try again." })
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-6 p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" aria-busy={isSubmitting}>
          <Controller name="orderId" control={control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="tracking-order-id">Order Number or ID</FieldLabel>
              <Input {...field} id="tracking-order-id" placeholder="e.g. AR-1001" maxLength={64} spellCheck={false} autoCapitalize="none" autoComplete="off"
                aria-invalid={fieldState.invalid} aria-describedby="tracking-id-help tracking-id-error" disabled={isSubmitting}
                onChange={(event) => { field.onChange(event); setResult(null) }} />
              <p id="tracking-id-help" className="text-sm text-muted-foreground">Enter your Order Number (e.g. AR-1001) or Order ID from your confirmation email.</p>
              <FieldError id="tracking-id-error" errors={[fieldState.error]} />
            </Field>
          )} />
          <Controller name="email" control={control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="tracking-email">Checkout email</FieldLabel>
              <Input {...field} id="tracking-email" type="email" maxLength={254} autoComplete="email"
                aria-invalid={fieldState.invalid} aria-describedby="tracking-email-error" disabled={isSubmitting}
                onChange={(event) => { field.onChange(event); setResult(null) }} />
              <FieldError id="tracking-email-error" errors={[fieldState.error]} />
            </Field>
          )} />
          <StoreButton type="submit" disabled={isSubmitting} className="w-full gap-2">
            {isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {isSubmitting ? "Checking Your Order…" : "Track Your Order"}
          </StoreButton>
        </form>
        <div aria-live="polite" aria-atomic="true">
          {result && !result.success && <p role="alert" className="text-sm text-destructive">{result.error}</p>}
          {result?.success && (
            <section aria-labelledby="tracked-order-status" className="space-y-4 border-t border-border pt-6">
              <h2 id="tracked-order-status" className="font-heading text-2xl">{result.order.status}</h2>
              <dl className="space-y-3 text-sm">
                <div><dt className="text-muted-foreground">Order</dt><dd className="font-medium text-foreground">{result.order.orderNumber || result.order.orderId}</dd></div>
                {result.order.courier && <div><dt className="text-muted-foreground">Courier</dt><dd>{result.order.courier}</dd></div>}
                {result.order.trackingNumber && <div><dt className="text-muted-foreground">Tracking number</dt><dd className="break-all font-mono">{result.order.trackingNumber}</dd></div>}
              </dl>
              {!result.order.trackingNumber && <p className="text-sm text-muted-foreground">Courier tracking details will appear here when available.</p>}
              <OrderTimeline steps={result.order.timeline} />
            </section>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
