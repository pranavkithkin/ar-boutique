/**
 * Format ISO or SQL date string to luxury editorial display format
 */
export function formatArticleDate(dateStr?: string | null): string {
  if (!dateStr) return "Recent"
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return "Recent"
  }
}

/**
 * Resolve cover image to Cloudinary URL or fallback
 */
export function resolveArticleImageUrl(
  imageKey?: string | null,
  width = 1200
): string {
  if (!imageKey) return "/images/artisan_embroidery.jpg"
  if (
    imageKey.startsWith("http://") ||
    imageKey.startsWith("https://") ||
    imageKey.startsWith("/")
  ) {
    return imageKey
  }
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_${width}/${imageKey}`
}

/**
 * Sanitizes rich text HTML content from Tiptap, stripping malicious tags and event handlers
 */
export function sanitizeBlogContent(html: string): string {
  if (!html) return ""
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
}
