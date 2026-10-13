// node --test tests/mom1-homepage-images.test.mjs
// Source contract only: does not prove live CDN delivery or browser rendering.
import { readFile } from "node:fs/promises"
import assert from "node:assert/strict"
import { test } from "node:test"

const home = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8")
const promo = await readFile(new URL("../components/store/PromoBanner.tsx", import.meta.url), "utf8")
const blog = await readFile(new URL("../features/blog/components/BlogCard.tsx", import.meta.url), "utf8")

test("homepage has no remaining sample photos outside the untouched hero", () => {
  assert.doesNotMatch(home, /(?:promo_banner_new|journal_style|journal_bts_2|journal_inspiration)\.jpg/)
  assert.match(home, /<HeroSlider \/>/)
  assert.match(home, /imageSrc=\{prod\.imageSrc\}/)
})

test("all three journal cards use verified existing collection paths without upload or upscaling", () => {
  const urls = [...home.matchAll(/https:\/\/res\.cloudinary\.com\/q8qdyl3f\/image\/upload\/f_auto,q_auto,c_limit,w_640\/[^"\s]+/g)].map(match => match[0])
  assert.equal(urls.length, 3)
  assert.equal(new Set(urls).size, 3)
  const expected = [
    "ar-dev/products/55b382e9-331d-490e-88c1-e02bc891a4b9/85a48544-58c4-46d8-aba0-98ad9bcd54fe/jaa25dr01202",
    "ar-dev/products/8c3a236f-6172-47fe-a9cd-45b18ff9a7f9/37b3c5e3-63c4-4920-b372-57c10adb0afd/jaa25cd01945",
    "ar-dev/products/c8dd1b6b-4f84-4c50-a5be-dbfc783e2d0b/e6c009b4-87b8-4cb0-985a-4c39fe825fc8/jab24st00577",
  ]
  urls.forEach((url, index) => assert.ok(url.endsWith(expected[index])))
})

test("homepage promo banner uses dedicated promo image with cover fit", () => {
  assert.match(home, /imageSrc="\/images\/promo_banner_summer\.png"/)
  assert.match(home, /imageAlt="Sunny Garden Bouquet - Summer Refresh"/)
  assert.equal((home.match(/imageFit="cover"/g) ?? []).length, 2)
  for (const alt of [
    "Dress JAA25DR01202 - View 1",
    "Co-ord set JAA25CD01945 - View 1",
    "Set JAB24ST00577 - View 1",
  ]) assert.ok(home.includes(alt))
  assert.match(home, /imageAlt=\{post\.imageAlt\}/)
})

test("shared cards preserve existing defaults and add responsive image sizes", () => {
  for (const component of [promo, blog]) {
    assert.match(component, /imageFit = "cover"/)
    assert.match(component, /alt=\{imageAlt \?\? title\}/)
    assert.match(component, /"object-contain object-center"/)
    assert.match(component, /sizes=/)
  }
  assert.match(blog, /href=\{href\}/)
})

test("image-only change does not alter sale copy, article destinations or catalogue logic", () => {
  assert.match(home, /description="Enjoy up to 30% off selected styles\."/)
  assert.match(home, /buttonText="SHOP THE SALE"/)
  assert.match(home, /href=\{`\/journal\/\$\{post\.slug\}`\}/)
  assert.match(home, /getProductsPage\(\{\s*limit: 10,\s*sort: "newest",/)
})
