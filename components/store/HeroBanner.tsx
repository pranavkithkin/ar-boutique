import Image from "next/image"
import Link from "next/link"
import { StoreButton } from "./StoreButton"

interface HeroBannerProps {
  imageSrc: string
  mobileImageSrc?: string
  eyebrow?: string
  title?: React.ReactNode
  description?: React.ReactNode
  buttonText?: string
  buttonHref?: string
}

export function HeroBanner({
  imageSrc,
  mobileImageSrc,
  eyebrow,
  title,
  description,
  buttonText,
  buttonHref = "/collections",
}: HeroBannerProps) {
  const hasText = Boolean(eyebrow || title || description || buttonText)

  return (
    <section className="relative w-full">
      <div className="relative w-full">
        <Image
          src={imageSrc}
          alt={typeof title === "string" ? title : "Hero banner"}
          width={1920}
          height={800}
          className={`w-full ${mobileImageSrc ? 'hidden md:block h-auto' : 'h-[450px] md:h-auto'} object-cover object-center`}
          priority
        />
        {mobileImageSrc && (
          <Image
            src={mobileImageSrc}
            alt={typeof title === "string" ? title : "Hero banner mobile"}
            width={750}
            height={1000}
            className="w-full h-auto block md:hidden object-cover object-center"
            priority
          />
        )}
        {hasText && (
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-md bg-transparent p-6 sm:p-0">
                {eyebrow && (
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] mb-4 text-primary/80">
                    {eyebrow}
                  </p>
                )}
                {title && (
                  <h1 className="font-heading text-[40px] md:text-[60px] leading-[1.1] md:leading-[1.05] tracking-[-0.01em] font-normal mb-6 text-primary">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-base text-primary/80 mb-8 max-w-sm">
                    {description}
                  </p>
                )}
                {buttonText && (
                  <Link href={buttonHref}>
                    <StoreButton className="px-8">{buttonText}</StoreButton>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
