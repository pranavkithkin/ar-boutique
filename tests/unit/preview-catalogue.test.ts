import { readFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import {
  previewProducts, withheldFolders, findPreviewProduct, previewLabel,
  previewPrice, formatPreviewPrice, filterPreviewCards, type PreviewCard,
} from "../../features/catalog/preview-catalogue";

vi.mock("server-only", () => ({}));
vi.mock("../../lib/env", () => ({ env: { CLOUDINARY_CLOUD_NAME: "q8qdyl3f" } }));
import { previewImageUrl, previewImages, previewCards } from "../../services/media/preview";

const cards: PreviewCard[] = previewProducts.map((product) => ({
  ...product, displayLabel: previewLabel(product), ...previewPrice(product),
  image: { src: "fixture", alt: product.styleCode },
}));

describe("approved review catalogue", () => {
  it("contains 17 unique styles, 34 exact SKU references and 124 image keys", () => {
    expect(previewProducts).toHaveLength(17);
    expect(new Set(previewProducts.map((p) => p.slug)).size).toBe(17);
    expect(new Set(previewProducts.flatMap((p) => p.variants.map((v) => v.sku))).size).toBe(34);
    expect(new Set(previewProducts.flatMap((p) => [...p.imagePublicIds])).size).toBe(124);
  });
  it.each(withheldFolders)("does not expose held group %s", (folder) => {
    expect(findPreviewProduct(folder.toLowerCase())).toBeUndefined();
    expect(previewProducts.some((p) => p.imagePublicIds.some((id) => id.startsWith(folder)))).toBe(false);
  });
  it("never guesses a size, product name or stock", () => {
    for (const product of previewProducts) {
      expect(product).not.toHaveProperty("name");
      expect(product).not.toHaveProperty("stock");
      for (const variant of product.variants) {
        expect(variant.size).toBeNull();
        expect(variant).not.toHaveProperty("stock");
      }
    }
  });
  it("resolves distinct slugs and rejects unknown and prototype-like values", () => {
    expect(findPreviewProduct("jaa25cd01945")?.styleCode).toBe("JAA25CD01945");
    expect(findPreviewProduct("jaa25dr01112")?.styleCode).toBe("JAA25DR01112");
    for (const slug of ["unknown", "__proto__", "constructor", "JAA25CD01945", "../"]) {
      expect(findPreviewProduct(slug)).toBeUndefined();
    }
  });
  it("preserves exact client text and supplier attribution", () => {
    const top = findPreviewProduct("jne4207")!;
    expect(top.details).toContainEqual(["Top Category", "Regualr"]);
    expect(top.description).toContain("by Janasya");
    expect(top.variants.map((v) => v.sku)).toEqual(["JNE4207-TP-M", "JNE4207-TP-XL"]);
    expect(previewLabel(findPreviewProduct("jaa25kb01295")!)).toBe("Off White Set");
  });
  it("retains source filename gaps instead of making up image URLs", () => {
    expect(findPreviewProduct("jaa25kb01295")!.imagePublicIds).not.toContain("JAA25KB01295-6");
    expect(findPreviewProduct("jac25st01935")!.imagePublicIds).not.toContain("JAC25ST01935-4");
    expect(findPreviewProduct("jaa25kb02100")!.imagePublicIds).toEqual(["JAA25KB02100"]);
  });
  it("formats approved AED prices without inventing discounts", () => {
    expect(previewPrice(findPreviewProduct("jaa25cd01945")!).priceLabel).toBe("AED 99");
    expect(formatPreviewPrice(24950)).toBe("AED 249.50");
    expect(formatPreviewPrice(125000)).toBe("AED 1,250");
    expect(() => formatPreviewPrice(-1)).toThrow();
    expect(() => formatPreviewPrice(1.5)).toThrow();
    expect(() => formatPreviewPrice(NaN)).toThrow();
    expect(() => formatPreviewPrice(Infinity)).toThrow();
    expect(previewProducts.some((p) => "compareAtPrice" in p)).toBe(false);
  });
  it("uses From when supplied SKU prices differ", () => {
    expect(previewPrice({ ...previewProducts[0], variants: [
      { sku: "test-a", size: null, priceFils: 9000 },
      { sku: "test-b", size: null, priceFils: 10000 },
    ] }).priceLabel).toBe("From AED 90");
    expect(() => previewPrice({ ...previewProducts[0], variants: [] })).toThrow();
  });
});

describe("preview filters", () => {
  it("combines exact garment/colour filtering with case-insensitive search", () => {
    const result = filterPreviewCards(cards, { garment: "Dress", colour: "Green", query: " JAA25 " });
    expect(result.map((c) => c.styleCode)).toEqual(["JAA25DR01112"]);
    expect(filterPreviewCards(cards, { query: "nonexistent" })).toEqual([]);
    expect(filterPreviewCards(cards, { colour: "green" })).toEqual([]);
  });
  it("sorts numerically without mutating the input or changing price labels", () => {
    const before = cards.map((c) => c.styleCode);
    const asc = filterPreviewCards(cards, { sort: "price-asc" });
    const desc = filterPreviewCards(cards, { sort: "price-desc" });
    expect(asc[0].priceFils).toBe(8000);
    expect(desc[0].priceFils).toBe(14200);
    expect(cards.map((c) => c.styleCode)).toEqual(before);
    expect(filterPreviewCards(cards, {})).toEqual(cards);
  });
});

describe("read-only staging media", () => {
  it("creates only approved original delivery URLs without transformations", () => {
    expect(previewImageUrl("JAA25CD01945")).toBe("https://res.cloudinary.com/q8qdyl3f/image/upload/JAA25CD01945");
    for (const key of ["../secret", "unknown", "J0395-DR", "JAA25CD01945?x=1"]) {
      expect(() => previewImageUrl(key)).toThrow("Unknown preview image");
    }
    expect(previewCards()).toHaveLength(17);
    expect(previewImages(previewProducts[0])[0].alt).toContain("photograph 1");
  });
  it("fails closed if the deployment uses another Cloudinary environment", async () => {
    const { env } = await import("../../lib/env");
    const previous = env.CLOUDINARY_CLOUD_NAME;
    try {
      Object.assign(env, { CLOUDINARY_CLOUD_NAME: "another-cloud" });
      expect(() => previewImageUrl("JAA25CD01945")).toThrow("approved staging media");
    } finally {
      Object.assign(env, { CLOUDINARY_CLOUD_NAME: previous });
    }
  });
});

describe("preview integration source checks (not browser tests)", () => {
  it("uses notFound for unknown slugs and disables purchases", () => {
    const page = readFileSync("app/collections/[slug]/page.tsx", "utf8");
    const info = readFileSync("components/store/ProductInfo.tsx", "utf8");
    expect(page).toContain("if (!product) notFound()");
    expect(page).not.toContain("MOCK_PRODUCT");
    expect(info).toContain("<Button disabled");
    expect(info).not.toContain("L-38");
    expect(info).toContain("Awaiting confirmation");
  });
  it("keeps preview pages unindexed and avoids old dead purchase cards", () => {
    for (const path of ["app/page.tsx", "app/collections/page.tsx", "app/collections/[slug]/page.tsx"]) {
      const source = readFileSync(path, "utf8");
      expect(source).toContain("index: false");
      expect(source).not.toContain("MOCK_PRODUCT");
      expect(source).not.toContain('from "@/components/store/ProductCard"');
      expect(source).not.toContain('href="#"');
      expect(source).toContain("PreviewFooter");
    }
  });
});
