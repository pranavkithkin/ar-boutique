"use client"

import { useState, useEffect } from "react"
import { useQueryState, parseAsString, parseAsInteger } from "nuqs"
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { X } from "lucide-react"

const CATEGORIES = [
  { label: "Co-ord Set", slug: "co-ord-set" },
  { label: "Dress", slug: "dress" },
  { label: "Kurta", slug: "kurta" },
  { label: "Set", slug: "set" },
  { label: "Top", slug: "top" },
]

const SIZES = ["M", "XL"]

const FABRICS = [
  "Cotton",
  "Rayon",
  "Georgette",
  "Silk Blend",
  "Chiffon",
  "Chanderi",
]

const PATTERNS = [
  "Floral",
  "Solid",
  "Embroidered",
  "Tie & dye",
  "Ethnic Motifs",
  "Self Design",
]

const DEFAULT_MIN_PRICE = 80
const DEFAULT_MAX_PRICE = 160

export function SidebarFilters() {
  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withOptions({ shallow: false })
  )
  const [size, setSize] = useQueryState(
    "size",
    parseAsString.withOptions({ shallow: false })
  )
  const [fabric, setFabric] = useQueryState(
    "fabric",
    parseAsString.withOptions({ shallow: false })
  )
  const [pattern, setPattern] = useQueryState(
    "pattern",
    parseAsString.withOptions({ shallow: false })
  )
  const [minPrice, setMinPrice] = useQueryState(
    "minPrice",
    parseAsInteger.withDefault(DEFAULT_MIN_PRICE).withOptions({ shallow: false })
  )
  const [maxPrice, setMaxPrice] = useQueryState(
    "maxPrice",
    parseAsInteger.withDefault(DEFAULT_MAX_PRICE).withOptions({ shallow: false })
  )
  const [, setPage] = useQueryState(
    "page",
    parseAsString.withOptions({ shallow: false })
  )

  const [localPrice, setLocalPrice] = useState<number[]>([minPrice, maxPrice])

  useEffect(() => {
    setLocalPrice([minPrice, maxPrice])
  }, [minPrice, maxPrice])

  const isPriceActive = minPrice !== DEFAULT_MIN_PRICE || maxPrice !== DEFAULT_MAX_PRICE
  const hasActiveFilters = Boolean(category || size || fabric || pattern || isPriceActive)

  const handleCategoryToggle = (slug: string) => {
    setPage("1")
    setCategory(category === slug ? null : slug)
  }

  const handleSizeToggle = (s: string) => {
    setPage("1")
    setSize(size === s ? null : s)
  }

  const handleFabricToggle = (f: string) => {
    setPage("1")
    setFabric(fabric === f ? null : f)
  }

  const handlePatternToggle = (p: string) => {
    setPage("1")
    setPattern(pattern === p ? null : p)
  }

  const handleSliderCommit = (val: number | readonly number[]) => {
    const arr = Array.isArray(val) ? (val as number[]) : [val as number]
    const newMin = arr[0] ?? DEFAULT_MIN_PRICE
    const newMax = arr[1] ?? DEFAULT_MAX_PRICE
    setPage("1")
    setMinPrice(newMin === DEFAULT_MIN_PRICE ? null : newMin)
    setMaxPrice(newMax === DEFAULT_MAX_PRICE ? null : newMax)
  }

  const clearAllFilters = () => {
    setCategory(null)
    setSize(null)
    setFabric(null)
    setPattern(null)
    setMinPrice(null)
    setMaxPrice(null)
    setLocalPrice([DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE])
    setPage("1")
  }

  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active Filters
          </span>
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs text-primary hover:underline font-medium cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        </div>
      )}

      <Accordion multiple defaultValue={["category", "size", "price", "fabric", "pattern"]} className="w-full">
        {/* 1. Category Filter */}
        <AccordionItem value="category">
          <AccordionTrigger className="text-[13px] font-semibold uppercase tracking-widest text-foreground hover:no-underline py-3">
            Category
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-1">
              {CATEGORIES.map((cat) => {
                const isChecked = category === cat.slug
                return (
                  <div
                    key={cat.slug}
                    onClick={() => handleCategoryToggle(cat.slug)}
                    className="flex items-center space-x-2.5 cursor-pointer group select-none"
                  >
                    <Checkbox
                      id={`cat-${cat.slug}`}
                      checked={isChecked}
                      onCheckedChange={() => handleCategoryToggle(cat.slug)}
                    />
                    <label
                      htmlFor={`cat-${cat.slug}`}
                      className={`text-sm leading-none cursor-pointer transition-colors ${
                        isChecked
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {cat.label}
                    </label>
                  </div>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Size Filter */}
        <AccordionItem value="size">
          <AccordionTrigger className="text-[13px] font-semibold uppercase tracking-widest text-foreground hover:no-underline py-3">
            Size
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2 pt-1">
              {SIZES.map((s) => {
                const isSelected = size === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSizeToggle(s)}
                    className={`h-10 min-w-10 px-3 flex items-center justify-center text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-foreground/80 hover:border-primary hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 3. Price Slider Filter (Position 3) */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-[13px] font-semibold uppercase tracking-widest text-foreground hover:no-underline py-3">
            Price Range
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2 pb-1 px-1">
              <div className="flex items-center justify-between text-xs font-medium text-foreground">
                <span className="bg-muted px-2 py-1 rounded-none border border-border/40 font-mono">
                  AED {localPrice[0]}
                </span>
                <span className="text-muted-foreground text-[11px] uppercase tracking-wider">to</span>
                <span className="bg-muted px-2 py-1 rounded-none border border-border/40 font-mono">
                  AED {localPrice[1]}
                </span>
              </div>
              <Slider
                value={localPrice}
                min={DEFAULT_MIN_PRICE}
                max={DEFAULT_MAX_PRICE}
                step={5}
                onValueChange={(val) => {
                  if (Array.isArray(val)) {
                    setLocalPrice(val as number[])
                  }
                }}
                onValueCommitted={handleSliderCommit}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>AED {DEFAULT_MIN_PRICE}</span>
                <span>AED {DEFAULT_MAX_PRICE}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 4. Fabric Filter */}
        <AccordionItem value="fabric">
          <AccordionTrigger className="text-[13px] font-semibold uppercase tracking-widest text-foreground hover:no-underline py-3">
            Fabric
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-1">
              {FABRICS.map((f) => {
                const isChecked = fabric === f
                return (
                  <div
                    key={f}
                    onClick={() => handleFabricToggle(f)}
                    className="flex items-center space-x-2.5 cursor-pointer group select-none"
                  >
                    <Checkbox
                      id={`fabric-${f}`}
                      checked={isChecked}
                      onCheckedChange={() => handleFabricToggle(f)}
                    />
                    <label
                      htmlFor={`fabric-${f}`}
                      className={`text-sm leading-none cursor-pointer transition-colors ${
                        isChecked
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {f}
                    </label>
                  </div>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 5. Pattern Filter */}
        <AccordionItem value="pattern">
          <AccordionTrigger className="text-[13px] font-semibold uppercase tracking-widest text-foreground hover:no-underline py-3">
            Pattern
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-1">
              {PATTERNS.map((pat) => {
                const isChecked = pattern === pat
                return (
                  <div
                    key={pat}
                    onClick={() => handlePatternToggle(pat)}
                    className="flex items-center space-x-2.5 cursor-pointer group select-none"
                  >
                    <Checkbox
                      id={`pattern-${pat}`}
                      checked={isChecked}
                      onCheckedChange={() => handlePatternToggle(pat)}
                    />
                    <label
                      htmlFor={`pattern-${pat}`}
                      className={`text-sm leading-none cursor-pointer transition-colors ${
                        isChecked
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {pat}
                    </label>
                  </div>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
