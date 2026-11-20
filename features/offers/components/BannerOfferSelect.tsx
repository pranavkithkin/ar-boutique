"use client"

import { useEffect, useState } from "react"
import { bannerOfferChoicesAction } from "../actions"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"

export function BannerOfferSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [offers, setOffers] = useState<{ slug: string; title: string }[]>([])
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    bannerOfferChoicesAction().then(rows => { if (active) setOffers(rows) }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [])
  return <Field>
    <FieldLabel htmlFor="banner-offer">Link to an offer (optional)</FieldLabel>
    <Select value={offers.some(o => `/offers/${o.slug}` === value) ? value : "custom"} onValueChange={v => { if (v) onChange(v === "custom" ? "" : v) }}>
      <SelectTrigger id="banner-offer" className="w-full"><SelectValue>{offers.find(o => `/offers/${o.slug}` === value)?.title ?? "Custom destination link"}</SelectValue></SelectTrigger>
      <SelectContent><SelectGroup><SelectItem value="custom">Custom destination link</SelectItem>{offers.map(o => <SelectItem key={o.slug} value={`/offers/${o.slug}`}>{o.title}</SelectItem>)}</SelectGroup></SelectContent>
    </Select>
    <FieldDescription>{error ? "Offer choices could not be loaded. You can paste an offer link below." : "Choose a published offer to fill the destination link. Scheduled offers become usable at their start time."}</FieldDescription>
  </Field>
}
