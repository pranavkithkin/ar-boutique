"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Plus } from "lucide-react"
import { CategoryVisibilityFilter } from "../types"

interface CategoriesToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  visibilityFilter: CategoryVisibilityFilter
  onVisibilityFilterChange: (filter: CategoryVisibilityFilter) => void
  totalCount: number
  onAddCategory: () => void
}

export function CategoriesToolbar({
  searchQuery,
  onSearchChange,
  visibilityFilter,
  onVisibilityFilterChange,
  totalCount,
  onAddCategory,
}: CategoriesToolbarProps) {
  return (
    <div className="space-y-4">
      {/* Title & Add Category Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
              Categories
            </h1>
            <Badge variant="outline" className="text-xs font-mono font-normal">
              {totalCount} {totalCount === 1 ? "category" : "categories"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage boutique collections, display hierarchy, and visual merchandising circles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={onAddCategory}
            className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs tracking-wider uppercase h-9 px-4 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Visibility Filter Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 border border-border w-fit">
          <button
            type="button"
            onClick={() => onVisibilityFilterChange("all")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              visibilityFilter === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Categories
          </button>
          <button
            type="button"
            onClick={() => onVisibilityFilterChange("visible")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              visibilityFilter === "visible"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Visible Only
          </button>
          <button
            type="button"
            onClick={() => onVisibilityFilterChange("hidden")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              visibilityFilter === "hidden"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hidden Only
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search category or slug..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-xs rounded-none border-input bg-background"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
