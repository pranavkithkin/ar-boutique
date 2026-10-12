/**
 * Feedback #1, #2, #5 browser regression contract.
 * Run with a Playwright installation, against a running app/preview:
 * AR_BASE_URL=http://localhost:3000 AR_PRODUCT_PATH=/collections/<product-slug>
 *   playwright test tests/e2e/mom1-gallery-zoom-brand.spec.mjs
 *
 * Use Chromium and a product with at least two images. No credentials, orders or media writes.
 * The default "/" also supports the isolated component harness.
 * This file is JavaScript so it does not add a missing test-package import to
 * the application's TypeScript build. No production dependencies are added.
 */
import { expect, test } from "@playwright/test"

const destination = () => process.env.AR_BASE_URL
  ? new URL(process.env.AR_PRODUCT_PATH || "/", process.env.AR_BASE_URL).href
  : process.env.AR_PRODUCT_PATH || "/"
const gallery = (page) => page.getByRole("region", { name: "Product images" })
const surface = (root) => root.locator("[data-zoom]")

test.beforeEach(async ({ page }) => {
  await page.goto(destination())
  await expect(gallery(page)).toBeVisible()
})

test("arrows loop in both directions and thumbnails stay selected", async ({ page }) => {
  const root = gallery(page)
  const count = await root.getByRole("button", { name: /^Show image \d+$/ }).count()
  expect(count).toBeGreaterThan(1)
  await root.getByRole("button", { name: "Previous image", exact: true }).click()
  await expect(root.getByRole("button", { name: `Show image ${count}`, exact: true })).toHaveAttribute("aria-pressed", "true")
  await root.getByRole("button", { name: "Next image", exact: true }).click()
  await expect(root.getByRole("button", { name: "Show image 1", exact: true })).toHaveAttribute("aria-pressed", "true")
  await root.getByRole("button", { name: "Next image", exact: true }).press("ArrowRight")
  await expect(root.getByRole("button", { name: "Show image 2", exact: true })).toHaveAttribute("aria-pressed", "true")
})

test("every image zooms, and image changes reset zoom", async ({ page }) => {
  const root = gallery(page)
  const count = await root.getByRole("button", { name: /^Show image \d+$/ }).count()
  for (let index = 0; index < count; index++) {
    await expect(surface(root)).toHaveAttribute("data-zoom", "1.00")
    await surface(root).press("Enter")
    await expect(surface(root)).toHaveAttribute("data-zoom", "2.00")
    await root.getByRole("button", { name: "Next image", exact: true }).click()
  }
  await expect(root.getByRole("button", { name: "Show image 1", exact: true })).toHaveAttribute("aria-pressed", "true")
})

test("arrow-key navigation preserves image focus and zoom keyboard support", async ({ page }) => {
  const root = gallery(page)
  await surface(root).focus()
  await surface(root).press("ArrowRight")
  await expect(surface(root)).toBeFocused()
  await expect(root.getByRole("button", { name: "Show image 2", exact: true })).toHaveAttribute("aria-pressed", "true")
  await surface(root).press("Space")
  await expect(surface(root)).toHaveAttribute("data-zoom", "2.00")
})

test("a failed photo has a retry action and does not disable navigation", async ({ page }) => {
  const root = gallery(page)
  await surface(root).locator("img").evaluate((image) => image.dispatchEvent(new Event("error")))
  await expect(root.getByText("We couldn't load this image.")).toBeVisible()
  await expect(root.getByRole("button", { name: "Try again", exact: true })).toBeVisible()
  await root.getByRole("button", { name: "Try again", exact: true }).click()
  await expect(surface(root)).toHaveAttribute("data-zoom", "1.00")
  await root.getByRole("button", { name: "Next image", exact: true }).click()
  await expect(root.getByRole("button", { name: "Show image 2", exact: true })).toHaveAttribute("aria-pressed", "true")
})

test("full screen keeps arrows and zoom independent; Escape restores focus", async ({ page }) => {
  const opener = page.getByRole("button", { name: "Open full-screen gallery", exact: true })
  await opener.click()
  const viewer = page.getByRole("dialog", { name: "Product gallery" })
  await expect(viewer).toBeVisible()
  await viewer.getByRole("button", { name: "Previous image", exact: true }).click()
  await viewer.getByRole("button", { name: "Next image", exact: true }).click()
  await expect(viewer.getByText(/^1 \/ \d+$/)).toBeVisible()
  await surface(viewer).click()
  await expect(surface(viewer)).toHaveAttribute("data-zoom", "2.00")
  await viewer.getByRole("button", { name: "Next image", exact: true }).click()
  await expect(surface(viewer)).toHaveAttribute("data-zoom", "1.00")
  await viewer.getByRole("button", { name: "Zoom in", exact: true }).click()
  await expect(surface(viewer)).toHaveAttribute("data-zoom", "1.50")
  await viewer.getByRole("button", { name: "Reset zoom", exact: true }).click()
  await expect(surface(viewer)).toHaveAttribute("data-zoom", "1.00")
  await page.keyboard.press("Escape")
  await expect(viewer).not.toBeVisible()
  await expect(opener).toBeFocused()
})

for (const width of [375, 768, 1440]) {
  test(`brand stays readable without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(() => window.scrollTo(0, 0))
    const home = page.getByRole("link", { name: "AR Boutique home", exact: true })
    await expect(home).toBeVisible()
    const result = await home.evaluate((link) => {
      const header = link.closest("header")
      const name = link.querySelector("span")
      const box = link.getBoundingClientRect()
      const canvas = document.createElement("canvas")
      canvas.width = canvas.height = 1
      const ctx = canvas.getContext("2d")
      const rgba = (value) => {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = value
        ctx.fillRect(0, 0, 1, 1)
        return [...ctx.getImageData(0, 0, 1, 1).data]
      }
      const background = rgba(getComputedStyle(header).backgroundColor)
      const foreground = rgba(getComputedStyle(name).color)
      const luminance = (channels) => channels.slice(0, 3).map((value) => {
        const s = value / 255
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
      const values = [luminance(background), luminance(foreground)].sort((a, b) => b - a)
      return {
        alpha: background[3],
        contrast: (values[0] + 0.05) / (values[1] + 0.05),
        fontSize: parseFloat(getComputedStyle(name).fontSize),
        withinViewport: box.left >= 0 && box.right <= window.innerWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      }
    })
    expect(result.alpha).toBe(255)
    expect(result.contrast).toBeGreaterThanOrEqual(4.5)
    expect(result.fontSize).toBeGreaterThanOrEqual(18)
    expect(result.withinViewport).toBe(true)
    expect(result.overflow).toBe(false)
    const controls = gallery(page).getByRole("button", { name: /^(Previous|Next) image$/ })
    for (const control of await controls.all()) {
      const box = await control.boundingBox()
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })
}

async function touchGesture(session, start, end) {
  const points = (coordinates) => coordinates.map(([x, y], id) => ({ x, y, id, radiusX: 1, radiusY: 1, force: 1 }))
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points(start) })
  for (let step = 1; step <= 8; step++) {
    const coordinates = start.map(([x, y], index) => [
      x + (end[index][0] - x) * step / 8,
      y + (end[index][1] - y) * step / 8,
    ])
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: points(coordinates) })
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
}

for (const fullScreen of [false, true]) {
  test(`mobile swipe and two-finger pinch work ${fullScreen ? "in full screen" : "on the product page"}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const session = await page.context().newCDPSession(page)
    await session.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 2 })
    if (fullScreen) await page.getByRole("button", { name: "Open full-screen gallery", exact: true }).click()
    const root = fullScreen ? page.getByRole("dialog", { name: "Product gallery" }) : gallery(page)
    await surface(root).scrollIntoViewIfNeeded()
    let box = await surface(root).boundingBox()
    let x = box.x + box.width / 2
    let y = Math.max(120, Math.min(650, box.y + box.height / 2))
    await touchGesture(session, [[x + 70, y]], [[x - 70, y]])
    await expect(root.getByText(/^2 \/ \d+$/)).toBeVisible()
    box = await surface(root).boundingBox()
    x = box.x + box.width / 2
    y = Math.max(120, Math.min(650, box.y + box.height / 2))
    await touchGesture(session, [[x - 30, y], [x + 30, y]], [[x - 80, y - 15], [x + 80, y + 15]])
    await expect.poll(async () => Number(await surface(root).getAttribute("data-zoom"))).toBeGreaterThan(1.5)
    await expect(root.getByText(/^2 \/ \d+$/)).toBeVisible()
    const beforePan = await surface(root).locator("img").getAttribute("style")
    await touchGesture(session, [[x, y]], [[x + 35, y + 55]])
    expect(await surface(root).locator("img").getAttribute("style")).not.toBe(beforePan)
    await expect(root.getByText(/^2 \/ \d+$/)).toBeVisible()
    await root.getByRole("button", { name: "Next image", exact: true }).click()
    await expect(surface(root)).toHaveAttribute("data-zoom", "1.00")
    await session.detach()
  })
}
