"use client"

import { useEffect } from "react"
import { useCartStore } from "@/features/cart/store"

export function ClearCartOnSuccess() {
  const clearCart = useCartStore((state) => state.clearCart)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return null
}

