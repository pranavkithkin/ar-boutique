import Link from "next/link"
import Image from "next/image"

interface CategoryCircleProps {
  name: string
  imageSrc: string
  href: string
}

export function CategoryCircle({ name, imageSrc, href }: CategoryCircleProps) {
  return (
    <Link href={href} className="flex flex-col items-center gap-3.5 min-w-[120px] md:min-w-[160px] snap-center group">
      <div className="relative h-24 w-24 md:h-40 md:w-40 overflow-hidden rounded-full bg-muted border border-border/60 group-hover:border-foreground/40 transition-colors shadow-xs">
        <Image 
          src={imageSrc} 
          alt={name} 
          fill 
          sizes="(max-width: 768px) 120px, 160px"
          unoptimized={true}
          className="object-cover object-top group-hover:scale-105 transition-transform duration-500" 
        />
      </div>
      <span className="font-heading text-sm sm:text-[15px] font-medium tracking-wide text-foreground group-hover:text-primary transition-colors text-center">
        {name}
      </span>
    </Link>
  )
}
