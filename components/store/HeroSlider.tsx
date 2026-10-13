"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

export function HeroSlider() {
  const pluginAutoplay = React.useMemo(
    () => Autoplay({ delay: 3000, stopOnInteraction: false }),
    []
  )

  type Slide = {
    id: number
    imageSrc: string
    alt: string
    mobileImageSrc?: string
    href: string
  }

  const slides: Slide[] = [
    {
      id: 1,
      imageSrc: "/images/hero_traditions_desktop.png",
      alt: "Timeless Traditions Fashion Heritage",
      href: "/collections",
    },
    {
      id: 2,
      imageSrc: "/images/hero_boutique_desktop.png",
      alt: "Timeless Boutique Fashion Collection",
      href: "/collections",
    },
    {
      id: 3,
      imageSrc: "/images/hero_elegance_desktop.png",
      alt: "Timeless Style, Modern Elegance",
      href: "/collections",
    }
  ]

  return (
    <section className="relative w-full">
      <Carousel
        plugins={[pluginAutoplay]}
        className="w-full"
        opts={{ loop: true }}
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <Link
                href={slide.href}
                className="block relative w-full group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`View collection: ${slide.alt}`}
              >
                <div className={`relative w-full md:aspect-[2.13/1] ${slide.mobileImageSrc ? 'aspect-[4/4.5]' : 'aspect-[2.13/1]'}`}>
                  {/* Desktop Image */}
                  <Image
                    src={slide.imageSrc}
                    alt={slide.alt}
                    fill
                    className={`object-cover object-center ${slide.mobileImageSrc ? 'hidden md:block' : 'block'}`}
                    priority={slide.id === 1}
                  />
                  {/* Mobile Image (Optional) */}
                  {slide.mobileImageSrc && (
                    <Image
                      src={slide.mobileImageSrc}
                      alt={`${slide.alt} mobile`}
                      fill
                      className="object-fill block md:hidden"
                      priority={slide.id === 1}
                    />
                  )}
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  )
}
