export interface WishlistItem {
  productId: string
  slug: string
  name: string
  price: string
  imageSrc: string
  colourName?: string
  addedAt: string
}

export interface WishlistStore {
  items: WishlistItem[]
  isLoading: boolean
  isInitialized: boolean
  syncWithDatabase: () => Promise<void>
  addItem: (item: Omit<WishlistItem, "addedAt">) => Promise<{ success: boolean; requiresAuth?: boolean }>
  removeItem: (slug: string) => Promise<{ success: boolean }>
  toggleItem: (item: Omit<WishlistItem, "addedAt">) => Promise<{ success: boolean; requiresAuth?: boolean; state?: "added" | "removed" }>
  isInWishlist: (slug: string) => boolean
  clearWishlist: () => Promise<{ success: boolean }>
  getItemCount: () => number
}
