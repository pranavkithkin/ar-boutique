import "server-only";
import { env } from "../../lib/env";
import {
  PREVIEW_CLOUD_NAME, previewProducts, previewLabel, previewPrice,
  type PreviewProduct, type PreviewImage, type PreviewCard,
} from "../../features/catalog/preview-catalogue";

// Temporary read-only delivery adapter. No provider credentials, API calls,
// transformations, signed uploads, database writes or asset mutations.
const allowed = new Set(previewProducts.flatMap((product) => [...product.imagePublicIds]));

export function previewImageUrl(publicId: string): string {
  if (env.CLOUDINARY_CLOUD_NAME !== PREVIEW_CLOUD_NAME)
    throw new Error("Preview images require the approved staging media environment.");
  if (!allowed.has(publicId) || !/^[A-Za-z0-9_-]+$/.test(publicId))
    throw new Error("Unknown preview image.");
  return `https://res.cloudinary.com/${PREVIEW_CLOUD_NAME}/image/upload/${publicId}`;
}

export function previewImages(product: PreviewProduct): PreviewImage[] {
  return product.imagePublicIds.map((key, index) => ({
    src: previewImageUrl(key),
    // Do not infer front/back/detail roles from filename suffixes.
    alt: `${previewLabel(product)}, style ${product.styleCode}, photograph ${index + 1}`,
  }));
}

export function previewCards(): PreviewCard[] {
  return previewProducts.map((product) => ({
    styleCode: product.styleCode, slug: product.slug,
    colour: product.colour, garment: product.garment,
    displayLabel: previewLabel(product), ...previewPrice(product),
    image: previewImages(product)[0],
  }));
}
