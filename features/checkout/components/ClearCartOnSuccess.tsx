"use client"

import { useEffect, useRef } from "react"
import { useCartStore } from "@/features/cart/store"

export function ClearCartOnSuccess() {
  const clearCart = useCartStore((state) => state.clearCart)
  const clearedRef = useRef(false)

  useEffect(() => {
    if (clearedRef.current) return
    clearedRef.current = true

    // Clear Zustand store state
    clearCart()

    // Explicitly wipe persistent localStorage to prevent async rehydration races
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("ar_boutique_cart")
        window.dispatchEvent(new Event("storage"))
      }
    } catch {
      // Ignore in restricted environments
    }
  }, [clearCart])

  return null
}
