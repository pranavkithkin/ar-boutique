import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock server actions so store tests run predictably in Node environment
vi.mock("@/features/wishlist/actions", () => ({
  getCustomerWishlistAction: vi.fn().mockResolvedValue({ success: true, items: [] }),
  addToWishlistAction: vi.fn().mockResolvedValue({ success: true, isInWishlist: true }),
  removeFromWishlistAction: vi.fn().mockResolvedValue({ success: true, isInWishlist: false }),
  clearWishlistAction: vi.fn().mockResolvedValue({ success: true }),
}))

import { useWishlistStore } from "@/features/wishlist/store"
import { addToWishlistAction } from "@/features/wishlist/actions"

describe("useWishlistStore", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await useWishlistStore.getState().clearWishlist()
  })

  it("starts with an empty wishlist", () => {
    expect(useWishlistStore.getState().items).toEqual([])
    expect(useWishlistStore.getState().getItemCount()).toBe(0)
  })

  it("adds an item to the wishlist and calls Supabase server action", async () => {
    const res = await useWishlistStore.getState().addItem({
      productId: "prod-1",
      slug: "festive-kurta",
      name: "Festive Silk Kurta",
      price: "AED 850",
      imageSrc: "/images/test.jpg",
      colourName: "Ivory",
    })

    expect(res.success).toBe(true)
    const items = useWishlistStore.getState().items
    expect(items.length).toBe(1)
    expect(items[0].slug).toBe("festive-kurta")
    expect(items[0].name).toBe("Festive Silk Kurta")
    expect(useWishlistStore.getState().isInWishlist("festive-kurta")).toBe(true)
    expect(addToWishlistAction).toHaveBeenCalledWith({
      slug: "festive-kurta",
      productId: "prod-1",
      name: "Festive Silk Kurta",
      price: "AED 850",
      imageSrc: "/images/test.jpg",
      colourName: "Ivory",
    })
  })

  it("does not duplicate items with the same slug", async () => {
    const item = {
      productId: "prod-1",
      slug: "festive-kurta",
      name: "Festive Silk Kurta",
      price: "AED 850",
      imageSrc: "/images/test.jpg",
    }
    await useWishlistStore.getState().addItem(item)
    await useWishlistStore.getState().addItem(item)

    expect(useWishlistStore.getState().items.length).toBe(1)
  })

  it("toggles item membership properly", async () => {
    const item = {
      productId: "prod-2",
      slug: "embroidered-tunic",
      name: "Embroidered Tunic",
      price: "AED 620",
      imageSrc: "/images/test2.jpg",
    }

    const added = await useWishlistStore.getState().toggleItem(item)
    expect(added.state).toBe("added")
    expect(useWishlistStore.getState().isInWishlist("embroidered-tunic")).toBe(true)

    const removed = await useWishlistStore.getState().toggleItem(item)
    expect(removed.state).toBe("removed")
    expect(useWishlistStore.getState().isInWishlist("embroidered-tunic")).toBe(false)
  })

  it("removes an item by slug", async () => {
    await useWishlistStore.getState().addItem({
      productId: "prod-1",
      slug: "item-1",
      name: "Item 1",
      price: "AED 100",
      imageSrc: "/test.jpg",
    })
    await useWishlistStore.getState().addItem({
      productId: "prod-2",
      slug: "item-2",
      name: "Item 2",
      price: "AED 200",
      imageSrc: "/test.jpg",
    })

    await useWishlistStore.getState().removeItem("item-1")
    expect(useWishlistStore.getState().items.length).toBe(1)
    expect(useWishlistStore.getState().isInWishlist("item-1")).toBe(false)
    expect(useWishlistStore.getState().isInWishlist("item-2")).toBe(true)
  })

  it("signals requiresAuth when user is unauthenticated", async () => {
    vi.mocked(addToWishlistAction).mockResolvedValueOnce({
      success: false,
      requiresAuth: true,
      error: "Please sign in to save pieces to your wishlist.",
    })

    const res = await useWishlistStore.getState().addItem({
      productId: "prod-3",
      slug: "silk-saree",
      name: "Silk Saree",
      price: "AED 1200",
      imageSrc: "/test.jpg",
    })

    expect(res.requiresAuth).toBe(true)
    expect(res.success).toBe(false)
    expect(useWishlistStore.getState().isInWishlist("silk-saree")).toBe(false)
  })
})
