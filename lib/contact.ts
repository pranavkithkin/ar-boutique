/**
 * Storefront contact details for AR Boutique concierge.
 * Centralized fallback structure.
 * Values default to empty so only genuine details saved in Admin Settings are used.
 */
export const STORE_CONTACT = {
  phone: "",
  phoneHref: "",
  whatsapp: "",
  whatsappHref: "",
  email: "",
  emailHref: "",
  atelier: "",
  atelierHref: "",
  instagram: "",
  instagramHref: "",
  facebook: "",
  facebookHref: "",
} as const

/**
 * Builds a direct WhatsApp chat URL with optional pre-filled inquiry text.
 * Strips out non-digit characters from the input phone/WhatsApp number.
 */
export function buildWhatsAppHref(phoneOrNumber?: string | null, text?: string): string | null {
  if (!phoneOrNumber) return null
  const clean = phoneOrNumber.replace(/[^0-9]/g, "")
  if (!clean) return null
  const base = `https://wa.me/${clean}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

/**
 * Normalizes an address or Google Maps URL into an executable link.
 */
export function buildGoogleMapsHref(addressOrUrl?: string | null): string | null {
  if (!addressOrUrl) return null
  const trimmed = addressOrUrl.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  return `https://maps.google.com/?q=${encodeURIComponent(trimmed)}`
}
