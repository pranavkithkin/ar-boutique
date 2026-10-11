"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PreviewImage } from "@/features/catalog/preview-catalogue";

function GalleryImage({ image, priority = false }: { image: PreviewImage; priority?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <div className="relative aspect-[4/5] bg-muted">
      {!loaded && !failed && <div className="absolute inset-0 motion-safe:animate-pulse bg-muted" aria-hidden="true" />}
      {failed ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
        <p role="status" className="text-base text-muted-foreground">This photograph could not load.</p>
        <Button type="button" variant="outline" className="min-h-12" onClick={() => { setFailed(false); setLoaded(false); setAttempt(attempt + 1); }}>Retry photograph</Button>
      </div> : <Image key={attempt} src={image.src} alt={image.alt} fill unoptimized priority={priority}
        sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain"
        onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
    </div>
  );
}

export function ProductGallery({ images }: { images: readonly PreviewImage[] }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];
  if (!current) return <div className="aspect-[4/5] bg-muted grid place-items-center text-base text-muted-foreground">Photographs awaiting upload</div>;
  const selected = images.indexOf(current);
  const previous = () => setIndex((selected - 1 + images.length) % images.length);
  const next = () => setIndex((selected + 1) % images.length);
  return (
    <section aria-label="Product photographs">
      <GalleryImage key={current.src} image={current} priority />
      <div className="flex items-center justify-between gap-3 my-3">
        <Button type="button" variant="outline" onClick={previous} disabled={images.length < 2} aria-label="Previous photograph" className="min-h-12 min-w-12"><ChevronLeft aria-hidden="true" /></Button>
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">Photograph {selected + 1} of {images.length}</p>
        <Button type="button" variant="outline" onClick={next} disabled={images.length < 2} aria-label="Next photograph" className="min-h-12 min-w-12"><ChevronRight aria-hidden="true" /></Button>
      </div>
      {images.length > 1 && <div className="flex gap-3 overflow-x-auto pb-3" aria-label="Choose a photograph">
        {images.map((image, i) => <button key={image.src} type="button" onClick={() => setIndex(i)}
          aria-label={`Show photograph ${i + 1}`} aria-pressed={i === selected}
          className={`relative w-20 aspect-[4/5] shrink-0 border-2 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${i === selected ? "border-foreground" : "border-transparent"}`}>
          <Image src={image.src} alt="" fill unoptimized sizes="80px" className="object-contain" />
          <span className="absolute bottom-0 right-0 bg-background px-1 text-sm">{i + 1}</span>
        </button>)}
      </div>}
    </section>
  );
}
