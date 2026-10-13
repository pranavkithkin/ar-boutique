// Run against a running Next.js app or an accessible preview:
// PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/mom2-journal-disabled.spec.mjs
import { test, expect } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const paths = [
  "/journal",
  "/journal/poetry-of-handcrafted-zardozi",
  "/journal/how-to-transition-your-wardrobe-for-the-new-season",
  "/journal/the-making-of-our-latest-collection",
  "/journal/effortless-looks-for-your-festive-getaway",
  "/journal/the-architecture-of-silhouette",
  "/journal/sustainable-elegance-natural-weaves",
  "/journal/unknown-article",
]

for (const path of paths) {
  test(`direct request returns 404: ${path}`, async ({ request }) => {
    const response = await request.get(new URL(path, baseURL).href)
    expect(response.status()).toBe(404)
    const html = await response.text()
    expect(html).not.toContain('property="og:title" content="5 Effortless')
    expect(html).toMatch(/noindex/)
  })
}

for (const width of [375, 768, 1440]) {
  test(`no Journal entry points; shopping navigation remains at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(baseURL)
    await expect(page.getByRole("link", { name: "AR Boutique home" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Open Shopping Bag", exact: true })).toBeVisible()
    await expect(page.locator('a[href^="/journal"]')).toHaveCount(0)
    await expect(page.getByText("From the Journal", { exact: true })).toHaveCount(0)
    await expect(page.getByRole("link", { name: "View All New Arrivals" })).toBeVisible()
    if (width < 1024) {
      await page.getByRole("button", { name: "Menu", exact: true }).click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await expect(page.locator('a[href^="/journal"]')).toHaveCount(0)
      await expect(page.getByRole("dialog").getByRole("link", { name: "Collections", exact: true })).toBeVisible()
      await page.keyboard.press("Escape")
    }
    await page.goto(new URL("/about", baseURL).href)
    await expect(page.getByRole("heading", { name: "The Story of AR Boutique", exact: true })).toBeVisible()
    await expect(page.locator('a[href^="/journal"]')).toHaveCount(0)
    await expect(page.getByText("Read Behind The Scenes", { exact: true })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
