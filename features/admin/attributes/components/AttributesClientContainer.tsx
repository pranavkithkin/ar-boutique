"use client"

import * as React from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { AdminColourItem, AdminSizeItem } from "../types"
import { ColoursTable } from "./ColoursTable"
import { SizesTable } from "./SizesTable"
import { Palette, Ruler } from "lucide-react"

interface AttributesClientContainerProps {
  initialColours: AdminColourItem[]
  initialSizes: AdminSizeItem[]
}

export function AttributesClientContainer({
  initialColours,
  initialSizes,
}: AttributesClientContainerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTab = searchParams.get("tab") === "sizes" ? "sizes" : "colours"

  function handleTabChange(tab: "colours" | "sizes") {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "sizes") {
      params.set("tab", "sizes")
    } else {
      params.delete("tab")
    }
    const query = params.toString() ? `?${params.toString()}` : ""
    router.replace(`${pathname}${query}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Catalogue Hierarchy
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-0.5">
            Colours & Sizes
          </h1>
          <p className="text-xs text-muted-foreground font-sans mt-1">
            Manage garment colourways, hex swatches, size standards, and display ordering.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => handleTabChange("colours")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-sans font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "colours"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Palette className="size-3.5" />
          <span>Boutique Colours</span>
          <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 bg-muted border border-border">
            {initialColours.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("sizes")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-sans font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "sizes"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ruler className="size-3.5" />
          <span>Garment Sizes</span>
          <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 bg-muted border border-border">
            {initialSizes.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "colours" ? (
        <ColoursTable colours={initialColours} />
      ) : (
        <SizesTable sizes={initialSizes} />
      )}
    </div>
  )
}
