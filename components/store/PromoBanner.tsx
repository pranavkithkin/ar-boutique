import Link from "next/link"
import Image from "next/image"
import { StoreButton } from "./StoreButton"

interface PromoBannerProps {
  imageSrc: string
  imageAlt?: string
  imageFit?: "cover" | "contain"
  eyebrow: string
  title: string
  description: string
  buttonText: string
  buttonHref?: string
}

export function PromoBanner({ imageSrc, imageAlt, imageFit = "cover", eyebrow, title, description, buttonText, buttonHref = "/collections" }: PromoBannerProps) {
  const preservePortrait = imageFit === "contain"
  const button = (
    <StoreButton className="px-8 bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-[11px] font-semibold h-12 rounded-none transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
      {buttonText}
    </StoreButton>
  )

  return (
    <div className="group flex flex-col md:flex-row w-full h-auto md:h-[380px] bg-accent overflow-hidden rounded-xs shadow-xs hover:shadow-md transition-shadow duration-500">
      <div className="relative w-full md:w-[60%] h-[300px] md:h-full overflow-hidden bg-muted">
        <Image
          src={imageSrc}
          alt={imageAlt ?? title}
          fill
          sizes="(min-width: 1280px) 730px, (min-width: 768px) 60vw, 100vw"
          className={preservePortrait
            ? "object-contain object-center"
            : "object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"}
        />
      </div>
      <div className="w-full md:w-[40%] h-auto md:h-full py-12 px-6 md:p-12 flex flex-col items-center justify-center text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-4 text-foreground/70">
          {eyebrow}
        </p>
        <h2 className="font-heading text-[36px] leading-[1.1] font-normal mb-4 text-foreground">
          {title}
        </h2>
        <p className="text-[13px] text-foreground/80 mb-8 max-w-[220px] mx-auto">
          {description}
        </p>
        {buttonHref ? (
          <Link href={buttonHref}>
            {button}
          </Link>
        ) : (
          button
        )}
      </div>
    </div>
  )
}
