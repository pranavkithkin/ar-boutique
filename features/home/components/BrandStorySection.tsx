import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/store/SectionHeading"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { brandStoryContent } from "../content"

export function BrandStorySection({ content }: { content: typeof brandStoryContent }) {
  return (
    <section aria-labelledby="brand-story-heading" className="my-10 bg-secondary md:my-14">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-12 md:items-center md:gap-8 md:py-10 lg:gap-12 lg:px-8">
        <figure className="min-w-0 md:col-span-4">
          <div className="relative aspect-[3/4] overflow-hidden bg-muted">
            <Image
              src={content.image}
              alt={content.alt}
              fill
              unoptimized
              sizes="(min-width: 1280px) 360px, (min-width: 768px) 32vw, 100vw"
              className="object-cover object-top"
            />
          </div>
          <figcaption className="mt-4 font-heading text-xl italic text-foreground">
            {content.caption}
          </figcaption>
        </figure>

        <div className="min-w-0 md:col-span-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            The AR Boutique
          </p>
          <SectionHeading
            id="brand-story-heading"
            className="max-w-lg text-left text-3xl md:text-4xl"
          >
            {content.title}
          </SectionHeading>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            {content.description}
          </p>

          <dl className="my-5 border-t md:my-6 border-border">
            {content.values.map((value) => (
              <div key={value.title} className="grid gap-2 border-b border-border py-3 lg:grid-cols-5 lg:gap-6">
                <dt className="font-sans text-sm font-medium lg:col-span-2">{value.title}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground lg:col-span-3">
                  {value.description}
                </dd>
              </div>
            ))}
          </dl>
          <Link href={content.href} className={cn(buttonVariants(), "h-12 gap-3 px-6 text-[15px]")}>
            {content.linkText}
            <ArrowRight aria-hidden="true" strokeWidth={1.5} className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
