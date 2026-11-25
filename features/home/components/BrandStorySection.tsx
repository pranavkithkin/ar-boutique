import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarDays, Heart, Sparkles } from "lucide-react"
import { SectionHeading } from "@/components/store/SectionHeading"
import type { brandStoryContent } from "../content"

const valueIcons = [Sparkles, Heart, CalendarDays]

export function BrandStorySection({ content }: { content: typeof brandStoryContent }) {
  return (
    <section aria-labelledby="brand-story-heading" className="my-10 sm:my-14">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-3 gap-y-5 border border-border bg-secondary p-4 sm:gap-x-4 sm:gap-y-6 sm:p-5 lg:grid-cols-[5fr_7fr] lg:items-start lg:gap-24 lg:p-6">
        <div className="contents lg:block lg:min-w-0">
          <figure className="order-3 relative aspect-[4/5] overflow-hidden bg-muted lg:order-none lg:aspect-[8/9]">
            <Image
              src={content.image}
              alt={content.alt}
              fill
              unoptimized
              sizes="(min-width: 1280px) 500px, (min-width: 1024px) 40vw, 100vw"
              className="object-cover object-top"
            />
            <figcaption className="absolute bottom-2 right-2 bg-background px-2 py-1 font-heading text-xs italic text-foreground sm:bottom-6 sm:right-6 sm:px-5 sm:py-3 sm:text-lg">
              {content.caption}
            </figcaption>
          </figure>

          <div className="order-5 col-span-2 mt-0 lg:order-none lg:col-span-1 lg:mt-5">
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
              {content.description}
            </p>
            <Link
              href={content.href}
              className="mt-3 inline-flex min-h-11 w-fit items-center gap-2 font-sans text-sm font-medium underline underline-offset-8 transition-opacity hover:opacity-70"
            >
              {content.linkText}
              <ArrowRight aria-hidden="true" strokeWidth={1.5} className="size-4" />
            </Link>
          </div>
        </div>

        <div className="contents lg:flex lg:min-w-0 lg:flex-col">
          <p className="order-1 col-span-2 mb-0 w-fit bg-accent px-3 py-1 text-xs font-medium uppercase tracking-widest text-foreground lg:order-none lg:col-span-1 lg:mb-3">
            {content.eyebrow}
          </p>
          <SectionHeading
            id="brand-story-heading"
            className="order-2 col-span-2 whitespace-normal text-left text-3xl leading-[1.05] sm:text-4xl md:text-5xl lg:order-none lg:col-span-1 lg:whitespace-nowrap lg:text-5xl xl:text-6xl"
          >
            {content.title}
          </SectionHeading>

          <div className="order-6 col-span-2 mt-0 lg:order-none lg:col-span-1 lg:mt-5">
            <h3 className="font-heading text-2xl sm:text-3xl">{content.commitmentTitle}</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {content.commitmentIntro}
            </p>
            <dl className="mt-4 grid gap-3 sm:gap-4">
              {content.values.map((value, index) => {
                const Icon = valueIcons[index % valueIcons.length]

                return (
                  <div key={value.title} className="flex items-start gap-3">
                    <span aria-hidden="true" className="mt-0.5 flex size-8 shrink-0 items-center justify-center bg-accent text-foreground">
                      <Icon className="size-4" strokeWidth={1.5} />
                    </span>
                    <div>
                      <dt className="font-sans text-sm font-semibold text-foreground">{value.title}</dt>
                      <dd className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {value.description}
                      </dd>
                    </div>
                  </div>
                )
              })}
            </dl>
          </div>

          <figure className="order-4 relative aspect-[4/5] overflow-hidden bg-muted lg:order-none lg:mt-4 lg:aspect-[3/2] lg:w-4/5 lg:self-start">
            <Image
              src={content.detailImage}
              alt={content.detailImageAlt}
              fill
              unoptimized
              sizes="(min-width: 1280px) 650px, (min-width: 1024px) 55vw, 100vw"
              className="object-cover object-top"
            />
          </figure>
        </div>
      </div>
    </section>
  )
}
