import { expect, test } from "@playwright/test"

// Use a configured Playwright baseURL for the Next preview or isolated layout harness.
// The harness uses representative local artwork and an adapted autoplay module.
// Run against the actual preview to accept the real images and complete integration.
const viewports = [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 640, height: 900 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1080 },
]

const destinations = [
  "Timeless Traditions Fashion Heritage",
  "Timeless Boutique Fashion Collection",
  "Timeless Style, Modern Elegance",
]

const hero = (page) => page.locator('section').filter({
  has: page.getByRole("link", { name: "View collection: Timeless Traditions Fashion Heritage", exact: true }),
}).first()

async function visit(page, viewport) {
  await page.setViewportSize(viewport)
  await page.goto("/")
  await page.evaluate(() => document.fonts.ready)
  await expect(hero(page)).toBeVisible()
}

for (const viewport of viewports) {
  test(`R2-04 all three slides have the modest new height at ${viewport.width}px`, async ({ page }) => {
    await visit(page, viewport)
    const banner = hero(page)
    const links = banner.locator('a[aria-label^="View collection:"]')
    await expect(links).toHaveCount(3)

    const sizes = await links.evaluateAll((elements) => elements.map((element) => {
      const image = element.querySelector("img")
      const frame = image.parentElement.getBoundingClientRect()
      return {
        width: frame.width,
        height: frame.height,
        fit: getComputedStyle(image).objectFit,
        sizes: image.getAttribute("sizes"),
        href: element.getAttribute("href"),
      }
    }))

    for (const slide of sizes) {
      const ratio = viewport.width < 768 ? 16 / 9 : 2
      expect(Math.abs(slide.height - slide.width / ratio)).toBeLessThan(1)
      expect(slide.height).toBeGreaterThan(slide.width / 2.13)
      expect(slide.height / (slide.width / 2.13)).toBeLessThan(1.21)
      expect(slide.fit).toBe("cover")
      expect(slide.sizes).toBe("100vw")
      expect(slide.href).toBe("/collections")
    }
    expect(Math.max(...sizes.map((slide) => slide.height))
      - Math.min(...sizes.map((slide) => slide.height))).toBeLessThan(1)

    const viewportWidth = await banner.evaluate((element) => ({
      width: element.getBoundingClientRect().width,
      documentWidth: document.documentElement.clientWidth,
      documentScroll: document.documentElement.scrollWidth,
    }))
    // DOMRects may contain a subpixel at fractional device scales; scrollWidth must not grow.
    expect(viewportWidth.width).toBeLessThanOrEqual(viewportWidth.documentWidth + 1)
    expect(viewportWidth.documentScroll).toBeLessThanOrEqual(viewportWidth.documentWidth)
  })
}

test("R2-04 keeps the next section on the first phone screen", async ({ page }) => {
  await visit(page, { width: 375, height: 812 })
  const banner = await hero(page).boundingBox()
  expect(banner.y + banner.height).toBeLessThan(400)
  const nextHeading = page.getByRole("heading", { name: "Shop by Category", exact: true })
  await expect(nextHeading).toBeVisible()
  const heading = await nextHeading.boundingBox()
  expect(heading.y + heading.height).toBeLessThan(812)
})

test("R2-04 preserves the accessible link for each slide and visible keyboard focus", async ({ page }) => {
  await visit(page, { width: 375, height: 812 })
  for (const title of destinations) {
    await expect(hero(page).getByRole("link", { name: `View collection: ${title}`, exact: true }))
      .toHaveAttribute("href", "/collections")
  }
  const first = hero(page).getByRole("link", { name: `View collection: ${destinations[0]}`, exact: true })
  await first.focus()
  await expect(first).toBeFocused()
  await expect(first).toHaveClass(/focus-visible:ring-2/)
  await page.keyboard.press("ArrowRight")
  await expect.poll(async () => {
    const next = await hero(page).getByRole("link", { name: `View collection: ${destinations[1]}`, exact: true }).boundingBox()
    return Math.abs(next.x)
  }).toBeLessThan(1)
})

test("R2-04 recalculates banner height cleanly when the viewport changes", async ({ page }) => {
  await visit(page, { width: 390, height: 844 })
  await page.setViewportSize({ width: 844, height: 390 })
  await expect.poll(async () => {
    const box = await hero(page).boundingBox()
    return Math.abs(box.height - box.width / 2)
  }).toBeLessThan(1)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(async () => {
    const box = await hero(page).boundingBox()
    return Math.abs(box.height - box.width * 9 / 16)
  }).toBeLessThan(1)
})
