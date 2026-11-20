import type { Offer, ProductOfferTag } from "./types"

export function offerTagFor(offer: Pick<Offer, "slug" | "title">): ProductOfferTag {
  return { slug: offer.slug, title: offer.title, label: offer.title }
}
