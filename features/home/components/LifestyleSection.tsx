import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/store/SectionHeading"
import type { lifestyleContent } from "../content"

export function LifestyleSection({
  content,
}: {
  content: typeof lifestyleContent
}) {
  return (
    <section
      aria-labelledby="lifestyle-heading"
      className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14 lg:px-8"
    >
      <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-end md:justify-between md:gap-8">
        <SectionHeading id="lifestyle-heading" className="text-left">
          {content.title}
        </SectionHeading>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {content.description}
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 sm:gap-5 md:gap-8">
        {content.moments.map((moment) => (
          <article key={moment.title}>
            <Link
              href={moment.href}
              aria-label={moment.linkText}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <div className="relative aspect-[3/2] sm:aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={moment.image}
                  alt={moment.alt}
                  fill
                  unoptimized
                  sizes="(min-width: 1280px) 480px, (min-width: 640px) 46vw, 100vw"
                  className="object-cover object-top motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex items-start justify-between gap-4 pt-5">
                <div>
                  <h3 className="font-heading text-xl font-normal md:text-2xl">
                    {moment.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {moment.description}
                  </p>
                  <span className="mt-2 inline-flex min-h-11 items-center text-sm underline underline-offset-4">
                    {moment.linkText}
                  </span>
                </div>
                <ArrowRight aria-hidden="true" strokeWidth={1.5} className="mt-1 size-5 shrink-0" />
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
