"use client"

import { useEffect, useState } from "react"
import { useCartStore } from "@/features/cart/store"
import { bestAutomaticOfferAction } from "../actions"
import type { OfferQuote } from "../types"

export function useOfferQuote(email?: string) {
  const items = useCartStore(s => s.items)
  const validEmail = email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? email.trim() : undefined
  const key = JSON.stringify([items.map(i => [i.variantId, i.productId, i.quantity]), validEmail])
  const [result, setResult] = useState<{ key: string; offer: { slug: string; title: string } | null; quote: OfferQuote | null; error?: string } | null>(null)
  useEffect(() => {
    if (!items.length) return
    let cancelled = false
    const load = async () => {
      try {
        const response = await bestAutomaticOfferAction(items, validEmail)
        if (!cancelled) setResult(response.success
          ? { key, offer: response.offer, quote: response.quote }
          : { key, offer: null, quote: null, error: response.error })
      } catch {
        if (!cancelled) setResult({ key, offer: null, quote: null, error: "Offers could not be checked. Please try again." })
      }
    }
    void load()
    const timer = setInterval(load, 60000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [items, validEmail, key])
  const current = result?.key === key ? result : null
  return { offer: current?.offer ?? null, quote: current?.quote ?? undefined, error: current?.error, pending: Boolean(items.length && !current) }
}
