export type BannerPlacement = "hero" | "promo"

export interface AdminBannerItem {
  id: string
  placement: BannerPlacement
  eyebrow: string | null
  title: string
  subtitle: string | null
  button_label: string | null
  button_link: string | null
  desktop_image_key: string | null
  desktop_image_url: string | null
  mobile_image_key: string | null
  mobile_image_url: string | null
  sort: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

export interface BannerMutationResponse {
  success: boolean
  error?: string
  bannerId?: string
}

export interface BannerFormData {
  placement: BannerPlacement
  eyebrow?: string | null
  title: string
  subtitle?: string | null
  button_label?: string | null
  button_link?: string | null
  sort?: number
  is_active?: boolean
  starts_at?: string | null
  ends_at?: string | null
}

export interface StorefrontPromoBanner {
  id: string
  imageSrc: string
  imageAlt: string
  imageFit?: "cover" | "contain"
  eyebrow: string
  title: string
  description: string
  buttonText: string
  buttonHref: string
}

export interface StorefrontHeroSlide {
  id: string
  imageSrc: string
  mobileImageSrc?: string
  alt: string
  href: string
}


