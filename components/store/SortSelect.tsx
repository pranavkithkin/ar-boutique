"use client"

import { useQueryState, parseAsString } from "nuqs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SORT_LABELS: Record<string, string> = {
  newest: "Newest Arrivals",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
}

function formatSortLabel(value: string): string {
  if (SORT_LABELS[value]) {
    return SORT_LABELS[value]
  }
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

interface SortSelectProps {
  currentSort: string
}

export function SortSelect({ currentSort }: SortSelectProps) {
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault(currentSort || "newest").withOptions({ shallow: false })
  )
  const [, setPage] = useQueryState(
    "page",
    parseAsString.withDefault("1").withOptions({ shallow: false })
  )

  const activeSort = sort || currentSort || "newest"

  const handleValueChange = (val: string | null) => {
    if (!val) return
    setPage("1")
    setSort(val)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground hidden sm:inline-block">Sort by</span>
      <Select
        value={activeSort}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-[190px]">
          <SelectValue placeholder="Sort by">
            {formatSortLabel(activeSort)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="start">
          <SelectItem value="newest">Newest Arrivals</SelectItem>
          <SelectItem value="price-asc">Price: Low to High</SelectItem>
          <SelectItem value="price-desc">Price: High to Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

