import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/store/SectionHeading"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { brandStoryContent } from "../content"

export function BrandStorySection({ content }: { content: typeof brandStoryContent }) {
  return (
    <section aria-labelledby="brand-story-heading" className="my-12 bg-secondary sm:my-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-12 md:items-center md:gap-10 md:py-12 lg:gap-16 lg:px-8">
        <figure className="min-w-0 md:col-span-5 md:w-11/12 md:justify-self-center">
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            <Image
              src={content.image}
              alt={content.alt}
              fill
              unoptimized
              sizes="(min-width: 1280px) 560px, (min-width: 768px) 42vw, 100vw"
              className="object-cover object-top"
            />
          </div>
          <figcaption className="mt-3 font-heading text-lg italic text-foreground sm:mt-4 sm:text-xl">
            {content.caption}
          </figcaption>
        </figure>

        <div className="min-w-0 md:col-span-7 md:py-4 lg:py-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground sm:mb-4">
            {content.eyebrow}
          </p>
          <SectionHeading
            id="brand-story-heading"
            className="max-w-xl text-left text-4xl leading-[1.05] md:text-5xl"
          >
            {content.title}
          </SectionHeading>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">
            {content.description}
          </p>

          <div className="mt-7 sm:mt-8">
            <h3 className="mb-3 font-heading text-xl">Our Commitment</h3>
            <dl className="grid border-t border-border sm:grid-cols-3">
              {content.values.map((value) => (
              <div key={value.title} className="border-b border-border py-4 sm:pr-4 sm:pt-5 lg:pr-6">
                <dt className="font-sans text-sm font-medium">{value.title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </dd>
              </div>
              ))}
            </dl>
          </div>
          <Link href={content.href} className={cn(buttonVariants(), "h-12 gap-3 px-6 text-[15px]")}>
            {content.linkText}
            <ArrowRight aria-hidden="true" strokeWidth={1.5} className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
