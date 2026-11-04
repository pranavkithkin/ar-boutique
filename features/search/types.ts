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
}

export interface SearchProductsResponse {
  success: boolean
  data: SearchResultItem[]
  query: string
  error?: string
}
