import { test, expect } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"

for (const width of [375, 768, 1440]) {
  test(`footer discovery, categories and article reading at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(baseURL)
    const journalLink = page.locator("footer").getByRole("link", { name: "Journal", exact: true })
    await expect(journalLink).toHaveAttribute("href", "/journal")
    await expect(page.locator("header").getByRole("link", { name: "Journal", exact: true })).toHaveCount(0)
    await journalLink.click()
    await expect(page.getByRole("heading", { name: "The Journal", exact: true })).toBeVisible()
    const category = page.getByRole("button", { name: "Style Guide", exact: true })
    await category.click()
    await expect(category).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByRole("status")).toContainText("1 story in Style Guide")
    await page.getByRole("link", { name: /How to Transition Your Wardrobe/ }).click()
    await expect(page.getByRole("heading", { level: 1 })).toContainText("How to Transition")
    await expect(page.getByText("The Power of the Modular Co-ord", { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByRole("link", { name: "Back to All Stories", exact: true }).click()
    await expect(page.getByRole("heading", { name: "The Journal", exact: true })).toBeVisible()
  })
}

test("unknown article shows a recovery link", async ({ page }) => {
  await page.goto(new URL("/journal/unknown-article", baseURL).href)
  await expect(page.getByRole("heading", { name: "Story Not Found", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "Explore All Stories", exact: true })).toHaveAttribute("href", "/journal")
})
