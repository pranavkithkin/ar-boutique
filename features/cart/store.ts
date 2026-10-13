"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { CartStore } from "./types"

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
            (item) => item.variantId === newItem.variantId
          )
          const safeQty = Number.isFinite(quantity)
            ? Math.min(Math.max(1, Math.trunc(quantity)), MAX_QUANTITY_PER_LINE)
            : 1

          if (existingIndex > -1) {
            const updatedItems = [...state.items]
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              ...newItem,
              quantity: Math.min(
                updatedItems[existingIndex].quantity + safeQty,
                MAX_QUANTITY_PER_LINE
              ),
            }
            return { items: updatedItems, isOpen: true }
          }

          return {
            items: [...state.items, { ...newItem, quantity: safeQty }],
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
    }
  )
)
