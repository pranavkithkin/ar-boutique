import Link from "next/link";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreButton } from "@/components/store/StoreButton";
import type { PreviewPage } from "@/features/content/preview-pages";

export function ComingSoon({ page }: { page: PreviewPage }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8 md:py-16">
        <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring">Home</Link>
          <span aria-hidden="true">/</span><span aria-current="page">{page.title}</span>
        </nav>
        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <p className="mb-4 text-sm text-muted-foreground">Content awaiting approval</p>
            <h1 className="font-heading text-4xl leading-tight md:text-5xl">{page.title}</h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">{page.summary}</p>
            <StoreButton nativeButton={false} render={<Link href="/collections" />} className="mt-8 px-6">
              Browse the collection
            </StoreButton>
          </div>
          <section aria-labelledby="pending-content-heading" className="bg-secondary p-6 md:p-8">
            <h2 id="pending-content-heading" className="font-heading text-2xl">Before this page is published</h2>
            <ul className="mt-5 list-disc space-y-3 pl-5 text-base text-muted-foreground">
              {page.pending.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">These details are not yet confirmed. This page is part of a catalogue review, not a completed store service.</p>
          </section>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
