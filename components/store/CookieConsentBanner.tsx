"use client"

import * as React from "react"
import Link from "next/link"
import { Cookie, X } from "lucide-react"
import { cn } from "@/lib/utils"

const CONSENT_STORAGE_KEY = "ar_cookie_consent"

type ConsentStatus = "accepted" | "declined" | null

export function CookieConsentBanner() {
  const [status, setStatus] = React.useState<ConsentStatus>("accepted") // default to accepted during SSR to prevent layout flash
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(CONSENT_STORAGE_KEY) as ConsentStatus
      if (saved === "accepted" || saved === "declined") {
        setStatus(saved)
      } else {
        setStatus(null)
      }
    } catch {
      setStatus(null)
    }
  }, [])

  const handleChoice = (choice: "accepted" | "declined") => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, choice)
    } catch {
      // Ignore storage errors in private browsing
    }
    setStatus(choice)
  }

  // Do not render if not mounted or already made choice
  if (!mounted || status !== null) {
    return null
  }

  return (
    <aside
      aria-label="Cookie and Privacy Consent"
      role="region"
      className={cn(
        "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-[440px] z-50",
        "bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-xs p-5 sm:p-6",
        "animate-in fade-in slide-in-from-bottom-5 duration-300 transition-all"
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/70 border border-border text-foreground">
          <Cookie className="h-4 w-4 stroke-[1.5]" />
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-sans text-sm font-semibold tracking-tight text-foreground">
              Cookie & Privacy Consent
            </h3>
            <button
              type="button"
              onClick={() => handleChoice("declined")}
              aria-label="Close and decline optional cookies"
              className="text-muted-foreground hover:text-foreground p-1 transition-colors -mr-1"
            >
              <X className="h-4 w-4 stroke-[1.5]" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            We use essential cookies to secure your shopping experience, remember your bag, and enhance boutique browsing. By accepting, you consent to our use of analytics per our{" "}
            <Link
              href="/policies/privacy"
              className="underline underline-offset-2 text-foreground hover:opacity-75 transition-opacity font-medium"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => handleChoice("declined")}
              className="px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-medium text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded-xs transition-colors cursor-pointer"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => handleChoice("accepted")}
              className="px-4 py-1.5 text-[11px] uppercase tracking-wider font-medium bg-foreground text-background hover:opacity-90 rounded-xs transition-opacity cursor-pointer shadow-2xs"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
