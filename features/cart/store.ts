"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { CartStore } from "./types"
import { normaliseApprovedCartSku, restoreCartItems } from "./sku-migration"

const MAX_QUANTITY_PER_LINE = 5

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (newItem, quantity = 1) => {
        set((state) => {
          const incoming = normaliseApprovedCartSku(newItem)
          const items = restoreCartItems({ items: state.items })
          const existingIndex = items.findIndex(
            (item) => item.variantId === incoming.variantId
          )
          const safeQty = Number.isFinite(quantity)
            ? Math.min(Math.max(1, Math.trunc(quantity)), MAX_QUANTITY_PER_LINE)
            : 1

          if (existingIndex > -1) {
            items[existingIndex] = {
              ...items[existingIndex],
              ...incoming,
              quantity: Math.min(
                items[existingIndex].quantity + safeQty,
                MAX_QUANTITY_PER_LINE
              ),
            }
            return { items, isOpen: true }
          }

          return {
            items: [...items, { ...incoming, quantity: safeQty }],
            isOpen: true,
          }
        })
      },

      updateQuantity: (sku, quantity) => {
        set((state) => {
          if (!Number.isFinite(quantity)) return state
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.sku !== sku),
            }
          }

          const safeQty = Math.min(Math.max(1, Math.trunc(quantity)), MAX_QUANTITY_PER_LINE)

          return {
            items: state.items.map((item) =>
              item.sku === sku ? { ...item, quantity: safeQty } : item
            ),
          }
        })
      },

      removeItem: (sku) => {
        set((state) => ({
          items: state.items.filter((item) => item.sku !== sku),
        }))
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getSubtotalFils: () => {
        return get().items.reduce(
          (total, item) => total + item.priceFils * item.quantity,
          0
        )
      },
    }),
    {
      name: "ar_boutique_cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      // Keep version 0 readable and reconcile on every hydration, including
      // carts saved by an older tab before the catalogue rename was deployed.
      merge: (persisted, current) => ({
        ...current,
        items: restoreCartItems(persisted),
      }),
    }
  )
)
