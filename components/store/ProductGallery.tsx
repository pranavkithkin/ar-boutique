"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown } from "lucide-react"

export function ProductGallery({ images }: { images: string[] }) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const scrollUp = () => {
    scrollRef.current?.scrollBy({ top: -120, behavior: "smooth" })
  }

  const scrollDown = () => {
    scrollRef.current?.scrollBy({ top: 120, behavior: "smooth" })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-start relative w-full">
      {/* Desktop Thumbnails (Left side) */}
      <div className="hidden sm:flex flex-col w-14 xl:w-16 shrink-0 sticky top-24 h-[calc(100vh-8rem)] py-0">
        {/* Up Arrow */}
        <button
          onClick={scrollUp}
          className="flex items-center justify-center w-full h-8 mb-3 rounded-sm bg-secondary/80 hover:bg-secondary transition-colors shrink-0"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        {/* Desktop Thumbnail List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex flex-col gap-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "relative aspect-[3/4] w-full overflow-hidden rounded-sm border-2 shrink-0 transition-colors",
                selectedIndex === i
                  ? "border-foreground"
                  : "border-transparent hover:border-border"
              )}
            >
              <Image
                src={img}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                unoptimized={true}
                sizes="100px"
              />
            </button>
          ))}
        </div>

        {/* Down Arrow */}
        <button
          onClick={scrollDown}
          className="flex items-center justify-center w-full h-8 mt-3 rounded-sm bg-secondary/80 hover:bg-secondary transition-colors shrink-0"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
        {/* Main Image */}
        <div className="relative w-full rounded-md overflow-hidden bg-transparent">
          <Image
            src={images[selectedIndex]}
            alt="Product image"
            width={1000}
            height={1500}
            className="w-full h-auto transition-opacity duration-300"
            priority
            unoptimized={true}
          />
        </div>

        {/* Mobile Thumbnails (Horizontal Bottom slider) */}
        <div className="flex sm:hidden overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-sm border-2 transition-colors",
                selectedIndex === i
                  ? "border-foreground"
                  : "border-transparent hover:border-border"
              )}
            >
              <Image
                src={img}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                unoptimized={true}
                sizes="100px"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
