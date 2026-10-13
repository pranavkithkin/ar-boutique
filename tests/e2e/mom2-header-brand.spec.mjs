import { expect, test } from "@playwright/test"

// Configure baseURL in Playwright for the Next preview. No new dependency is added.
// If present, the isolated QA fixture adapts routing only; assertions stay identical.
const widths = [320, 375, 390, 640, 768, 1024, 1440]

async function visit(page, pathname = "/") {
  await page.goto("/")
  if (pathname !== "/") {
    const isolated = await page.evaluate(() => typeof window.__headerQaSetPathname === "function")
    if (isolated) {
      await page.evaluate((path) => window.__headerQaSetPathname(path), pathname)
    } else {
      await page.goto(pathname)
    }
  }
  await page.evaluate(() => document.fonts.ready)
}

async function expectHorizontalBrand(page) {
  const header = page.locator("header").first()
  const brand = header.getByRole("link", { name: "AR Boutique home", exact: true })
  const wordmark = brand.getByText("AR Boutique", { exact: true })
  await expect(wordmark).toBeVisible()
  await expect(brand).toHaveAttribute("href", "/")
  await expect.poll(() => brand.evaluate((element) =>
    [...element.querySelectorAll("img")].filter((image) => {
      const style = getComputedStyle(image)
      return style.display !== "none" && Number(style.opacity) > 0.95
        && image.complete && image.naturalWidth > 0
    }).length
  )).toBe(1)

  const geometry = await brand.evaluate((element) => {
    const text = element.querySelector("span")
    const logo = element.querySelector("div")
    const rect = (node) => {
      const { x, y, width, height, right, bottom } = node.getBoundingClientRect()
      return { x, y, width, height, right, bottom }
    }
    return {
      link: rect(element),
      logo: rect(logo),
      text: rect(text),
      wrap: getComputedStyle(text).whiteSpace,
      images: [...element.querySelectorAll("img")].filter((image) => {
        const style = getComputedStyle(image)
        return style.display !== "none" && Number(style.opacity) > 0.95
      }).map((image) => ({ loaded: image.complete && image.naturalWidth > 0 })),
    }
  })

  expect(geometry.wrap).toBe("nowrap")
  expect(geometry.text.x).toBeGreaterThanOrEqual(geometry.logo.right)
  expect(Math.abs(
    geometry.text.y + geometry.text.height / 2
      - geometry.logo.y - geometry.logo.height / 2
  )).toBeLessThan(1)
  expect(geometry.logo.x).toBeGreaterThanOrEqual(geometry.link.x - 1)
  expect(geometry.text.right).toBeLessThanOrEqual(geometry.link.right + 1)
  expect(geometry.link.height).toBeGreaterThanOrEqual(44)
  expect(geometry.images).toHaveLength(1)
  expect(geometry.images[0].loaded).toBe(true)

  const controls = header.locator('button[aria-label="Menu"]:visible, button[aria-label="Search"]:visible, a[aria-label="Account"]:visible, button[aria-label="Open Shopping Bag"]:visible')
  for (let index = 0; index < await controls.count(); index += 1) {
    const control = await controls.nth(index).boundingBox()
    expect(control.width).toBeGreaterThanOrEqual(44)
    expect(control.height).toBeGreaterThanOrEqual(44)
    expect(
      control.x + control.width <= geometry.logo.x + 1
        || control.x >= geometry.text.right - 1
    ).toBe(true)
  }

  const overflow = await header.evaluate((element) => ({
    scroll: element.scrollWidth,
    client: element.clientWidth,
  }))
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.client)
}

for (const width of widths) {
  test(`R2-01 homepage brand stays side by side at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await visit(page)
    await expectHorizontalBrand(page)
  })
}

for (const width of [375, 768, 1440]) {
  test(`R2-01 internal-page brand stays side by side at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await visit(page, "/collections")
    await expectHorizontalBrand(page)
  })
}

test("R2-01 desktop branding survives hover and scroll transitions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await visit(page)
  await expectHorizontalBrand(page)
  await page.getByRole("link", { name: "AR Boutique home" }).hover()
  await expect.poll(async () => page.getByRole("link", { name: "AR Boutique home" })
    .locator("span").evaluate((element) => getComputedStyle(element).color))
    .not.toBe("rgb(255, 255, 255)")
  await expectHorizontalBrand(page)
  await page.mouse.move(0, 500)
  await page.evaluate(() => window.scrollTo(0, 200))
  await expect.poll(async () => page.getByRole("link", { name: "AR Boutique home" })
    .locator("span").evaluate((element) => getComputedStyle(element).color))
    .not.toBe("rgb(255, 255, 255)")
  await expectHorizontalBrand(page)
})

test("R2-01 mobile menu and bag remain reachable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await visit(page)
  await page.getByRole("button", { name: "Menu", exact: true }).click()
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Mobile Navigation" })).toBeAttached()
  await page.getByRole("dialog").getByRole("link", { name: "Home", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expectHorizontalBrand(page)
  await page.getByRole("button", { name: "Open Shopping Bag", exact: true }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
})

test("R2-01 home link supports keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await visit(page)
  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")
  const brand = page.getByRole("link", { name: "AR Boutique home", exact: true })
  await expect(brand).toBeFocused()
  const focus = await brand.evaluate((element) => ({
    visible: element.matches(":focus-visible"),
    width: getComputedStyle(element).outlineWidth,
  }))
  expect(focus.visible).toBe(true)
  expect(parseFloat(focus.width)).toBeGreaterThanOrEqual(1)
})
