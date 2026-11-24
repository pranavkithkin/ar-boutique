"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { WhatsAppIcon } from "@/components/store/WhatsAppIcon"

export function FloatingWhatsAppButton({ href }: { href: string }) {
  const [mounted, setMounted] = React.useState(false)
  const [liftAboveBanner, setLiftAboveBanner] = React.useState<number | null>(null)

  React.useEffect(() => {
    setMounted(true)

    const updatePosition = () => {
      const banner = document.querySelector<HTMLElement>("[aria-label='Cookie and Privacy Consent']")
      if (!banner) {
        setLiftAboveBanner(null)
        return
      }

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const isSmallScreen = viewportWidth < 640
      const size = isSmallScreen ? 48 : 56
      const margin = isSmallScreen ? 16 : 24
      const defaultBottom = isSmallScreen ? 80 : 24
      const left = viewportWidth - margin - size
      const top = viewportHeight - defaultBottom - size
      const buttonRight = left + size
      const buttonBottom = top + size
      const bannerRect = banner.getBoundingClientRect()
      const overlaps = left < bannerRect.right
        && buttonRight > bannerRect.left
        && top < bannerRect.bottom
        && buttonBottom > bannerRect.top

      setLiftAboveBanner(overlaps ? viewportHeight - bannerRect.top + 12 : null)
    }

    updatePosition()
    const observer = new MutationObserver(updatePosition)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener("resize", updatePosition)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updatePosition)
    }
  }, [])

  if (!mounted) return null

  return createPortal(
    <a
      href={href}
      target={href.startsWith("https://") ? "_blank" : undefined}
      rel={href.startsWith("https://") ? "noopener noreferrer" : undefined}
      aria-label={href.startsWith("https://") ? "Chat with AR Boutique on WhatsApp" : "Find AR Boutique WhatsApp contact details"}
      title="WhatsApp concierge"
      style={liftAboveBanner === null ? undefined : { bottom: `${liftAboveBanner}px` }}
      className="fixed bottom-20 right-4 z-50 flex size-12 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg transition-[bottom,opacity] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:bottom-6 sm:right-6 sm:size-14"
    >
      <WhatsAppIcon className="size-6 sm:size-7" />
    </a>,
    document.body
  )
}
