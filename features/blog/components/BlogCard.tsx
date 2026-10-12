import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardTitle } from "@/components/ui/card"

export interface BlogCardProps {
  title: string
  category: string
  imageSrc: string
  imageAlt?: string
  imageFit?: "cover" | "contain"
  href: string
}

export function BlogCard({ title, category, imageSrc, imageAlt, imageFit = "cover", href }: BlogCardProps) {
  return (
    <Link href={href} className="group cursor-pointer block h-full">
      <Card className="flex flex-col h-full overflow-hidden pt-0">
        <div className="relative aspect-[4/3] overflow-hidden w-full shrink-0 bg-muted">
          <Image
            src={imageSrc}
            alt={imageAlt ?? title}
            fill
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 100vw"
            className={imageFit === "contain"
              ? "object-contain object-center"
              : "object-cover group-hover:scale-105 transition-transform duration-500"}
          />
        </div>
        <CardContent className="flex flex-col gap-2 pt-6 flex-grow">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {category}
          </p>
          <CardTitle className="font-heading text-xl font-normal group-hover:underline">
            {title}
          </CardTitle>
        </CardContent>
      </Card>
    </Link>
  )
}
