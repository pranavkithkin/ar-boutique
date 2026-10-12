"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { CartItem, CartStore } from "./types"

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
          const existingIndex = state.items.findIndex(
            (item) => item.sku === newItem.sku
          )

          if (existingIndex > -1) {
            const updatedItems = [...state.items]
            const currentItem = updatedItems[existingIndex]
            const newQty = Math.min(
              currentItem.quantity + quantity,
              MAX_QUANTITY_PER_LINE
            )
            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: newQty,
            }
            return { items: updatedItems, isOpen: true }
          }

          const safeQty = Math.min(
            Math.max(1, quantity),
            MAX_QUANTITY_PER_LINE
          )

          return {
            items: [...state.items, { ...newItem, quantity: safeQty }],
            isOpen: true,
          }
        })
      },

      updateQuantity: (sku, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.sku !== sku),
            }
          }

          const safeQty = Math.min(quantity, MAX_QUANTITY_PER_LINE)

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
      partialize: (state) => ({ items: state.items }), // Persist items, not isOpen UI state
    }
  )
)
