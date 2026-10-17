"use client"

import * as React from "react"
import Link from "next/link"
import { STORE_CONTACT } from "@/lib/contact"
import {
  RotateCcw,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  ChevronRight,
} from "lucide-react"

export function ReturnsTab() {
  const returnWhatsappUrl = `${STORE_CONTACT.whatsappHref}?text=${encodeURIComponent(
    "Hello AR Boutique Concierge, I would like to request an exchange or return for an order."
  )}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-sans font-semibold tracking-tight text-foreground">Returns & Exchanges</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Dedicated concierge assistance for effortless garment exchanges and returns across the UAE.
        </p>
      </div>

      {/* Main Returns Banner */}
      <div className="p-6 rounded-xs border border-border bg-card shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-muted rounded-xs text-foreground shrink-0">
              <RotateCcw className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-sans font-semibold text-foreground">
                7-Day Complimentary Return & Exchange Window
              </h3>
              <p className="text-xs text-muted-foreground">
                We accept returns on all non-final sale pieces in original, unworn condition with tags attached.
              </p>
            </div>
          </div>

          <a
            href={returnWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background font-medium text-xs uppercase tracking-wider rounded-none hover:bg-foreground/90 transition-colors shrink-0"
          >
            <MessageCircle className="h-4 w-4 text-emerald-400" />
            Initiate via WhatsApp
          </a>
        </div>

        {/* 3 Simple Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-muted/20 border border-border/40 rounded-xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                1
              </span>
              Contact Concierge
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Message us on WhatsApp with your Order ID (<span className="font-mono text-foreground">AR-XXXX</span>) and reason for return or size exchange.
            </p>
          </div>

          <div className="p-4 bg-muted/20 border border-border/40 rounded-xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                2
              </span>
              Doorstep Courier Pickup
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our courier will collect the sealed package directly from your UAE delivery address at your preferred time.
            </p>
          </div>

          <div className="p-4 bg-muted/20 border border-border/40 rounded-xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                3
              </span>
              Inspection & Refund
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upon atelier inspection, card refunds process to your original card in 5-7 business days; COD orders receive direct UAE bank transfer.
            </p>
          </div>
        </div>
      </div>

      {/* Garment Condition Checklist */}
      <div className="p-6 rounded-xs border border-border bg-card space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          Garment Return Guidelines
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <span>Garment must be unworn, unwashed, and free from any fragrance, makeup, or alterations.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <span>Original AR Boutique garment tags and security ribbon must remain intact.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <span>Include all original designer packaging, dust bags, and fabric swatches provided.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <span>Items marked as &ldquo;Final Sale&rdquo; or bespoke tailored garments are non-returnable.</span>
          </div>
        </div>

        <div className="pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            Questions regarding our policy terms?
          </span>
          <Link
            href="/policies/returns"
            className="text-foreground font-medium underline underline-offset-4 hover:opacity-75 flex items-center gap-1"
          >
            Read Full Returns Policy <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
