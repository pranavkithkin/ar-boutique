"use client"

import { format } from "date-fns"
import { CalendarDays } from "lucide-react"
import { useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription, FieldGroup } from "@/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select"
import type { OfferInput } from "../schemas"
import { fromDubaiInput, toDubaiInput } from "../types"

export function OfferRuleFields() {
  const { control, watch } = useFormContext<OfferInput>()
  const [scheduleTimes, setScheduleTimes] = useState<Record<"starts_at" | "expires_at", string>>({ starts_at: "00:00", expires_at: "00:00" })
  const type = watch("discount_type")
  return <FieldGroup className="grid sm:grid-cols-2 gap-5">
    <Field><FieldLabel htmlFor="discount-type">Discount type</FieldLabel>
      <Controller name="discount_type" control={control} render={({ field }) => <Select value={field.value} onValueChange={v => field.onChange(v)}>
        <SelectTrigger id="discount-type" className="w-full"><SelectValue>{field.value === "percentage" ? "Percentage" : field.value === "fixed_fils" ? "Fixed amount" : "Free delivery"}</SelectValue></SelectTrigger>
        <SelectContent><SelectGroup><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed_fils">Fixed amount</SelectItem><SelectItem value="free_shipping">Free delivery</SelectItem></SelectGroup></SelectContent>
      </Select>} />
    </Field>
    {type !== "free_shipping" && <Field><FieldLabel htmlFor="discount-value">{type === "percentage" ? "Percentage" : "Discount (AED)"}</FieldLabel>
      <Controller name="discount_value" control={control} render={({ field }) => <Input id="discount-value" type="text" inputMode={type === "percentage" ? "numeric" : "decimal"} value={type === "fixed_fils" ? field.value / 100 : field.value} onChange={e => field.onChange(type === "fixed_fils" ? Math.round(Number(e.target.value) * 100) : Number(e.target.value))} />} />
    </Field>}
    {([['min_order_fils', 'Minimum eligible spend (AED)'], ['max_discount_fils', 'Maximum savings (AED)']] as const).filter(([name]) => type !== "free_shipping" || name !== "max_discount_fils").map(([name, label]) => <Field key={name}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel><Controller name={name} control={control} render={({ field }) => <Input id={name} type="text" inputMode="decimal" value={field.value == null ? "" : field.value / 100} onChange={e => field.onChange(e.target.value === "" ? name === "min_order_fils" ? 0 : null : Math.round(Number(e.target.value) * 100))} />} />
    </Field>)}
    {([['usage_limit', 'Total usage limit'], ['per_customer_limit', 'Orders per checkout email']] as const).map(([name, label]) => <Field key={name}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel><Controller name={name} control={control} render={({ field }) => <Input id={name} type="text" inputMode="numeric" value={field.value ?? ""} onChange={event => field.onChange(event.target.value === "" ? null : Number(event.target.value))} />} /><FieldDescription>Leave blank for unlimited.</FieldDescription>
    </Field>)}
    {([['starts_at', 'Starts'], ['expires_at', 'Ends']] as const).map(([name, label]) => <Field key={name}>
      <FieldLabel htmlFor={`${name}-date`}>{label} (UAE time)</FieldLabel><Controller name={name} control={control} render={({ field }) => {
        const dubaiValue = toDubaiInput(field.value)
        const dateValue = dubaiValue ? new Date(`${dubaiValue.slice(0, 10)}T00:00:00`) : undefined
        const timeValue = dubaiValue ? dubaiValue.slice(11, 16) : scheduleTimes[name]
        const setDate = (date: Date | undefined) => {
          if (!date) return
          const datePart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
          field.onChange(fromDubaiInput(`${datePart}T${timeValue}`))
        }
        return <div className="flex flex-col gap-2">
          <Popover>
            <PopoverTrigger id={`${name}-date`} className="flex h-10 w-full items-center justify-between border border-input bg-background px-3 text-left text-sm hover:bg-muted/20">
              <span className={dateValue ? "text-foreground" : "text-muted-foreground"}>{dateValue ? format(dateValue, "PPP") : "Choose date"}</span>
              <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateValue} onSelect={setDate} />
              {dateValue && <div className="border-t border-border p-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => { setScheduleTimes(current => ({ ...current, [name]: timeValue })); field.onChange(null) }}>Clear date</Button>
              </div>}
            </PopoverContent>
          </Popover>
          <Input id={`${name}-time`} aria-label={`${label} time (UAE)`} type="time" value={timeValue} onChange={event => {
            const nextTime = event.target.value
            setScheduleTimes(current => ({ ...current, [name]: nextTime }))
            if (dateValue) field.onChange(fromDubaiInput(`${dubaiValue.slice(0, 10)}T${nextTime}`))
          }} />
        </div>
      }} />
      <FieldDescription>Choose a date to apply this time. Without a date, this schedule remains unset.</FieldDescription>
    </Field>)}
  </FieldGroup>
}
