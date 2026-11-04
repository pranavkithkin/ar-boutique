"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { WishlistStore, WishlistItem } from "./types"
import {
  getCustomerWishlistAction,
  addToWishlistAction,
  removeFromWishlistAction,
  clearWishlistAction,
} from "./actions"

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isInitialized: false,

      syncWithDatabase: async () => {
        try {
          set({ isLoading: true })
          const res = await getCustomerWishlistAction()
          if (res.success && res.items) {
            const mapped: WishlistItem[] = res.items.map((it) => ({
              productId: it.productId,
              slug: it.productSlug,
              name: it.productName,
              price: it.priceText,
              imageSrc: it.imageSrc || "",
              colourName: it.colourName || undefined,
              addedAt: it.createdAt,
            }))
            set({ items: mapped, isInitialized: true, isLoading: false })
          } else if (res.requiresAuth) {
            // Unauthenticated: clear out any leftover cached items
            set({ items: [], isInitialized: true, isLoading: false })
          } else {
            set({ isLoading: false })
          }
        } catch {
          set({ isLoading: false })
        }
      },

      addItem: async (item) => {
        const { items } = get()
        if (items.some((i) => i.slug === item.slug)) {
          return { success: true }
        }

        // Call Supabase Server Action
        const res = await addToWishlistAction({
          slug: item.slug,
          productId: item.productId,
          name: item.name,
          price: item.price,
          imageSrc: item.imageSrc,
          colourName: item.colourName,
        })

        if (res.requiresAuth) {
          return { success: false, requiresAuth: true }
        }

        if (res.success) {
          const newItem: WishlistItem = {
            ...item,
            addedAt: new Date().toISOString(),
          }
          set((state) => ({ items: [newItem, ...state.items] }))
          return { success: true }
        }

        return { success: false }
      },

      removeItem: async (slug) => {
        // Optimistic UI update
        const previousItems = get().items
        set((state) => ({
          items: state.items.filter((i) => i.slug !== slug),
        }))

        const res = await removeFromWishlistAction(slug)
        if (!res.success && !res.requiresAuth) {
          // Revert if database removal failed
          set({ items: previousItems })
          return { success: false }
        }

        return { success: true }
      },

      toggleItem: async (item) => {
        const { items, addItem, removeItem } = get()
        if (items.some((i) => i.slug === item.slug)) {
          await removeItem(item.slug)
          return { success: true, state: "removed" }
        } else {
          const res = await addItem(item)
          if (res.requiresAuth) {
            return { success: false, requiresAuth: true }
          }
          return { success: res.success, state: "added" }
        }
      },

      isInWishlist: (slug) => {
        return get().items.some((i) => i.slug === slug)
      },

      clearWishlist: async () => {
        const previousItems = get().items
        set({ items: [] })

        const res = await clearWishlistAction()
        if (!res.success && !res.requiresAuth) {
          set({ items: previousItems })
          return { success: false }
        }

        return { success: true }
      },

      getItemCount: () => get().items.length,
    }),
    {
      name: "ar_boutique_wishlist",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      partialize: (state) => ({ items: state.items }),
    }
  )
)
