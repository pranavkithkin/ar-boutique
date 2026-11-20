import type { ProductOfferTag } from "@/features/offers/types"

export interface SearchResultItem {
  id: string
  name: string
  slug: string
  categoryName: string
  styleCode?: string
  colourName?: string
  priceFils: number
  formattedPrice: string
  mediaKey: string
  imageSrc: string
  href: string
  offerTags?: ProductOfferTag[]
}

export interface SearchProductsResponse {
  success: boolean
  data: SearchResultItem[]
  query: string
  error?: string
}
