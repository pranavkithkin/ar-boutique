/**
 * Types for the admin settings feature.
 * Matches the `settings` table (one-row config, TASK-012 / TASK-096).
 * All money values are in fils (AED × 100).
 */
export interface StoreSettings {
  // Store identity
  store_name: string
  store_email: string
  store_phone: string
  store_address: string
  trn: string // Tax Registration Number

  // VAT
  vat_enabled: boolean
  vat_rate_pct: number // e.g. 5 for 5 %

  // Delivery
  delivery_fee_fils: number
  free_delivery_over_fils: number

  // Returns
  return_window_days: number
  return_expiry_days: number // days before approved return expires
  return_instructions: string

  // Storefront
  announcement_bar_text: string
  announcement_bar_enabled: boolean

  // Notifications
  admin_notification_email: string

  // Low stock
  low_stock_threshold: number

  // Cash on delivery
  cod_enabled: boolean
  cod_fee_fils: number
  cod_max_order_fils: number
  cod_confirm_hours: number // hours admin has to confirm
  cod_refused_block_count: number // refusals before customer is blocked

  // FAQs
  faqs: FAQItem[]
}

export interface FAQItem {
  id?: string
  question: string
  answer: string
}

export const DEFAULT_FAQS: FAQItem[] = [
  {
    id: "faq_1",
    question: "What are your delivery timeframes across the UAE?",
    answer:
      "We offer next-day delivery across Dubai and Abu Dhabi for orders confirmed before 2:00 PM. Deliveries to Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain typically arrive within 1 to 2 business days. Complimentary delivery is provided on all orders of AED 200 or more.",
  },
  {
    id: "faq_2",
    question: "How does Cash on Delivery (COD) work?",
    answer:
      "Cash on delivery is available throughout the United Arab Emirates. Once you place a COD order, our concierge team will reach out via WhatsApp or phone to confirm your delivery address and schedule before dispatching your package.",
  },
  {
    id: "faq_3",
    question: "What is your return and exchange policy?",
    answer:
      "We offer a 14-day return window from the date of delivery. Items must be unworn, in original condition with all boutique tags and luxury garment packaging intact. Card refunds are processed back to the original method, while COD refunds are issued via secure UAE bank transfer.",
  },
  {
    id: "faq_4",
    question: "Can I receive personal sizing and styling guidance?",
    answer:
      "Yes, absolutely. Our dedicated stylists are available via WhatsApp to provide garment measurements, fabric close-ups, and occasion pairing recommendations tailored to your silhouette.",
  },
]

export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: "AR Boutique",
  store_email: "",
  store_phone: "+971 50 273 6767",
  store_address: "",
  trn: "",
  vat_enabled: false,
  vat_rate_pct: 5,
  delivery_fee_fils: 0,
  free_delivery_over_fils: 0,
  return_window_days: 14,
  return_expiry_days: 7,
  return_instructions: "",
  announcement_bar_text: "",
  announcement_bar_enabled: false,
  admin_notification_email: "",
  low_stock_threshold: 3,
  cod_enabled: false,
  cod_fee_fils: 0,
  cod_max_order_fils: 500000,
  cod_confirm_hours: 24,
  cod_refused_block_count: 3,
  faqs: DEFAULT_FAQS,
}
