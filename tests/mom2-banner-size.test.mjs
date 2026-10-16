import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const source = readFileSync(new URL("../components/store/HeroSlider.tsx", import.meta.url), "utf8")

test("R2-04 makes the existing wide banner modestly taller at each breakpoint", () => {
  assert.match(source, /md:aspect-\[2\/1\]/)
  assert.match(source, /slide\.mobileImageSrc \? 'aspect-\[4\/5\]' : 'aspect-video'/)
  assert.doesNotMatch(source, /aspect-\[2\.13\/1\]/)
  for (const width of [320, 375, 390, 640, 768, 1024, 1440]) {
    const previousHeight = width / 2.13
    const newHeight = width / (width < 768 ? 5 / 4 : 2)
    assert.ok(newHeight > previousHeight)
  }
})

test("R2-04 preserves all three existing images in their existing order", () => {
  const sources = [...source.matchAll(/imageSrc: "([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(sources, [
    "/images/hero_traditions_desktop.png",
    "/images/hero_boutique_desktop.png",
    "/images/hero_elegance_desktop.png",
  ])
  assert.match(source, /mobileImageSrc:\s*"\/images\/hero_traditions_mobile\.png"/)
})

test("R2-04 preserves all collection destinations and accessible link names", () => {
  assert.equal((source.match(/href: "\/collections"/g) ?? []).length, 3)
  assert.match(source, /aria-label=\{`View collection: \$\{slide\.alt\}`\}/)
  assert.match(source, /focus-visible:ring-2 focus-visible:ring-ring/)
})

test("R2-04 retains non-distorting cover fitting for every currently active image", () => {
  assert.match(source, /object-cover object-center \$\{slide\.mobileImageSrc/)
  assert.equal((source.match(/sizes="100vw"/g) ?? []).length, 2)
  assert.equal((source.match(/priority=\{slide\.id === 1\}/g) ?? []).length, 2)
})

test("R2-04 leaves carousel timing, looping and interaction policy unchanged", () => {
  assert.match(source, /Autoplay\(\{ delay: 3000, stopOnInteraction: false \}\)/)
  assert.match(source, /opts=\{\{ loop: true \}\}/)
  assert.match(source, /plugins=\{\[pluginAutoplay\]\}/)
})
