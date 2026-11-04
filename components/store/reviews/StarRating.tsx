"use client"

import * as React from "react"
import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number // 0 to 5
  maxRating?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onChange?: (rating: number) => void
  className?: string
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  className = "",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null)

  const sizeClass = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-6",
  }[size]

  const displayRating = hoverRating !== null ? hoverRating : rating

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      onMouseLeave={() => interactive && setHoverRating(null)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${rating} out of ${maxRating} stars`}
    >
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1
        const isFilled = starValue <= displayRating

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            className={`transition-all duration-150 ${
              interactive
                ? "cursor-pointer hover:scale-110 focus:outline-hidden p-0.5"
                : "cursor-default"
            }`}
            tabIndex={interactive ? 0 : -1}
            aria-label={`${starValue} star`}
          >
            <Star
              className={`${sizeClass} ${
                isFilled
                  ? "fill-amber-400 text-amber-400 dark:fill-amber-300 dark:text-amber-300"
                  : "fill-muted/30 text-muted-foreground/40"
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}
