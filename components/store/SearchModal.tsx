"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Loader2, ArrowRight, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { searchProductsAction } from "@/features/search/actions"
import type { SearchResultItem } from "@/features/search/types"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const POPULAR_SUGGESTIONS = [
  "Set",
  "Kurta",
  "Dress",
  "Sea green",
  "Wine",
  "Black",
  "Pink",
  "Festive",
]

function SearchModalContent({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResultItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const trimmedQuery = query.trim()
  const displayedResults = trimmedQuery ? results : []
  const showEmpty = Boolean(trimmedQuery && !loading && hasSearched && displayedResults.length === 0)

  // Focus on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  // Debounced search effect
  React.useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      return
    }

    const timeout = setTimeout(() => {
      setLoading(true)
      searchProductsAction(trimmed)
        .then((res) => {
          if (res.success) {
            setResults(res.data)
          } else {
            setResults([])
          }
        })
        .catch((err) => {
          console.error("Search error:", err)
          setResults([])
        })
        .finally(() => {
          setLoading(false)
          setHasSearched(true)
        })
    }, 200)

    return () => clearTimeout(timeout)
  }, [query])

  const handleSelectProduct = (href: string) => {
    onClose()
    router.push(href)
  }

  return (
    <div className="p-0 gap-0 overflow-hidden bg-card text-card-foreground">
      {/* Search Header Input */}
      <div className="relative flex items-center border-b border-border/80 pl-4 sm:pl-6 pr-12 sm:pr-14 py-4">
        <Search className="h-5 w-5 text-muted-foreground shrink-0 mr-3" strokeWidth={1.75} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pieces, style codes, colours, or categories..."
          className="flex-1 bg-transparent text-base sm:text-lg text-foreground placeholder:text-muted-foreground outline-hidden"
          aria-label="Search catalogue"
        />
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0 ml-2" />
        )}
      </div>

      {/* Content Body */}
      <div className="max-h-[60vh] overflow-y-auto px-4 sm:px-6 py-5">
        {/* Default Suggestions when query is empty */}
        {!trimmedQuery && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Popular Searches
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setQuery(suggestion)}
                  className="inline-flex items-center px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted hover:border-primary/40 text-foreground transition-all duration-150 cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-border/60">
              <p className="text-xs text-muted-foreground">
                Search across boutique names, client style codes (e.g. <span className="font-mono text-foreground font-medium">J0478</span>), luxury fabrics, and curated collections.
              </p>
            </div>
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading && !displayedResults.length && trimmedQuery && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-3" />
            <p className="text-xs text-muted-foreground">Searching boutique catalogue...</p>
          </div>
        )}

        {/* Results List */}
        {displayedResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>
                Found <strong className="text-foreground font-semibold">{displayedResults.length}</strong> {displayedResults.length === 1 ? "piece" : "pieces"}
              </span>
              <span className="font-mono text-[11px]">Click to view</span>
            </div>

            <div className="divide-y divide-border/60 border border-border/60 rounded-xs overflow-hidden">
              {displayedResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectProduct(item.href)}
                  className="group flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[2/3] w-14 sm:w-16 shrink-0 overflow-hidden bg-muted rounded-xs border border-border/40">
                    <Image
                      src={item.imageSrc}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground px-1.5 py-0.5 rounded-xs bg-muted">
                        {item.categoryName}
                      </span>
                      {item.styleCode && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          Style: {item.styleCode}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-heading font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {item.name}
                    </h4>
                    {item.colourName && (
                      <p className="text-xs text-muted-foreground truncate">
                        Colour: {item.colourName}
                      </p>
                    )}
                  </div>

                  {/* Price and Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {item.formattedPrice}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results Empty State */}
        {showEmpty && (
          <div className="py-12 text-center">
            <p className="text-base font-heading font-medium text-foreground mb-1">
              No pieces found
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              We couldn&apos;t find any garments matching &ldquo;{trimmedQuery}&rdquo;.
            </p>
            <p className="text-xs text-muted-foreground">
              Try searching for a category like <button type="button" onClick={() => setQuery("Set")} className="underline font-medium text-foreground hover:opacity-80">Set</button>, <button type="button" onClick={() => setQuery("Kurta")} className="underline font-medium text-foreground hover:opacity-80">Kurta</button>, or a style code.
            </p>
          </div>
        )}
      </div>

      {/* Footer info strip */}
      <div className="flex items-center justify-between border-t border-border/80 px-4 sm:px-6 py-2.5 bg-muted/20 text-[11px] text-muted-foreground">
        <span>Complimentary UAE delivery on orders above AED 200</span>
        <Link
          href="/collections"
          onClick={onClose}
          className="hover:text-foreground font-medium underline underline-offset-2 transition-colors"
        >
          Explore all collections &rarr;
        </Link>
      </div>
    </div>
  )
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl rounded-sm">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Catalogue</DialogTitle>
        </DialogHeader>

        {isOpen && <SearchModalContent onClose={onClose} key="search-content" />}
      </DialogContent>
    </Dialog>
  )
}
