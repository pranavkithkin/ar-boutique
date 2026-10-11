import type { Metadata } from "next";

export type PreviewPage = Readonly<{
  href: string;
  title: string;
  summary: string;
  pending: readonly string[];
}>;

export const previewPages = {
  about: {
    href: "/about",
    title: "About The AR Boutique",
    summary: "Explore The AR Boutique's collection preview, with supplied product photographs and garment details. The brand story is awaiting approval.",
    pending: ["Brand story", "Approved brand and business details"],
  },
  contact: {
    href: "/contact",
    title: "Contact Us",
    summary: "Contact details are awaiting confirmation. This preview does not accept enquiries or orders through a form.",
    pending: ["Customer-care email and phone", "Contact hours and any public address"],
  },
  journal: {
    href: "/journal",
    title: "The Journal",
    summary: "There are no published articles in this preview. Browse the collection while journal content is prepared for approval.",
    pending: ["Approved articles and photography"],
  },
  shipping: {
    href: "/policies/shipping",
    title: "Shipping & Delivery",
    summary: "Delivery information is awaiting approval. No delivery fee, service area or arrival date is promised in this preview.",
    pending: ["Delivery locations and fees", "Dispatch and delivery times", "Courier and tracking information"],
  },
  returns: {
    href: "/policies/returns",
    title: "Returns & Refunds",
    summary: "The returns and refunds policy is awaiting approval. This page is a placeholder, not an active store policy.",
    pending: ["Eligibility and return window", "Return instructions and costs", "Refund method and timing"],
  },
  terms: {
    href: "/policies/terms",
    title: "Terms & Conditions",
    summary: "The store's terms are awaiting approval. This preview is for browsing only and does not accept purchases.",
    pending: ["Approved business details", "Purchase, cancellation and payment terms", "Legal review"],
  },
  privacy: {
    href: "/policies/privacy",
    title: "Privacy Policy",
    summary: "The privacy notice is awaiting approval. This placeholder does not describe or certify the site's data-handling practices.",
    pending: ["Data collection and purposes", "Service providers, cookies and retention", "Privacy contact and rights information"],
  },
  sizeGuide: {
    href: "/size-guide",
    title: "Size Guide",
    summary: "Product sizes and measurements are awaiting confirmation. SKU references shown in the catalogue are not verified size labels.",
    pending: ["Confirmed size labels", "Measurements, units and measuring instructions", "Style-specific fit notes"],
  },
} as const satisfies Record<string, PreviewPage>;

export type PreviewPageKey = keyof typeof previewPages;

export const mainNavigation = [
  { href: "/", label: "Home" },
  { href: "/collections", label: "Collections" },
  { href: previewPages.journal.href, label: "Journal" },
  { href: previewPages.about.href, label: "About" },
  { href: previewPages.contact.href, label: "Contact Us" },
] as const;

export const footerNavigation: readonly {
  title: string;
  links: readonly { href: string; label: string }[];
}[] = [
  { title: "Explore", links: mainNavigation.slice(0, 4) },
  { title: "Customer Care", links: [
    { href: previewPages.contact.href, label: "Contact Us" },
    { href: previewPages.shipping.href, label: "Shipping & Delivery" },
    { href: previewPages.returns.href, label: "Returns & Refunds" },
    { href: previewPages.sizeGuide.href, label: "Size Guide" },
  ] },
  { title: "Legal", links: [
    { href: previewPages.terms.href, label: "Terms & Conditions" },
    { href: previewPages.privacy.href, label: "Privacy Policy" },
  ] },
] as const;

export function isNavigationCurrent(pathname: string | null, href: string) {
  return pathname === href || (href !== "/" && !!pathname?.startsWith(`${href}/`));
}

export function previewPageMetadata(key: PreviewPageKey): Metadata {
  const page = previewPages[key];
  return {
    title: `${page.title} | AR Boutique Preview`,
    description: page.summary,
    robots: { index: false, follow: false },
  };
}
